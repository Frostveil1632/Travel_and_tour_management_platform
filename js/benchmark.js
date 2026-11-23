// benchmark.js - compares naive order, nearest-neighbour, 2-opt and brute force
const out = document.getElementById('benchBody');
const MAX_BRUTE = 9; // 9! = 362,880 orders is still fast enough

Promise.all([loadJSON('data/destinations.json'), loadJSON('data/attractions.json')])
  .then(r => {
    const destinations = r[0];
    const attractions = r[1];
    let rows = '';
    let sumImprove = 0;
    let counted = 0;
    destinations.forEach(d => {
      const stops = attractions.filter(a => a.destId === d.id);
      if (stops.length < 2) return; // nothing to compare

      const naive = routeLength(stops);
      const nn = routeLength(nearestNeighbour(stops));
      const opt2 = routeLength(twoOpt(nearestNeighbour(stops)));
      const improve = Math.round((naive - opt2) / naive * 100);
      sumImprove += improve;
      counted++;

      let bestText = '-';
      let gapText = '-';
      if (stops.length <= MAX_BRUTE) {
        const best = routeLength(bruteForce(stops));
        bestText = best.toFixed(1);
        gapText = (best > 0 ? Math.round((opt2 - best) / best * 100) : 0) + '%';
      }
      rows += '<tr><td>' + d.title + '</td><td>' + stops.length + '</td><td>' + naive.toFixed(1) +
        '</td><td>' + nn.toFixed(1) + '</td><td>' + opt2.toFixed(1) + '</td><td>' + bestText +
        '</td><td>' + improve + '%</td><td>' + gapText + '</td></tr>';
    });
    out.innerHTML = rows;
    document.getElementById('benchSummary').textContent = counted > 0
      ? 'Average saving vs naive order: ' + Math.round(sumImprove / counted) + '%'
      : 'Not enough data to benchmark.';
  })
  .catch(() => showDataError(document.getElementById('benchSummary')));
