// common.js - helpers shared by every page

const KEYS = {
  session: 'waypoint_session',
  extraUsers: 'waypoint_extra_users',
  pending: 'waypoint_pending_plan'
};

// load a JSON file from the data folder
function loadJSON(path) {
  return fetch(path).then(res => {
    if (!res.ok) throw new Error('Could not load ' + path);
    return res.json();
  });
}

// shown when fetch fails (usually because the page was opened by double-clicking)
function showDataError(element) {
  element.innerHTML = '<div class="error-box">Could not load the data files. ' +
    'Open the site with VS Code "Live Server" (or run <code>python -m http.server</code> ' +
    'in this folder) instead of double-clicking the HTML file.</div>';
}

// stop user typed text from breaking the HTML
function esc(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function money(n) {
  return '\u20B9' + Number(n).toLocaleString('en-IN');
}

// ----- session (who is logged in) -----
function getSession() {
  const saved = localStorage.getItem(KEYS.session) || sessionStorage.getItem(KEYS.session);
  return saved ? JSON.parse(saved) : null;
}

function logout() {
  localStorage.removeItem(KEYS.session);
  sessionStorage.removeItem(KEYS.session);
  location.href = 'index.html';
}

// ----- per-user lists in localStorage (wishlist, itineraries, bookings) -----
function getUserList(name) {
  const user = getSession();
  if (!user) return [];
  return JSON.parse(localStorage.getItem('waypoint_' + name + '_' + user.email) || '[]');
}

function setUserList(name, list) {
  const user = getSession();
  if (!user) return;
  localStorage.setItem('waypoint_' + name + '_' + user.email, JSON.stringify(list));
}

// ----- dates -----
function dateRange(startDate, days) {
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(start);
  end.setDate(end.getDate() + days - 1);
  const opts = { day: 'numeric', month: 'short' };
  return start.toLocaleDateString('en-IN', opts) + ' - ' +
         end.toLocaleDateString('en-IN', opts) + ' ' + end.getFullYear();
}

// ----- itinerary days as HTML (used on itinerary and profile pages) -----
function renderDays(plan) {
  let html = '';
  plan.daysPlan.forEach(day => {
    html += '<div class="day-card"><h3>Day ' + day.day + '</h3>';
    if (day.stops.length === 0) {
      html += '<p class="route-note">Free day - rest or explore on your own.</p>';
    } else {
      html += '<ol class="stops">';
      day.stops.forEach(s => {
        html += '<li><span class="time">' + s.time + '</span><span class="stop">' +
                esc(s.name) + '</span><span class="cost">' + money(s.cost) + '</span></li>';
      });
      html += '</ol>';
    }
    html += '</div>';
  });
  return html;
}

// ----- navbar: show My Trips / Log out when logged in -----
function setupNav() {
  const user = getSession();
  const btn = document.querySelector('.btn-nav');
  if (!btn || !user) return;
  const li = btn.parentElement;
  li.innerHTML = '<a href="profile.html">My Trips</a>';
  const out = document.createElement('li');
  out.innerHTML = '<a href="#" class="btn-nav">Log out</a>';
  out.querySelector('a').addEventListener('click', e => { e.preventDefault(); logout(); });
  li.parentElement.appendChild(out);
}

setupNav();
