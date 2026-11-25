// editor.js - in-browser Data Editor (add / edit / delete records, export JSON)
const data = { destinations: [], packages: [], attractions: [] };
let kind = 'destinations';
let editingId = null;

const kindSelect = document.getElementById('kind');
const tableBox = document.getElementById('tableBox');
const formBox = document.getElementById('formBox');
const msg = document.getElementById('editorMsg');

function say(text, ok) {
  msg.textContent = text;
  msg.className = ok ? 'msg ok' : 'msg';
}

// every change is saved to localStorage straight away
function saveData() {
  localStorage.setItem(KEYS.dataPrefix + kind, JSON.stringify(data[kind]));
}

function showValue(value) {
  return Array.isArray(value) ? value.join(', ') : value;
}

function drawTable() {
  const fields = SCHEMAS[kind];
  let html = '<div style="overflow-x:auto"><table class="bench left"><thead><tr>';
  fields.forEach(f => { html += '<th>' + f.label + '</th>'; });
  html += '<th></th></tr></thead><tbody>';
  data[kind].forEach(rec => {
    html += '<tr>';
    fields.forEach(f => { html += '<td>' + esc(String(showValue(rec[f.key]))) + '</td>'; });
    html += '<td><button class="btn-link" data-edit="' + esc(rec.id) + '">Edit</button> ' +
            '<button class="btn-link" data-delete="' + esc(rec.id) + '">Delete</button></td></tr>';
  });
  html += '</tbody></table></div>';
  tableBox.innerHTML = html;
}

function drawForm(record) {
  const fields = SCHEMAS[kind];
  let html = '<h3>' + (editingId ? 'Edit record' : 'Add new record') + '</h3><form id="recordForm"><div class="editor-form">';
  fields.forEach(f => {
    const value = record ? showValue(record[f.key]) : '';
    const locked = editingId && f.key === 'id' ? ' readonly' : '';
    html += '<div class="field"><label>' + f.label + '</label>';
    if (f.type === 'select') {
      html += '<select id="f_' + f.key + '">' + f.options.map(o =>
        '<option value="' + o + '"' + (o === value ? ' selected' : '') + '>' + o + '</option>').join('') + '</select>';
    } else {
      html += '<input id="f_' + f.key + '" type="' + (f.type === 'number' ? 'number' : 'text') +
              '" step="any" value="' + esc(String(value)).replace(/"/g, '&quot;') + '"' + locked + '>';
    }
    html += '</div>';
  });
  html += '</div><button type="submit" class="btn-primary">' + (editingId ? 'Update record' : 'Add record') + '</button> ' +
          '<button type="button" class="btn-outline" id="cancelBtn">Clear form</button></form>';
  formBox.innerHTML = html;

  document.getElementById('cancelBtn').addEventListener('click', () => {
    editingId = null;
    drawForm(null);
    say('', true);
  });
  document.getElementById('recordForm').addEventListener('submit', onSubmit);
}

function readForm() {
  const rec = {};
  SCHEMAS[kind].forEach(f => {
    const raw = document.getElementById('f_' + f.key).value.trim();
    if (f.type === 'number') rec[f.key] = raw === '' ? NaN : Number(raw);
    else if (f.type === 'list') rec[f.key] = raw.split(',').map(x => x.trim()).filter(x => x !== '');
    else rec[f.key] = raw;
  });
  return rec;
}

function onSubmit(e) {
  e.preventDefault();
  const rec = readForm();
  const errors = validateRecord(kind, rec, data, editingId);
  if (errors.length > 0) {
    say(errors.join(' '), false);
    return;
  }
  if (editingId) {
    const index = data[kind].findIndex(r => r.id === editingId);
    data[kind][index] = rec;
    say('Record updated.', true);
  } else {
    data[kind].push(rec);
    say('Record added.', true);
  }
  saveData();
  editingId = null;
  drawTable();
  drawForm(null);
}

tableBox.addEventListener('click', e => {
  const editId = e.target.dataset.edit;
  const deleteId = e.target.dataset.delete;
  if (editId) {
    editingId = editId;
    drawForm(data[kind].find(r => r.id === editId));
    say('', true);
    formBox.scrollIntoView();
  }
  if (deleteId) {
    const problem = deleteProblem(kind, deleteId, data);
    if (problem) { say(problem, false); return; }
    if (!confirm('Delete "' + deleteId + '"?')) return;
    data[kind] = data[kind].filter(r => r.id !== deleteId);
    saveData();
    drawTable();
    say('Record deleted.', true);
  }
});

kindSelect.addEventListener('change', () => {
  kind = kindSelect.value;
  editingId = null;
  say('', true);
  drawTable();
  drawForm(null);
});

// download the current dataset as a .json file (Blob + download link)
document.getElementById('downloadBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(data[kind], null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = kind + '.json';
  link.click();
  URL.revokeObjectURL(link.href);
  say('Downloaded ' + kind + '.json', true);
});

// go back to the bundled file for this dataset
document.getElementById('resetBtn').addEventListener('click', () => {
  if (!confirm('Throw away your edits to ' + kind + '?')) return;
  localStorage.removeItem(KEYS.dataPrefix + kind);
  loadAll().then(() => { drawTable(); drawForm(null); say('Reset to the original file.', true); });
});

function loadAll() {
  return Promise.all([
    loadJSON('data/destinations.json'),
    loadJSON('data/packages.json'),
    loadJSON('data/attractions.json')
  ]).then(r => {
    data.destinations = r[0];
    data.packages = r[1];
    data.attractions = r[2];
  });
}

loadAll()
  .then(() => { drawTable(); drawForm(null); })
  .catch(() => showDataError(tableBox));
