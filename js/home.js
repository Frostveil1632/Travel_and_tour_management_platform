// home.js - fills the "Where people are heading" section from destinations.json
const previewGrid = document.getElementById('previewGrid');

loadJSON('data/destinations.json')
  .then(destinations => {
    previewGrid.innerHTML = destinations.map(d => {
      const shortName = d.title.split(',')[0]; // "Jaipur, Rajasthan" -> "Jaipur"
      return '<a class="dest-card" href="itinerary.html?dest=' + encodeURIComponent(d.id) + '">' +
        '<div class="dest-art"' + bgImage(d.image) + '></div>' +
        '<h4>' + esc(shortName) + '</h4>' +
        '<p>' + d.minDays + '\u2013' + d.maxDays + ' days \u00B7 ' + esc(d.theme) + '</p></a>';
    }).join('');
  })
  .catch(() => showDataError(previewGrid));
