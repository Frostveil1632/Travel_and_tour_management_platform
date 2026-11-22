// benchmark.js - compares naive order, nearest-neighbour, 2-opt and brute force
const out = document.getElementById('benchBody');

Promise.all([loadJSON('data/destinations.json'), loadJSON('data/attractions.json')])
  .then(r => {
    const destinations = r[0];
    const attractions = r[1];
    let rows = '';
    let sumImprove = 0;
    destinations.forEach(d => {
      const stops = attractions.filter(a => a.destId === d.id);
      const naive = routeLength(stops);
      const nn = routeLength(nearestNeighbour(stops));
      const opt2 = routeLength(twoOpt(nearestNeighbour(stops)));
      const best = routeLength(bruteForce(stops));
      const improve = Math.round((naive - opt2) / naive * 100);
      const gap = best > 0 ? Math.round((opt2 - best) / best * 100) : 0;
      sumImprove += improve;
      rows += '<tr><td>' + d.title + '</td><td>' + stops.length + '</td><td>' + naive.toFixed(1) +
        '</td><td>' + nn.toFixed(1) + '</td><td>' + opt2.toFixed(1) + '</td><td>' + best.toFixed(1) +
        '</td><td>' + improve + '%</td><td>' + gap + '%</td></tr>';
    });
    out.innerHTML = rows;
    document.getElementById('benchSummary').textContent =
      'Average saving vs naive order: ' + Math.round(sumImprove / destinations.length) + '%';
  })
  .catch(() => showDataError(document.getElementById('benchSummary')));
