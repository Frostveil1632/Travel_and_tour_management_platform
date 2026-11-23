const { validateRecord, deleteProblem } = require('../js/validate.js');

const data = {
  destinations: [{ id: 'agra', title: 'Agra, UP', region: 'north', theme: 'Mughal', minDays: 2, maxDays: 3 }],
  packages: [{ id: 'p1', destId: 'agra', name: 'Taj Trip', days: 2, pricePerPerson: 8000, includes: ['Hotel'] }],
  attractions: [{ id: 'a1', destId: 'agra', name: 'Taj Mahal', lat: 27.17, lng: 78.04, cost: 1100, duration: 3, rating: 5 }]
};

const goodAttraction = { id: 'a2', destId: 'agra', name: 'Agra Fort', lat: 27.18, lng: 78.02, cost: 600, duration: 2, rating: 4 };

describe('validateRecord', () => {
  test('accepts a correct attraction', () => {
    expect(validateRecord('attractions', goodAttraction, data, null)).toEqual([]);
  });
  test('rejects a missing name', () => {
    const errors = validateRecord('attractions', { ...goodAttraction, name: '' }, data, null);
    expect(errors.length).toBeGreaterThan(0);
  });
  test('rejects a duplicate id when adding', () => {
    const errors = validateRecord('attractions', { ...goodAttraction, id: 'a1' }, data, null);
    expect(errors.join(' ')).toMatch(/already exists/);
  });
  test('allows the same id when editing that record', () => {
    const errors = validateRecord('attractions', { ...goodAttraction, id: 'a1' }, data, 'a1');
    expect(errors).toEqual([]);
  });
  test('rejects unknown destination', () => {
    const errors = validateRecord('attractions', { ...goodAttraction, destId: 'mars' }, data, null);
    expect(errors.join(' ')).toMatch(/does not exist/);
  });
  test('rejects latitude out of range', () => {
    const errors = validateRecord('attractions', { ...goodAttraction, lat: 120 }, data, null);
    expect(errors.join(' ')).toMatch(/Latitude/);
  });
  test('rejects rating outside 1-5', () => {
    const errors = validateRecord('attractions', { ...goodAttraction, rating: 7 }, data, null);
    expect(errors.join(' ')).toMatch(/Rating/);
  });
  test('rejects text where a number is needed', () => {
    const errors = validateRecord('attractions', { ...goodAttraction, cost: NaN }, data, null);
    expect(errors.join(' ')).toMatch(/must be a number/);
  });
  test('rejects ids with spaces', () => {
    const errors = validateRecord('attractions', { ...goodAttraction, id: 'bad id' }, data, null);
    expect(errors.join(' ')).toMatch(/ID can only/);
  });
  test('destination: max days cannot be less than min days', () => {
    const dest = { id: 'kochi', title: 'Kochi', region: 'south', theme: 'Port', minDays: 4, maxDays: 2 };
    expect(validateRecord('destinations', dest, data, null).join(' ')).toMatch(/Max days/);
  });
  test('destination: region must be known', () => {
    const dest = { id: 'kochi', title: 'Kochi', region: 'moon', theme: 'Port', minDays: 2, maxDays: 3 };
    expect(validateRecord('destinations', dest, data, null).join(' ')).toMatch(/Region/);
  });
  test('package: only one package per destination', () => {
    const pkg = { id: 'p2', destId: 'agra', name: 'Another', days: 2, pricePerPerson: 5000, includes: ['Cab'] };
    expect(validateRecord('packages', pkg, data, null).join(' ')).toMatch(/already has a package/);
  });
  test('package: includes list cannot be empty', () => {
    const pkg = { id: 'p2', destId: 'agra', name: 'Another', days: 2, pricePerPerson: 5000, includes: [] };
    expect(validateRecord('packages', pkg, data, null).length).toBeGreaterThan(0);
  });
});

describe('deleteProblem', () => {
  test('blocks deleting a destination that is still used', () => {
    expect(deleteProblem('destinations', 'agra', data)).toMatch(/Delete its 1 package/);
  });
  test('allows deleting an attraction', () => {
    expect(deleteProblem('attractions', 'a1', data)).toBe('');
  });
});

describe('destination image field', () => {
  const dest = { id: 'kochi', title: 'Kochi', region: 'south', theme: 'Port', minDays: 2, maxDays: 3 };
  test('image is optional', () => {
    expect(validateRecord('destinations', dest, data, null)).toEqual([]);
    expect(validateRecord('destinations', { ...dest, image: '' }, data, null)).toEqual([]);
  });
  test('image path is accepted when given', () => {
    expect(validateRecord('destinations', { ...dest, image: 'images/kochi.jpg' }, data, null)).toEqual([]);
  });
});
