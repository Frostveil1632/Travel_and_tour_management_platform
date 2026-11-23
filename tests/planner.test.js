const fs = require('fs');
const {
  distanceKm, routeLength, chooseByBudget, nearestNeighbour, twoOpt, bruteForce, buildPlan
} = require('../js/planner.js');

const destinations = JSON.parse(fs.readFileSync('data/destinations.json'));
const packages = JSON.parse(fs.readFileSync('data/packages.json'));
const attractions = JSON.parse(fs.readFileSync('data/attractions.json'));

const jaipur = destinations.find(d => d.id === 'jaipur');
const jaipurPkg = packages.find(p => p.destId === 'jaipur');
const jaipurStops = attractions.filter(a => a.destId === 'jaipur');

describe('distance', () => {
  test('same point is 0 km', () => {
    expect(distanceKm({ lat: 26.9, lng: 75.8 }, { lat: 26.9, lng: 75.8 })).toBeCloseTo(0);
  });
  test('Jaipur to Delhi is roughly 235 km in a straight line', () => {
    const d = distanceKm({ lat: 26.9124, lng: 75.7873 }, { lat: 28.6139, lng: 77.2090 });
    expect(d).toBeGreaterThan(215);
    expect(d).toBeLessThan(255);
  });
  test('routeLength of one stop is 0', () => {
    expect(routeLength([jaipurStops[0]])).toBe(0);
  });
});

describe('knapsack (chooseByBudget)', () => {
  const items = [
    { name: 'A', cost: 500, rating: 5 },
    { name: 'B', cost: 300, rating: 3 },
    { name: 'C', cost: 0, rating: 2 },
    { name: 'D', cost: 400, rating: 4 }
  ];
  test('never goes over the budget', () => {
    const chosen = chooseByBudget(items, 700, 1);
    const spent = chosen.reduce((sum, a) => sum + a.cost, 0);
    expect(spent).toBeLessThanOrEqual(700);
  });
  test('picks the best value for the money', () => {
    const names = chooseByBudget(items, 900, 1).map(a => a.name).sort();
    expect(names).toEqual(['A', 'C', 'D']); // rating 11 beats any other combination
  });
  test('free attractions are always taken', () => {
    const names = chooseByBudget(items, 0, 1).map(a => a.name);
    expect(names).toEqual(['C']);
  });
  test('cost is multiplied by the number of travelers', () => {
    const names = chooseByBudget(items, 900, 2).map(a => a.name);
    const spent = items.filter(a => names.includes(a.name)).reduce((s, a) => s + a.cost * 2, 0);
    expect(spent).toBeLessThanOrEqual(900);
  });
});

describe('routing', () => {
  test('nearestNeighbour visits every stop once', () => {
    const route = nearestNeighbour(jaipurStops);
    expect(route.length).toBe(jaipurStops.length);
    expect(new Set(route.map(s => s.id)).size).toBe(jaipurStops.length);
  });
  test('2-opt is never longer than nearest neighbour', () => {
    const nn = nearestNeighbour(jaipurStops);
    expect(routeLength(twoOpt(nn))).toBeLessThanOrEqual(routeLength(nn) + 1e-9);
  });
  test('brute force is never longer than 2-opt', () => {
    const opt = routeLength(twoOpt(nearestNeighbour(jaipurStops)));
    expect(routeLength(bruteForce(jaipurStops))).toBeLessThanOrEqual(opt + 1e-9);
  });
  test('2-opt route is shorter than the naive order for Jaipur', () => {
    expect(routeLength(twoOpt(nearestNeighbour(jaipurStops)))).toBeLessThan(routeLength(jaipurStops));
  });
  test('empty and single lists do not crash', () => {
    expect(nearestNeighbour([])).toEqual([]);
    expect(twoOpt(nearestNeighbour([jaipurStops[0]])).length).toBe(1);
  });
});

describe('buildPlan', () => {
  test('stays within the budget', () => {
    const plan = buildPlan(jaipur, jaipurPkg, jaipurStops, '2026-11-14', 3, 2, 30000);
    expect(plan.error).toBeUndefined();
    expect(plan.total).toBeLessThanOrEqual(30000);
  });
  test('creates one entry per day', () => {
    const plan = buildPlan(jaipur, jaipurPkg, jaipurStops, '2026-11-14', 3, 2, 30000);
    expect(plan.daysPlan.length).toBe(3);
  });
  test('no more than 3 stops per day', () => {
    const plan = buildPlan(jaipur, jaipurPkg, jaipurStops, '2026-11-14', 1, 1, 50000);
    expect(plan.daysPlan[0].stops.length).toBeLessThanOrEqual(3);
  });
  test('returns an error when the budget is too low', () => {
    const plan = buildPlan(jaipur, jaipurPkg, jaipurStops, '2026-11-14', 3, 2, 5000);
    expect(plan.error).toBeDefined();
  });
  test('a smaller budget leaves out some attractions', () => {
    const rich = buildPlan(jaipur, jaipurPkg, jaipurStops, '2026-11-14', 3, 2, 30000);
    const poor = buildPlan(jaipur, jaipurPkg, jaipurStops, '2026-11-14', 3, 2, 24500);
    expect(poor.skipped.length).toBeGreaterThan(rich.skipped.length);
  });
  test('total = fare + entry + transport', () => {
    const plan = buildPlan(jaipur, jaipurPkg, jaipurStops, '2026-11-14', 3, 2, 30000);
    expect(plan.total).toBe(plan.fare + plan.entry + plan.transport);
  });
  test('works for every destination with a normal budget', () => {
    destinations.forEach(d => {
      const pkg = packages.find(p => p.destId === d.id);
      const stops = attractions.filter(a => a.destId === d.id);
      const plan = buildPlan(d, pkg, stops, '2026-11-14', 3, 2, 40000);
      expect(plan.error).toBeUndefined();
      expect(plan.total).toBeLessThanOrEqual(40000);
    });
  });
});
