// destinations.js - browse, filter and wishlist destinations
let destinations = [];
let packages = [];

const grid = document.getElementById('destGrid');
const countText = document.getElementById('resultsCount');
const budgetInput = document.getElementById('budgetRange');
const budgetText = document.getElementById('budgetText');

function getPackage(destId) {
  return packages.find(p => p.destId === destId);
}

function lengthMatches(dest, choice) {
  if (choice === 'any') return true;
  const ranges = { short: [2, 3], mid: [4, 6], long: [7, 99] };
  const r = ranges[choice];
  // trip length range of the destination overlaps the chosen range
  return dest.minDays <= r[1] && dest.maxDays >= r[0];
}

function applyFilters() {
  const regions = Array.from(document.querySelectorAll('input[name="region"]:checked'))
                       .map(box => box.value);
  const length = document.querySelector('input[name="len"]:checked').value;
  const maxBudget = Number(budgetInput.value);
  budgetText.textContent = 'Up to ' + money(maxBudget);

  const wishlist = getUserList('wishlist');
  const matches = destinations.filter(d => {
    const pkg = getPackage(d.id);
    return regions.includes(d.region) && lengthMatches(d, length) && pkg.pricePerPerson <= maxBudget;
  });

  countText.textContent = matches.length + ' destinations match';
  if (matches.length === 0) {
    grid.innerHTML = '<p>No destinations match these filters. Try changing them.</p>';
    return;
  }

  grid.innerHTML = matches.map((d, i) => {
    const pkg = getPackage(d.id);
    const saved = wishlist.includes(d.id);
    return '<article class="dest-card">' +
      '<div class="dest-art art-' + ((destinations.indexOf(d) % 6) + 1) + '"></div>' +
      '<div class="dest-body">' +
        '<h3>' + d.title + '</h3>' +
        '<p class="dest-meta">' + d.theme + ' \u00B7 ' + d.minDays + '\u2013' + d.maxDays + ' days</p>' +
        '<p class="dest-price">From ' + money(pkg.pricePerPerson) + ' <span>/ person</span></p>' +
        '<div class="card-actions">' +
          '<a href="itinerary.html?dest=' + d.id + '" class="btn-secondary small">Plan this trip</a>' +
          '<button class="wish-btn' + (saved ? ' saved' : '') + '" data-id="' + d.id + '">' +
            (saved ? '\u2665 Saved' : '\u2661 Save') + '</button>' +
        '</div>' +
      '</div></article>';
  }).join('');
}

// wishlist button clicks
grid.addEventListener('click', e => {
  const btn = e.target.closest('.wish-btn');
  if (!btn) return;
  if (!getSession()) {
    alert('Please log in to save destinations.');
    location.href = 'login.html?next=destinations.html';
    return;
  }
  let list = getUserList('wishlist');
  const id = btn.dataset.id;
  if (list.includes(id)) {
    list = list.filter(x => x !== id);
  } else {
    list.push(id);
  }
  setUserList('wishlist', list);
  applyFilters();
});

// filters apply as soon as something changes
document.querySelector('.filters').addEventListener('change', applyFilters);
budgetInput.addEventListener('input', applyFilters);
document.getElementById('applyBtn').addEventListener('click', applyFilters);

Promise.all([loadJSON('data/destinations.json'), loadJSON('data/packages.json')])
  .then(results => {
    destinations = results[0];
    packages = results[1];
    applyFilters();
  })
  .catch(() => showDataError(grid));
