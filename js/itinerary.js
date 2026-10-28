// itinerary.js - itinerary builder page
let destinations = [];
let packages = [];
let attractions = [];
let currentPlan = null;

const form = document.getElementById('plannerForm');
const select = document.getElementById('dest');
const result = document.getElementById('result');

function showPlan(plan) {
  let html = '<div class="result-head"><h2>' + plan.days + '-day plan for ' + esc(plan.destTitle) + '</h2>' +
    '<p>' + money(plan.total) + ' of ' + money(plan.budget) + ' budget used \u00B7 ' +
    plan.travelers + ' travelers \u00B7 ' + dateRange(plan.startDate, plan.days) + '</p></div>';
  html += renderDays(plan);

  html += '<div class="day-card"><h3>Cost breakdown</h3><ul class="breakdown">' +
    '<li><span>Package fare (' + esc(plan.packageName) + ')</span><span>' + money(plan.fare) + '</span></li>' +
    '<li><span>Entry tickets</span><span>' + money(plan.entry) + '</span></li>' +
    '<li><span>Local transport</span><span>' + money(plan.transport) + '</span></li></ul></div>';

  if (plan.savedKm > 0.05) {
    html += '<p class="route-note">Route reordered with nearest-stop + 2-opt: ' + plan.totalKm.toFixed(1) +
      ' km instead of ' + plan.naiveKm.toFixed(1) + ' km (' + plan.savedPercent + '% less travel).</p>';
  } else {
    html += '<p class="route-note">Total route is ' + plan.totalKm.toFixed(1) + ' km.</p>';
  }
  if (plan.skipped.length > 0) {
    html += '<p class="route-note">Left out to fit your budget/days: ' + plan.skipped.map(esc).join(', ') + '.</p>';
  }
  html += '<p class="msg" id="planMsg"></p>' +
    '<div class="result-actions"><button class="btn-secondary" id="saveBtn">Save itinerary</button>' +
    '<button class="btn-primary" id="bookBtn">Continue to booking</button></div>';
  result.innerHTML = html;

  document.getElementById('saveBtn').addEventListener('click', savePlan);
  document.getElementById('bookBtn').addEventListener('click', () => {
    localStorage.setItem(KEYS.pending, JSON.stringify(currentPlan));
    location.href = 'booking.html';
  });
}

function savePlan() {
  if (!getSession()) {
    alert('Please log in to save your itinerary.');
    location.href = 'login.html?next=itinerary.html';
    return;
  }
  const list = getUserList('itineraries');
  list.push({ id: Date.now(), savedOn: new Date().toISOString(), plan: currentPlan });
  setUserList('itineraries', list);
  const msg = document.getElementById('planMsg');
  msg.className = 'msg ok';
  msg.textContent = 'Itinerary saved. You can see it under My Trips.';
}

form.addEventListener('submit', e => {
  e.preventDefault();
  const destId = select.value;
  const startDate = document.getElementById('start').value;
  const days = Number(document.getElementById('days').value);
  const travelers = Number(document.getElementById('travelers').value);
  const budget = Number(document.getElementById('budget').value);

  if (!startDate || days < 1 || days > 14 || travelers < 1 || budget <= 0) {
    result.innerHTML = '<p class="msg">Please enter valid dates, days (1-14), travelers and budget.</p>';
    return;
  }

  const dest = destinations.find(d => d.id === destId);
  const pkg = packages.find(p => p.destId === destId);
  const list = attractions.filter(a => a.destId === destId);

  const plan = buildPlan(dest, pkg, list, startDate, days, travelers, budget);
  if (plan.error) {
    result.innerHTML = '<p class="msg">' + plan.error + ' Increase the budget or reduce days/travelers.</p>';
    return;
  }
  currentPlan = plan;
  showPlan(plan);
});

Promise.all([loadJSON('data/destinations.json'), loadJSON('data/packages.json'), loadJSON('data/attractions.json')])
  .then(r => {
    destinations = r[0];
    packages = r[1];
    attractions = r[2];
    select.innerHTML = destinations.map(d => '<option value="' + d.id + '">' + d.title + '</option>').join('');
    const wanted = new URLSearchParams(location.search).get('dest');
    if (wanted) select.value = wanted;
  })
  .catch(() => showDataError(result));
