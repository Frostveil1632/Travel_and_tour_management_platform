// smoke test: the home page preview shows one card per destination, with its image
const fs = require('fs');
const common = require('../js/common.js');

test('home preview draws a card with an image for every destination', async () => {
  const destinations = JSON.parse(fs.readFileSync('data/destinations.json'));
  document.body.innerHTML = '<div id="previewGrid"></div>';
  global.loadJSON = () => Promise.resolve(destinations);
  global.esc = common.esc;
  global.bgImage = common.bgImage;
  global.showDataError = common.showDataError;

  require('../js/home.js');
  await new Promise(resolve => setTimeout(resolve, 0));

  const cards = document.querySelectorAll('.dest-card');
  expect(cards.length).toBe(destinations.length);
  expect(cards[0].querySelector('.dest-art').getAttribute('style')).toContain('images/jaipur.svg');
  expect(cards[0].getAttribute('href')).toBe('itinerary.html?dest=jaipur');
});
