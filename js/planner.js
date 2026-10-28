// planner.js - itinerary algorithm (plain JavaScript, runs in the browser)
// Steps: 1) knapsack picks attractions within budget
//        2) nearest-neighbour builds a route, 3) 2-opt improves it

const SPEED_KMH = 30;          // average city travel speed
const MAX_STOPS_PER_DAY = 3;
const TRANSPORT_PER_DAY = 750; // flat local transport cost per day (Rs)

// Straight-line distance between two points (haversine formula)
function distanceKm(a, b) {
  const R = 6371;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Total distance of visiting the stops in the given order
function routeLength(route) {
  let total = 0;
  for (let i = 0; i < route.length - 1; i++) {
    total += distanceKm(route[i], route[i + 1]);
  }
  return total;
}

// 0/1 knapsack: choose attractions with maximum total rating within the budget
function chooseByBudget(items, budget, travelers) {
  const UNIT = 50; // work in units of Rs 50 to keep the table small
  const cap = Math.max(0, Math.floor(budget / UNIT));
  const n = items.length;
  const w = items.map(a => Math.ceil(a.cost * travelers / UNIT));

  const dp = [];
  for (let i = 0; i <= n; i++) dp.push(new Array(cap + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    for (let c = 0; c <= cap; c++) {
      dp[i][c] = dp[i - 1][c];
      if (w[i - 1] <= c) {
        const withItem = dp[i - 1][c - w[i - 1]] + items[i - 1].rating;
        if (withItem > dp[i][c]) dp[i][c] = withItem;
      }
    }
  }

  // walk back through the table to find which items were taken
  const chosen = [];
  let c = cap;
  for (let i = n; i >= 1; i--) {
    if (dp[i][c] !== dp[i - 1][c]) {
      chosen.unshift(items[i - 1]);
      c -= w[i - 1];
    }
  }
  return chosen;
}

// Nearest neighbour: always go to the closest stop not yet visited
function nearestNeighbour(stops) {
  if (stops.length < 2) return stops.slice();
  const left = stops.slice();
  const route = [left.shift()];
  while (left.length > 0) {
    const last = route[route.length - 1];
    let bestIndex = 0;
    let bestDist = Infinity;
    for (let i = 0; i < left.length; i++) {
      const d = distanceKm(last, left[i]);
      if (d < bestDist) { bestDist = d; bestIndex = i; }
    }
    route.push(left.splice(bestIndex, 1)[0]);
  }
  return route;
}

// 2-opt: reverse a part of the route if that makes the route shorter
function twoOpt(route) {
  let best = route.slice();
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 1; i < best.length - 1; i++) {
      for (let j = i + 1; j < best.length; j++) {
        const candidate = best.slice(0, i)
          .concat(best.slice(i, j + 1).reverse(), best.slice(j + 1));
        if (routeLength(candidate) < routeLength(best) - 1e-9) {
          best = candidate;
          improved = true;
        }
      }
    }
  }
  return best;
}

// Brute force: try every order (only OK for about 8 stops or fewer)
function bruteForce(stops) {
  let best = stops.slice();
  let bestLen = routeLength(best);
  function permute(current, remaining) {
    if (remaining.length === 0) {
      const len = routeLength(current);
      if (len < bestLen) { bestLen = len; best = current.slice(); }
      return;
    }
    for (let i = 0; i < remaining.length; i++) {
      const rest = remaining.slice(0, i).concat(remaining.slice(i + 1));
      permute(current.concat([remaining[i]]), rest);
    }
  }
  permute([], stops);
  return best;
}

function toClock(minutes) {
  const h = Math.floor(minutes / 60) % 24;
  const m = Math.round(minutes % 60);
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}

// Build the full plan object used by the itinerary, booking and profile pages
function buildPlan(dest, pkg, attractions, startDate, days, travelers, budget) {
  const fare = Math.round(pkg.pricePerPerson / pkg.days * days * travelers);
  const transport = TRANSPORT_PER_DAY * days;
  const left = budget - fare - transport;
  if (left < 0) {
    return { error: 'Budget too low. The package fare and transport alone cost Rs ' +
             (fare + transport).toLocaleString('en-IN') + '.' };
  }

  // 1. pick attractions that fit the budget
  let chosen = chooseByBudget(attractions, left, travelers);
  // keep the days reasonable: drop the lowest rated until it fits
  while (chosen.length > days * MAX_STOPS_PER_DAY) {
    let low = 0;
    for (let i = 1; i < chosen.length; i++) {
      if (chosen[i].rating < chosen[low].rating) low = i;
    }
    chosen.splice(low, 1);
  }

  // 2. order the stops
  const naiveKm = routeLength(chosen);
  const route = twoOpt(nearestNeighbour(chosen));
  const totalKm = routeLength(route);

  // 3. split the route into days (nearby stops stay on the same day)
  const base = Math.floor(route.length / days);
  const extra = route.length % days;
  const daysPlan = [];
  let index = 0;
  for (let d = 0; d < days; d++) {
    const count = base + (d < extra ? 1 : 0);
    const todays = route.slice(index, index + count);
    index += count;
    let time = 9 * 60;
    const stops = todays.map((a, i) => {
      const stop = { name: a.name, time: toClock(time), cost: a.cost * travelers };
      time += a.duration * 60;
      if (i < todays.length - 1) {
        time += Math.round(distanceKm(a, todays[i + 1]) / SPEED_KMH * 60);
      }
      return stop;
    });
    daysPlan.push({ day: d + 1, stops: stops });
  }

  const entry = chosen.reduce((sum, a) => sum + a.cost * travelers, 0);
  const skipped = attractions.filter(a => !chosen.includes(a)).map(a => a.name);
  const savedKm = naiveKm - totalKm;

  return {
    destId: dest.id, destTitle: dest.title, packageName: pkg.name,
    startDate: startDate, days: days, travelers: travelers, budget: budget,
    fare: fare, entry: entry, transport: transport, total: fare + entry + transport,
    daysPlan: daysPlan, skipped: skipped,
    totalKm: totalKm, naiveKm: naiveKm, savedKm: savedKm,
    savedPercent: naiveKm > 0 ? Math.round(savedKm / naiveKm * 100) : 0
  };
}

// lets us test the file with node
if (typeof module !== 'undefined') {
  module.exports = { distanceKm, routeLength, chooseByBudget, nearestNeighbour, twoOpt, bruteForce, buildPlan };
}
