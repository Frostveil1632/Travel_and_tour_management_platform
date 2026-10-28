// profile.js - My Trips page: wishlist, saved itineraries, bookings
const user = getSession();
let destinations = [];

function drawWishlist() {
  const ids = getUserList('wishlist');
  const box = document.getElementById('wishlistBox');
  if (ids.length === 0) {
    box.innerHTML = '<p class="route-note">Nothing saved yet. <a href="destinations.html"><u>Browse destinations</u></a></p>';
    return;
  }
  box.innerHTML = ids.map(id => {
    const d = destinations.find(x => x.id === id);
    const title = d ? d.title : id;
    return '<div class="list-row"><span>' + esc(title) + '</span><span>' +
      '<a href="itinerary.html?dest=' + id + '" class="btn-outline">Plan trip</a> ' +
      '<button class="btn-link" data-remove-wish="' + id + '">Remove</button></span></div>';
  }).join('');
}

function drawItineraries() {
  const list = getUserList('itineraries');
  const box = document.getElementById('itinBox');
  if (list.length === 0) {
    box.innerHTML = '<p class="route-note">No saved itineraries. <a href="itinerary.html"><u>Create one</u></a></p>';
    return;
  }
  box.innerHTML = list.map(item => {
    const p = item.plan;
    return '<details class="saved-item"><summary>' + esc(p.destTitle) + ' \u00B7 ' + p.days + ' days \u00B7 ' +
      money(p.total) + '</summary>' + renderDays(p) +
      '<button class="btn-link" data-remove-itin="' + item.id + '">Delete itinerary</button></details>';
  }).join('');
}

function drawBookings() {
  const list = getUserList('bookings');
  const box = document.getElementById('bookingBox');
  if (list.length === 0) {
    box.innerHTML = '<p class="route-note">No bookings yet.</p>';
    return;
  }
  box.innerHTML = list.map(b => {
    return '<div class="list-row"><span><b>' + b.id + '</b> \u00B7 ' + esc(b.plan.destTitle) + '<br>' +
      '<small>' + dateRange(b.plan.startDate, b.plan.days) + ' \u00B7 ' + b.plan.travelers +
      ' travelers \u00B7 ' + esc(b.traveler.name) + '</small></span>' +
      '<span>' + money(b.plan.total) + '<br><small>' + b.status + '</small></span></div>';
  }).join('');
}

document.addEventListener('click', e => {
  const wish = e.target.dataset.removeWish;
  const itin = e.target.dataset.removeItin;
  if (wish) {
    setUserList('wishlist', getUserList('wishlist').filter(id => id !== wish));
    drawWishlist();
  }
  if (itin) {
    setUserList('itineraries', getUserList('itineraries').filter(i => String(i.id) !== itin));
    drawItineraries();
  }
});

if (!user) {
  location.href = 'login.html?next=profile.html';
} else {
  document.getElementById('hello').textContent = 'Hi, ' + user.name;
  loadJSON('data/destinations.json')
    .then(d => { destinations = d; })
    .catch(() => {})
    .then(() => { drawWishlist(); drawItineraries(); drawBookings(); });
}
