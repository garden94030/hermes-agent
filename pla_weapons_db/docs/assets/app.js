/* PLA Weapons Dashboard v2.0.0 — aligned with styles.css class conventions */
(function () {
  'use strict';

  const STATE = {
    index: null,
    branches: {},
    trends: null,
    charts: {},
    map: null,
    mapLayers: {},
    currentTab: 'overview'
  };

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  /* ---------- DATA ---------- */
  async function loadJSON(path) {
    const r = await fetch(path + '?v=2.0.0');
    if (!r.ok) throw new Error('fetch ' + path + ' → ' + r.status);
    return r.json();
  }
  async function loadAll() {
    STATE.index = await loadJSON('data/index.json');
    await Promise.all([
      ...STATE.index.services.map(async svc => {
        const d = await loadJSON(svc.file);
        STATE.branches[svc.id] = { meta: svc, ...d };
      }),
      loadJSON(STATE.index.trends_file).then(d => STATE.trends = d)
    ]);
  }

  /* ---------- HEADER ---------- */
  function renderHeader() {
    const total = Object.values(STATE.branches).reduce((n, b) => n + b.equipment.length, 0);
    const srcSet = new Set();
    Object.values(STATE.branches).forEach(b =>
      b.equipment.forEach(e => (e.sources || []).forEach(s => srcSet.add(s)))
    );
    $('#header-stats').innerHTML = `
      <span class="stat-chip">${total} 裝備系統</span>
      <span class="stat-chip">${STATE.index.services.length} 軍種</span>
      <span class="stat-chip">${srcSet.size} 專業引用</span>
    `;
  }

  /* ---------- OVERVIEW ---------- */
  function renderOverview() {
    $('#branch-cards').innerHTML = STATE.index.services.map(svc => {
      const b = STATE.branches[svc.id];
      return `
        <div class="branch-card" data-goto="${svc.id}" style="border-top-color:${svc.color}">
          <div class="bc-icon">${svc.icon}</div>
          <div class="bc-title">${esc(b.service?.name_zh || svc.name_zh)}</div>
          <div class="bc-en">${esc(svc.name_en)}</div>
          <div class="bc-count">${b.equipment.length}</div>
          <div class="bc-label">系統 ‧ ${b.service?.total_active_personnel_est ? (b.service.total_active_personnel_est/10000).toFixed(1)+' 萬兵力' : '—'}</div>
        </div>`;
    }).join('');
    $$('.branch-card').forEach(c => c.addEventListener('click', () => switchTab(c.dataset.goto)));

    const labels = STATE.index.services.map(s => s.name_zh);
    const colors = STATE.index.services.map(s => s.color);
    const counts = STATE.index.services.map(s => STATE.branches[s.id].equipment.length);
    destroyChart('chart-branch');
    STATE.charts['chart-branch'] = new Chart($('#chart-branch'), {
      type: 'bar',
      data: { labels, datasets: [{ label: '裝備系統數', data: counts, backgroundColor: colors, borderRadius: 6 }] },
      options: chartOpts(false)
    });

    const recent = STATE.index.services.map(s =>
      STATE.branches[s.id].equipment.filter(e => (e.introduced || 0) >= 2015).length
    );
    destroyChart('chart-recent');
    STATE.charts['chart-recent'] = new Chart($('#chart-recent'), {
      type: 'bar',
      data: { labels, datasets: [{ label: '2015 年後新增', data: recent, backgroundColor: colors, borderRadius: 6 }] },
      options: chartOpts(false)
    });
  }

  /* ---------- BRANCH ---------- */
  function renderBranch(branchId) {
    const host = $(`[data-branch="${branchId}"]`);
    const b = STATE.branches[branchId];
    if (!host || !b) return;
    const cats = Array.from(new Set(b.equipment.map(e => e.category))).sort();

    host.innerHTML = `
      <div class="panel" style="border-top:3px solid ${b.meta.color}">
        <h3 class="panel-title" style="color:${b.meta.color}">${b.meta.icon} ${esc(b.service.name_zh)} · ${esc(b.service.name_en)}</h3>
        <p class="body-text">${esc(b.service.overview || '')}</p>
        <p class="body-text">
          <b>總部：</b>${esc(b.service.headquarters || '—')} ‧
          ${b.service.total_active_personnel_est ? `<b>兵力估計：</b>${b.service.total_active_personnel_est.toLocaleString()} 人 ‧` : ''}
          <b>裝備系統：</b>${b.equipment.length} 項
        </p>
      </div>
      <div class="toolbar">
        <div class="search-wrap">
          <span class="ico">🔍</span>
          <input type="search" placeholder="搜尋中文 / 英文 / 類別" data-search="${branchId}">
        </div>
        <select data-filter="${branchId}">
          <option value="">全部類別</option>
          ${cats.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('')}
        </select>
        <button data-csv="${branchId}">⬇ 匯出 CSV</button>
        <span class="result-count" data-count="${branchId}"></span>
      </div>
      <div class="equip-grid" data-grid="${branchId}"></div>
    `;
    paintCards(branchId);
    $(`[data-search="${branchId}"]`).addEventListener('input', () => paintCards(branchId));
    $(`[data-filter="${branchId}"]`).addEventListener('change', () => paintCards(branchId));
    $(`[data-csv="${branchId}"]`).addEventListener('click', () => exportCSV(branchId));
  }

  function paintCards(branchId) {
    const b = STATE.branches[branchId];
    const q = ($(`[data-search="${branchId}"]`)?.value || '').trim().toLowerCase();
    const cat = $(`[data-filter="${branchId}"]`)?.value || '';
    const list = b.equipment.filter(e => {
      if (cat && e.category !== cat) return false;
      if (!q) return true;
      return [e.name_zh, e.name_en, e.category, e.subcategory].join(' ').toLowerCase().includes(q);
    });
    const grid = $(`[data-grid="${branchId}"]`);
    $(`[data-count="${branchId}"]`).textContent = `顯示 ${list.length} / ${b.equipment.length}`;
    if (!list.length) { grid.innerHTML = `<div class="empty"><div class="empty-icon">∅</div>無符合條件之裝備</div>`; return; }
    grid.innerHTML = list.map(e => `
      <div class="equip-card" data-equip="${branchId}:${esc(e.id)}">
        <div class="accent" style="background:${b.meta.color}"></div>
        <div class="ec-head">
          <div>
            <div class="ec-title">${esc(e.name_zh)}</div>
            <div class="ec-sub">${esc(e.name_en || '')}</div>
            ${e.quantity ? `<div class="ec-qty">${e.quantity.toLocaleString()}</div>` : ''}
          </div>
        </div>
        <div class="tag-row">
          <span class="tag">${esc(e.category)}</span>
          ${e.subcategory ? `<span class="tag">${esc(e.subcategory)}</span>` : ''}
          ${e.introduced ? `<span class="tag year">${e.introduced}</span>` : ''}
          <span class="tag sources">📚 ${(e.sources || []).length} 來源</span>
        </div>
      </div>
    `).join('');
    $$('[data-equip]', grid).forEach(card => {
      card.addEventListener('click', () => {
        const [bid, eid] = card.dataset.equip.split(':');
        openModal(bid, eid);
      });
    });
  }

  /* ---------- MODAL ---------- */
  function openModal(branchId, equipId) {
    const b = STATE.branches[branchId];
    const e = b.equipment.find(x => x.id === equipId);
    if (!e) return;
    const specs = Object.entries(e.specs || {}).map(([k, v]) =>
      `<div class="spec-item"><div class="k">${esc(k)}</div><div class="v">${esc(v)}</div></div>`
    ).join('');
    const deploys = (e.deployment || []).map(d => `
      <li>
        <b>${esc(d.base_zh || d.base_en)}</b>
        ${d.base_en && d.base_zh ? `<small> (${esc(d.base_en)})</small>` : ''}
        ${d.theater ? `<small> ‧ 戰區：${esc(d.theater)}</small>` : ''}
        <small> ‧ ${d.lat?.toFixed(2)}, ${d.lng?.toFixed(2)}</small>
      </li>
    `).join('');
    const srcs = (e.sources || []).map(s => `<li>${esc(s)}</li>`).join('');

    $('#modal-body').innerHTML = `
      <div style="border-left:4px solid ${b.meta.color};padding-left:12px;margin-bottom:14px">
        <small style="color:${b.meta.color};font-weight:600">${b.meta.icon} ${esc(b.service.name_zh)} · ${esc(e.category)}</small>
        <h2>${esc(e.name_zh)}</h2>
        <div class="en-name">${esc(e.name_en || '')}</div>
      </div>
      <div class="modal-meta">
        ${e.quantity ? `<span class="chip">🔢 數量：${e.quantity.toLocaleString()}</span>` : ''}
        ${e.introduced ? `<span class="chip">📅 服役：${e.introduced}</span>` : ''}
        ${e.subcategory ? `<span class="chip">🏷 ${esc(e.subcategory)}</span>` : ''}
      </div>
      ${specs ? `<h4 class="section">主要規格</h4><div class="spec-grid">${specs}</div>` : ''}
      ${deploys ? `<h4 class="section">主要部署 (${(e.deployment||[]).length})</h4><ul class="deploy-list">${deploys}</ul>` : ''}
      ${srcs ? `<h4 class="section">引用來源 (${(e.sources||[]).length})</h4><ul class="source-list">${srcs}</ul>` : ''}
    `;
    $('#overlay').classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  window.closeModal = function (evt, force) {
    if (force || !evt || evt.target.id === 'overlay') {
      $('#overlay').classList.remove('open');
      document.body.style.overflow = '';
    }
  };

  /* ---------- CSV ---------- */
  function exportCSV(branchId) {
    const b = STATE.branches[branchId];
    const rows = [['id','name_zh','name_en','category','subcategory','quantity','introduced','deployment','sources_count']];
    b.equipment.forEach(e => rows.push([
      e.id, e.name_zh, e.name_en || '', e.category, e.subcategory || '',
      e.quantity || '', e.introduced || '',
      (e.deployment || []).map(d => d.base_zh || d.base_en).join('; '),
      (e.sources || []).length
    ]));
    const csv = rows.map(r => r.map(c => {
      const s = String(c).replace(/"/g, '""');
      return /[",\n]/.test(s) ? `"${s}"` : s;
    }).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `pla-${branchId}-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ---------- TRENDS ---------- */
  function renderTrends() {
    const grid = $('#trends-grid');
    grid.innerHTML = STATE.trends.metrics.map(m => `
      <div class="trend-card">
        <h4 style="color:${m.color}">${esc(m.title_zh)}</h4>
        <div class="unit">${esc(m.title_en)} ‧ 單位：${esc(m.unit)}</div>
        <div style="position:relative;height:260px"><canvas id="tc-${m.id}"></canvas></div>
        <div class="unit" style="margin-top:10px"><b>來源：</b>${esc(Array.from(new Set(m.series.map(s => s.source).filter(Boolean))).join(' · '))}</div>
      </div>
    `).join('');
    STATE.trends.metrics.forEach(m => {
      const actual = m.series.filter(s => s.type === '實測').sort((a,b)=>a.year-b.year);
      const predict = m.series.filter(s => s.type === '預測').sort((a,b)=>a.year-b.year);
      if (actual.length && predict.length) predict.unshift(actual[actual.length - 1]);
      const years = Array.from(new Set(m.series.map(s => s.year))).sort((a,b)=>a-b);
      const aM = Object.fromEntries(actual.map(s => [s.year, s.value]));
      const pM = Object.fromEntries(predict.map(s => [s.year, s.value]));
      destroyChart('tc-' + m.id);
      STATE.charts['tc-' + m.id] = new Chart($('#tc-' + m.id), {
        type: 'line',
        data: {
          labels: years,
          datasets: [
            { label: '實測', data: years.map(y => aM[y] ?? null), borderColor: m.color, backgroundColor: m.color + '33', tension: 0.25, pointRadius: 4, spanGaps: false },
            { label: '預測 (CMPR)', data: years.map(y => pM[y] ?? null), borderColor: m.color, borderDash: [6,4], backgroundColor: 'transparent', tension: 0.25, pointRadius: 4, spanGaps: true }
          ]
        },
        options: chartOpts(true)
      });
    });
  }

  /* ---------- MAP ---------- */
  function renderMap() {
    if (STATE.map) { STATE.map.invalidateSize(); return; }
    STATE.map = L.map('map', { center: [32, 110], zoom: 4, scrollWheelZoom: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap', maxZoom: 18
    }).addTo(STATE.map);

    const legend = $('#map-legend'); legend.innerHTML = '';
    STATE.index.services.forEach(svc => {
      const group = L.layerGroup();
      STATE.branches[svc.id].equipment.forEach(e => {
        (e.deployment || []).forEach(d => {
          if (d.lat == null || d.lng == null) return;
          if (Math.abs(d.lat) < 0.5 && Math.abs(d.lng) < 0.5) return;
          L.circleMarker([d.lat, d.lng], {
            radius: 7, color: '#fff', weight: 1.5,
            fillColor: svc.color, fillOpacity: 0.85
          }).bindPopup(`
            <div><b>${esc(e.name_zh)}</b></div>
            <div>${esc(e.name_en || '')}</div>
            <hr style="border-color:#2a3a52;margin:6px 0">
            <div><b>軍種：</b>${svc.icon} ${esc(svc.name_zh)}</div>
            <div><b>部署：</b>${esc(d.base_zh || d.base_en)}</div>
            ${d.theater ? `<div><b>戰區：</b>${esc(d.theater)}</div>` : ''}
            ${e.quantity ? `<div><b>數量：</b>${e.quantity.toLocaleString()}</div>` : ''}
          `).addTo(group);
        });
      });
      group.addTo(STATE.map);
      STATE.mapLayers[svc.id] = group;

      const item = document.createElement('span');
      item.className = 'item';
      item.innerHTML = `<span class="dot" style="background:${svc.color}"></span>${svc.icon} ${esc(svc.name_zh)}`;
      item.addEventListener('click', () => {
        const on = STATE.map.hasLayer(STATE.mapLayers[svc.id]);
        if (on) { STATE.map.removeLayer(STATE.mapLayers[svc.id]); item.classList.add('off'); }
        else { STATE.mapLayers[svc.id].addTo(STATE.map); item.classList.remove('off'); }
      });
      legend.appendChild(item);
    });
  }

  /* ---------- TABS ---------- */
  function switchTab(id) {
    STATE.currentTab = id;
    $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === id));
    $$('.view').forEach(v => v.classList.toggle('hidden', v.id !== 'view-' + id));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (['plaa','plan','plaaf','plarf','plaisf'].includes(id)) renderBranch(id);
    if (id === 'trends') renderTrends();
    if (id === 'map') setTimeout(renderMap, 60);
  }

  /* ---------- UTIL ---------- */
  function chartOpts(legend) {
    return {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: legend, labels: { color: '#c9d1df' } },
        tooltip: { backgroundColor: '#162231', borderColor: '#d5b047', borderWidth: 1, titleColor: '#d5b047', bodyColor: '#e8e8e8' }
      },
      scales: {
        x: { ticks: { color: '#9ba7b8' }, grid: { color: 'rgba(213,176,71,0.08)' } },
        y: { ticks: { color: '#9ba7b8' }, grid: { color: 'rgba(213,176,71,0.08)' }, beginAtZero: true }
      }
    };
  }
  function destroyChart(id) { if (STATE.charts[id]) { STATE.charts[id].destroy(); delete STATE.charts[id]; } }

  /* ---------- INIT ---------- */
  async function init() {
    try {
      await loadAll();
      renderHeader();
      renderOverview();
      $$('.tab').forEach(t => t.addEventListener('click', () => switchTab(t.dataset.tab)));
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(null, true); });
    } catch (err) {
      console.error(err);
      $('#header-stats').innerHTML = `<span class="stat-chip" style="border-color:#c62828;color:#ff8a80">載入失敗：${esc(err.message)}</span>`;
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
