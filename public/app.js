async function submitData() {
  const textarea = document.getElementById('input-data');
  const btn = document.getElementById('submit-btn');
  const errBan = document.getElementById('error-banner');
  const results = document.getElementById('results');

  const lines = textarea.value.split('\n').filter((l) => l.trim() !== '');

  if (!lines.length) {
    showError('Please enter at least one edge (e.g. A->B)');
    return;
  }

  errBan.classList.remove('show');
  results.classList.remove('show');
  btn.classList.add('loading');
  btn.disabled = true;

  try {
    const API_BASE = window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1')
      ? '/api/bfhl'
      : 'https://bfhl-project-b.vercel.app/api/bfhl';

    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: lines }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || 'Server returned ' + res.status);
    }

    const json = await res.json();
    renderResults(json);
    results.classList.add('show');
  } catch (err) {
    showError(err.message || 'Failed to connect to the API');
  } finally {
    btn.classList.remove('loading');
    btn.disabled = false;
  }
}

function renderResults(data) {
  const s = data.summary || {};

  document.getElementById('stats-grid').innerHTML = `
    <div class="stat-card stat-trees">
      <div class="stat-label">Valid Trees</div>
      <div class="stat-value">${s.total_trees ?? 0}</div>
    </div>
    <div class="stat-card stat-cycles">
      <div class="stat-label">Cycles Detected</div>
      <div class="stat-value">${s.total_cycles ?? 0}</div>
    </div>
    <div class="stat-card stat-root">
      <div class="stat-label">Largest Tree Root</div>
      <div class="stat-value">${s.largest_tree_root || '—'}</div>
    </div>
    <div class="stat-card stat-invalid">
      <div class="stat-label">Invalid Entries</div>
      <div class="stat-value">${(data.invalid_entries || []).length}</div>
    </div>
  `;

  const hGrid = document.getElementById('hierarchy-grid');
  hGrid.innerHTML = '';

  for (const h of data.hierarchies || []) {
    const isCycle = h.has_cycle === true;
    const card = document.createElement('div');
    card.className = 'hierarchy-card';

    let body;
    if (isCycle) {
      body = '<div class="cycle-message">⟳ Cyclic dependency detected — no tree can be built</div>';
    } else {
      body = `
        <div class="depth-info">Depth: <strong>${h.depth}</strong> nodes on longest path</div>
        <div class="tree-view">${buildTreeHTML(h.tree, h.root)}</div>
      `;
    }

    card.innerHTML = `
      <div class="hierarchy-header">
        <div>
          <div class="root-label">Root Node</div>
          <div class="root-node">${esc(h.root)}</div>
        </div>
        <span class="tag ${isCycle ? 'tag-cycle' : 'tag-tree'}">
          ${isCycle ? '⟳ Cycle' : '✓ Tree'}
        </span>
      </div>
      <div class="hierarchy-body">${body}</div>
    `;
    hGrid.appendChild(card);
  }

  renderChips('invalid-chips', data.invalid_entries, 'chip-invalid');
  renderChips('duplicate-chips', data.duplicate_edges, 'chip-duplicate');

  document.getElementById('json-output').textContent = JSON.stringify(data, null, 2);
  document.getElementById('json-output').classList.remove('show');
  document.getElementById('json-toggle-text').textContent = 'Show Raw JSON';
}

function buildTreeHTML(tree, rootKey) {
  if (!tree || !tree[rootKey]) return '<span style="color:var(--text-muted)">Empty</span>';

  let html = `<div class="tree-node"><span class="tree-name is-root">${esc(rootKey)}</span></div>`;
  html += renderSubtree(tree[rootKey], '');
  return html;
}

function renderSubtree(obj, prefix) {
  const keys = Object.keys(obj);
  let html = '';

  keys.forEach((key, i) => {
    const isLast = i === keys.length - 1;
    const connector = isLast ? '└── ' : '├── ';
    const nextPrefix = prefix + (isLast ? '    ' : '│   ');

    html += `<div class="tree-node">
      <span class="tree-connector">${escHTML(prefix + connector)}</span>
      <span class="tree-name">${esc(key)}</span>
    </div>`;

    if (obj[key] && Object.keys(obj[key]).length > 0) {
      html += renderSubtree(obj[key], nextPrefix);
    }
  });

  return html;
}

function renderChips(containerId, entries, cls) {
  const el = document.getElementById(containerId);
  if (!entries || !entries.length) {
    el.innerHTML = '<span class="chip chip-none">None</span>';
    return;
  }
  el.innerHTML = entries
    .map((e) => `<span class="chip ${cls}">${esc(String(e))}</span>`)
    .join('');
}

function esc(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function escHTML(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function showError(msg) {
  document.getElementById('error-text').textContent = msg;
  document.getElementById('error-banner').classList.add('show');
}

function toggleJson() {
  const pre = document.getElementById('json-output');
  const txt = document.getElementById('json-toggle-text');
  pre.classList.toggle('show');
  txt.textContent = pre.classList.contains('show') ? 'Hide Raw JSON' : 'Show Raw JSON';
}

function loadExample() {
  document.getElementById('input-data').value =
`A->B
A->C
B->D
C->E
E->F
X->Y
Y->Z
Z->X
P->Q
Q->R
G->H
G->H
G->I
hello
1->2
A->`;
}

function clearAll() {
  document.getElementById('input-data').value = '';
  document.getElementById('results').classList.remove('show');
  document.getElementById('error-banner').classList.remove('show');
}

window.submitData = submitData;
window.loadExample = loadExample;
window.clearAll = clearAll;
window.toggleJson = toggleJson;
