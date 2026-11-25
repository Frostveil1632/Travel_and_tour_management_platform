// validate.js - schemas and simple checks for the Data Editor (also used in tests)

const REGIONS = ['north', 'south', 'west', 'northeast'];

const SCHEMAS = {
  destinations: [
    { key: 'id', label: 'ID', type: 'text' },
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'region', label: 'Region', type: 'select', options: REGIONS },
    { key: 'theme', label: 'Theme', type: 'text' },
    { key: 'minDays', label: 'Min days', type: 'number' },
    { key: 'maxDays', label: 'Max days', type: 'number' }
  ],
  packages: [
    { key: 'id', label: 'ID', type: 'text' },
    { key: 'destId', label: 'Destination ID', type: 'text' },
    { key: 'name', label: 'Package name', type: 'text' },
    { key: 'days', label: 'Package days', type: 'number' },
    { key: 'pricePerPerson', label: 'Price per person', type: 'number' },
    { key: 'includes', label: 'Includes (comma separated)', type: 'list' }
  ],
  attractions: [
    { key: 'id', label: 'ID', type: 'text' },
    { key: 'destId', label: 'Destination ID', type: 'text' },
    { key: 'name', label: 'Name', type: 'text' },
    { key: 'lat', label: 'Latitude', type: 'number' },
    { key: 'lng', label: 'Longitude', type: 'number' },
    { key: 'cost', label: 'Entry cost (Rs)', type: 'number' },
    { key: 'duration', label: 'Hours needed', type: 'number' },
    { key: 'rating', label: 'Rating (1-5)', type: 'number' }
  ]
};

function isNumber(v) {
  return typeof v === 'number' && isFinite(v);
}

// Returns a list of error messages (empty list = record is fine).
// data = { destinations, packages, attractions }, editingId = id being edited (or null when adding)
function validateRecord(kind, rec, data, editingId) {
  const errors = [];

  // 1. every field present and of the right type
  SCHEMAS[kind].forEach(f => {
    const v = rec[f.key];
    if (f.type === 'number') {
      if (!isNumber(v)) errors.push(f.label + ' must be a number.');
    } else if (f.type === 'list') {
      if (!Array.isArray(v) || v.length === 0) errors.push(f.label + ' needs at least one item.');
    } else if (v === undefined || v === null || String(v).trim() === '') {
      errors.push(f.label + ' is required.');
    }
  });
  if (errors.length > 0) return errors; // stop here so the checks below can trust the types

  // 2. id rules
  if (!/^[A-Za-z0-9_-]+$/.test(rec.id)) errors.push('ID can only have letters, numbers, - and _.');
  if (data[kind].some(r => r.id === rec.id && r.id !== editingId)) {
    errors.push('ID "' + rec.id + '" already exists.');
  }

  // 3. rules for each kind of data
  if (kind === 'destinations') {
    if (!REGIONS.includes(rec.region)) errors.push('Region must be one of: ' + REGIONS.join(', ') + '.');
    if (rec.minDays < 1) errors.push('Min days must be at least 1.');
    if (rec.maxDays < rec.minDays) errors.push('Max days cannot be less than min days.');
  }

  if (kind === 'packages') {
    if (!data.destinations.some(d => d.id === rec.destId)) errors.push('Destination "' + rec.destId + '" does not exist.');
    if (data.packages.some(p => p.destId === rec.destId && p.id !== editingId)) {
      errors.push('This destination already has a package.');
    }
    if (rec.days < 1) errors.push('Package days must be at least 1.');
    if (rec.pricePerPerson <= 0) errors.push('Price must be more than 0.');
  }

  if (kind === 'attractions') {
    if (!data.destinations.some(d => d.id === rec.destId)) errors.push('Destination "' + rec.destId + '" does not exist.');
    if (rec.lat < -90 || rec.lat > 90) errors.push('Latitude must be between -90 and 90.');
    if (rec.lng < -180 || rec.lng > 180) errors.push('Longitude must be between -180 and 180.');
    if (rec.cost < 0) errors.push('Cost cannot be negative.');
    if (rec.duration <= 0) errors.push('Hours needed must be more than 0.');
    if (rec.rating < 1 || rec.rating > 5) errors.push('Rating must be between 1 and 5.');
  }

  return errors;
}

// A destination cannot be deleted while packages/attractions still point to it
function deleteProblem(kind, id, data) {
  if (kind !== 'destinations') return '';
  const pkgs = data.packages.filter(p => p.destId === id).length;
  const atts = data.attractions.filter(a => a.destId === id).length;
  if (pkgs > 0 || atts > 0) {
    return 'Delete its ' + pkgs + ' package(s) and ' + atts + ' attraction(s) first.';
  }
  return '';
}

if (typeof module !== 'undefined') {
  module.exports = { REGIONS, SCHEMAS, validateRecord, deleteProblem };
}
