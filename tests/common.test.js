const common = require('../js/common.js');

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  document.body.innerHTML = '';
});

describe('formatting helpers', () => {
  test('money uses the rupee sign and Indian grouping', () => {
    expect(common.money(100000)).toBe('\u20B91,00,000');
  });
  test('esc turns tags into safe text', () => {
    expect(common.esc('<b>hi</b>')).toBe('&lt;b&gt;hi&lt;/b&gt;');
  });
  test('dateRange gives the last day of the trip', () => {
    expect(common.dateRange('2026-11-14', 3)).toMatch(/14 Nov.*16 Nov 2026/);
  });
});

describe('session and per-user lists', () => {
  test('getSession is null when nobody is logged in', () => {
    expect(common.getSession()).toBeNull();
  });
  test('getSession reads localStorage first, then sessionStorage', () => {
    sessionStorage.setItem(common.KEYS.session, JSON.stringify({ name: 'A', email: 'a@x.com' }));
    expect(common.getSession().email).toBe('a@x.com');
  });
  test('lists are kept separately for each user', () => {
    localStorage.setItem(common.KEYS.session, JSON.stringify({ name: 'A', email: 'a@x.com' }));
    common.setUserList('wishlist', ['goa']);
    localStorage.setItem(common.KEYS.session, JSON.stringify({ name: 'B', email: 'b@x.com' }));
    expect(common.getUserList('wishlist')).toEqual([]);
    localStorage.setItem(common.KEYS.session, JSON.stringify({ name: 'A', email: 'a@x.com' }));
    expect(common.getUserList('wishlist')).toEqual(['goa']);
  });
  test('getUserList returns an empty list when logged out', () => {
    expect(common.getUserList('bookings')).toEqual([]);
  });
});

describe('loadJSON', () => {
  test('edited data from the Data Editor wins over the file', async () => {
    localStorage.setItem(common.KEYS.dataPrefix + 'packages', JSON.stringify([{ id: 'x' }]));
    const result = await common.loadJSON('data/packages.json');
    expect(result).toEqual([{ id: 'x' }]);
  });
});

describe('renderDays', () => {
  const plan = {
    daysPlan: [
      { day: 1, stops: [{ name: 'Amber Fort', time: '09:00', cost: 1000 }] },
      { day: 2, stops: [] }
    ]
  };
  test('creates one card per day and shows stops', () => {
    document.body.innerHTML = common.renderDays(plan);
    expect(document.querySelectorAll('.day-card').length).toBe(2);
    expect(document.body.textContent).toContain('Amber Fort');
  });
  test('shows a free day message when there are no stops', () => {
    document.body.innerHTML = common.renderDays(plan);
    expect(document.body.textContent).toContain('Free day');
  });
});

describe('bgImage', () => {
  test('gives a style attribute with the image', () => {
    expect(common.bgImage('images/goa.svg')).toContain('url(images/goa.svg)');
  });
  test('gives nothing when there is no image', () => {
    expect(common.bgImage('')).toBe('');
    expect(common.bgImage(undefined)).toBe('');
  });
});
