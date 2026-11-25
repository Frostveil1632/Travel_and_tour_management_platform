// Checks that our real JSON files are consistent with each other
const fs = require('fs');
const { validateRecord } = require('../js/validate.js');

const read = name => JSON.parse(fs.readFileSync('data/' + name + '.json'));
const data = { destinations: read('destinations'), packages: read('packages'), attractions: read('attractions') };

describe('bundled JSON data', () => {
  test('every destination has exactly one package', () => {
    data.destinations.forEach(d => {
      expect(data.packages.filter(p => p.destId === d.id).length).toBe(1);
    });
  });
  test('every destination has at least 2 attractions', () => {
    data.destinations.forEach(d => {
      expect(data.attractions.filter(a => a.destId === d.id).length).toBeGreaterThanOrEqual(2);
    });
  });
  test('every record passes the editor validation', () => {
    ['destinations', 'packages', 'attractions'].forEach(kind => {
      data[kind].forEach(rec => {
        expect(validateRecord(kind, rec, data, rec.id)).toEqual([]);
      });
    });
  });
  test('every destination image file exists', () => {
    data.destinations.forEach(d => {
      if (d.image) expect(fs.existsSync(d.image)).toBe(true);
    });
  });
  test('users have name, email and password', () => {
    read('users').forEach(u => {
      expect(u.name && u.email && u.password).toBeTruthy();
    });
  });
});
