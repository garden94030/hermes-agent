/* First Island Chain Military Dashboard — main JS */
(function () {
  'use strict';

  const DATA_URL = 'dataset/data.json';
  let DATA = null;
  let charts = {};
  let map = null;
  let mapLayers = {};

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  const COUNTRY_COLORS = {
    US: '#3b82f6', JP: '#06b6d4', KR: '#14b8a6', TW: '#10b981',
    PH: '#84cc16', AU: '#a855f7', CN: '#ef4444', KP: '#dc2626',
  };
  const SIDE_COLORS = { Ally: '#22c55e', Adversary: '#ef4444' };

  // ═══════════════════════════════════════════════════════════════
  // Boot
  // ═══════════════════════════════════════════════════════════════
  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    try {
      const res = await fetch(DATA_URL);
      DATA = await res.json();
    } catch (e) {
      document.body.innerHTML = '<div style="padding:2rem;text-align:center">' +
        '<h2>載入失敗</h2><p>無法讀取資料檔 data/data.json</p></div>';
      console.error(e);
      return;
    }

    setupTheme();
    setupTabs();
    renderMeta();
    renderOverview();
    renderMap();
    renderCompare();
    renderBases();
    renderWeapons();
    setupModal();
  }

  // ═══════════════════════════════════════════════════════════════
  // Theme
  // ═══════════════════════════════════════════════════════════════
  function setupTheme() {
    const saved = localStorage.getItem('mdb-theme') || 'dark';
    if (saved === 'light') document.documentElement.setAttribute('data-theme', 'light');
    updateThemeIcon();
    $('#theme-toggle').addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-theme');
      const next = cur === 'light' ? 'dark' : 'light';
      if (next === 'light') document.documentElement.setAttribute('data-theme', 'light');
      else document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('mdb-theme', next);
      updateThemeIcon();
      rebuildCharts();
    });
  }
  function updateThemeIcon() {
    const cur = document.documentElement.getAttribute('data-theme');
    $('.theme-icon').textContent = cur === 'light' ? '☀️' : '🌙';
  }

  // ═══════════════════════════════════════════════════════════════
  // Tabs
  // ═══════════════════════════════════════════════════════════════
  function setupTabs() {
    $$('.tab').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const id = btn.dataset.tab;
        $$('.tab-panel').forEach(p => p.classList.remove('active'));
        $('#tab-' + id).classList.add('active');
        if (id === 'map' && map) setTimeout(() => map.invalidateSize(), 50);
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // Meta
  // ═══════════════════════════════════════════════════════════════
  function renderMeta() {
    $('#stat-countries').textContent = DATA.meta.counts.countries;
    $('#stat-bases').textContent = DATA.meta.counts.bases;
    $('#stat-weapons').textContent = DATA.meta.counts.weapons;
    const branches = new Set();
    DATA.bases.forEach(b => branches.add(b.branch));
    DATA.weapons.forEach(w => branches.add(w.branch));
    $('#stat-branches').textContent = branches.size;
    $('#footer-version').textContent = DATA.meta.version;
    $('#footer-generated').textContent = DATA.meta.generated;
  }

  // ═══════════════════════════════════════════════════════════════
  // Overview
  // ═══════════════════════════════════════════════════════════════
  function renderOverview() {
    const grid = $('#countries-grid');
    grid.innerHTML = '';
    Object.entries(DATA.countries).forEach(([code, c]) => {
      const bc = DATA.bases.filter(b => b.country === code).length;
      const wc = DATA.weapons.filter(w => w.country === code).length;
      const sideClass = c.side === 'Ally' ? 'ally' : 'adversary';
      const card = document.createElement('div');
      card.className = 'country-card ' + sideClass;
      card.innerHTML =
        '<div class="flag">' + c.flag + '</div>' +
        '<div class="cc-name">' + c.name_zh + '</div>' +
        '<div class="cc-meta">' + c.name + ' · <span class="pill ' + sideClass + '">' +
        (c.side === 'Ally' ? '盟友' : '對峙') + '</span></div>' +
        '<div class="cc-stats">' +
          '<span><strong>' + bc + '</strong>基地</span>' +
          '<span><strong>' + wc + '</strong>武器系統</span>' +
        '</div>';
      card.addEventListener('click', () => {
        $$('.tab').forEach(b => b.classList.remove('active'));
        $$('.tab').find(b => b.dataset.tab === 'bases').classList.add('active');
        $$('.tab-panel').forEach(p => p.classList.remove('active'));
        $('#tab-bases').classList.add('active');
        $('#bases-country-select').value = code;
        $('#bases-country-select').dispatchEvent(new Event('change'));
      });
      grid.appendChild(card);
    });

    renderChartBasesCountry();
    renderChartWeaponsCategory();
    renderChartMissileRange();
  }

  // ═══════════════════════════════════════════════════════════════
  // Chart helpers
  // ═══════════════════════════════════════════════════════════════
  function textColor() {
    return document.documentElement.getAttribute('data-theme') === 'light' ? '#0f172a' : '#e8eef8';
  }
  function gridColor() {
    return document.documentElement.getAttribute('data-theme') === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)';
  }
  function commonOpts() {
    return {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: textColor(), font: { size: 11 } } },
        tooltip: { backgroundColor: 'rgba(0,0,0,0.85)', titleColor: '#fff', bodyColor: '#fff' }
      },
      scales: {
        x: { ticks: { color: textColor(), font: { size: 10 } }, grid: { color: gridColor() } },
        y: { ticks: { color: textColor(), font: { size: 10 } }, grid: { color: gridColor() } }
      }
    };
  }
  function destroy(name) {
    if (charts[name]) { charts[name].destroy(); delete charts[name]; }
  }

  function renderChartBasesCountry() {
    destroy('basesCountry');
    const countries = Object.keys(DATA.countries);
    const branches = ['Army', 'Navy', 'Air Force', 'Marines', 'Rocket Force', 'Joint', 'Space', 'Aerospace', 'Cyber', 'Coast Guard'];
    const datasets = branches.map((br, i) => ({
      label: br,
      data: countries.map(c => DATA.bases.filter(b => b.country === c && b.branch === br).length),
      backgroundColor: ['#3b82f6','#06b6d4','#10b981','#a855f7','#f59e0b','#64748b','#ec4899','#8b5cf6','#14b8a6','#84cc16'][i % 10],
    })).filter(d => d.data.some(v => v > 0));
    const ctx = $('#chart-bases-country').getContext('2d');
    charts.basesCountry = new Chart(ctx, {
      type: 'bar',
      data: { labels: countries.map(c => DATA.countries[c].flag + ' ' + c), datasets },
      options: Object.assign(commonOpts(), {
        scales: Object.assign(commonOpts().scales, {
          x: Object.assign(commonOpts().scales.x, { stacked: true }),
          y: Object.assign(commonOpts().scales.y, { stacked: true, beginAtZero: true })
        })
      })
    });
  }

  function renderChartWeaponsCategory() {
    destroy('weaponsCategory');
    const catMap = {};
    DATA.weapons.forEach(w => { catMap[w.category] = (catMap[w.category] || 0) + 1; });
    const sorted = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 14);
    const ctx = $('#chart-weapons-category').getContext('2d');
    charts.weaponsCategory = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: sorted.map(e => e[0]),
        datasets: [{
          data: sorted.map(e => e[1]),
          backgroundColor: ['#3b82f6','#06b6d4','#10b981','#a855f7','#ef4444','#f59e0b','#ec4899','#14b8a6','#84cc16','#8b5cf6','#64748b','#f472b6','#60a5fa','#facc15'],
          borderColor: 'rgba(0,0,0,0.2)', borderWidth: 1
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { color: textColor(), font: { size: 10 }, boxWidth: 12 } }
        }
      }
    });
  }

  function renderChartMissileRange() {
    destroy('missileRange');
    const missiles = DATA.weapons.filter(w =>
      ['SRBM','MRBM','IRBM','ICBM','SLBM','CM','ASCM','Hypersonic','SSM'].includes(w.category) &&
      w.range_km > 0 && w.range_km < 20000
    ).sort((a, b) => b.range_km - a.range_km).slice(0, 25);
    const ctx = $('#chart-missile-range').getContext('2d');
    charts.missileRange = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: missiles.map(m => DATA.countries[m.country].flag + ' ' + m.name),
        datasets: [{
          label: '射程 (km)',
          data: missiles.map(m => m.range_km),
          backgroundColor: missiles.map(m => COUNTRY_COLORS[m.country]),
        }]
      },
      options: Object.assign(commonOpts(), {
        indexAxis: 'y',
        plugins: { legend: { display: false } },
      })
    });
  }

  function rebuildCharts() {
    renderChartBasesCountry();
    renderChartWeaponsCategory();
    renderChartMissileRange();
    renderCompareCharts();
  }

  // ═══════════════════════════════════════════════════════════════
  // Map
  // ═══════════════════════════════════════════════════════════════
  function renderMap() {
    map = L.map('map', { scrollWheelZoom: false }).setView([25, 130], 4);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: 'abcd', maxZoom: 10
    }).addTo(map);

    const chipBar = $('#map-country-filter');
    chipBar.innerHTML = '<span class="chip active" data-code="ALL">全部</span>' +
      Object.entries(DATA.countries).map(([code, c]) =>
        '<span class="chip active" data-code="' + code + '" style="border-left:3px solid ' +
        COUNTRY_COLORS[code] + '">' + c.flag + ' ' + c.name_zh + '</span>').join('');

    Object.keys(DATA.countries).forEach(code => {
      mapLayers[code] = L.layerGroup();
      DATA.bases.filter(b => b.country === code && b.latitude != null).forEach(b => {
        const marker = L.circleMarker([b.latitude, b.longitude], {
          radius: 6, fillColor: COUNTRY_COLORS[code], color: '#fff',
          weight: 1, opacity: 0.9, fillOpacity: 0.8
        });
        marker.bindPopup(
          '<div class="map-popup"><b>' + esc(b.name) + '</b>' +
          (b.name_local ? '<br><span class="popup-meta">' + esc(b.name_local) + '</span>' : '') +
          '<div class="popup-meta">' + esc(b.branch) + ' · ' + esc(b.type || '') + '</div>' +
          '<div class="popup-meta">📍 ' + esc(b.location || '') + '</div>' +
          (b.role ? '<div style="margin-top:0.4rem;font-size:0.85rem">' + esc(b.role) + '</div>' : '') +
          '</div>'
        );
        marker.bindTooltip(b.name, { direction: 'top' });
        marker.addTo(mapLayers[code]);
      });
      mapLayers[code].addTo(map);
    });

    chipBar.addEventListener('click', e => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      const code = chip.dataset.code;
      if (code === 'ALL') {
        const allOn = $$('.chip', chipBar).filter(c => c.dataset.code !== 'ALL').every(c => c.classList.contains('active'));
        $$('.chip', chipBar).forEach(c => {
          if (allOn) c.classList.remove('active'); else c.classList.add('active');
          const cc = c.dataset.code;
          if (cc !== 'ALL' && mapLayers[cc]) {
            if (allOn) map.removeLayer(mapLayers[cc]);
            else mapLayers[cc].addTo(map);
          }
        });
      } else {
        chip.classList.toggle('active');
        if (chip.classList.contains('active')) mapLayers[code].addTo(map);
        else map.removeLayer(mapLayers[code]);
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // Compare
  // ═══════════════════════════════════════════════════════════════
  function renderCompare() {
    const allyCodes = ['US', 'JP', 'KR', 'TW', 'PH', 'AU'];
    const advCodes = ['CN', 'KP'];
    const ally = {
      bases: DATA.bases.filter(b => allyCodes.includes(b.country)).length,
      weapons: DATA.weapons.filter(w => allyCodes.includes(w.country)).length,
      fighters: sumQty(DATA.weapons.filter(w => w.category === 'Fighter' && allyCodes.includes(w.country))),
      subs: sumQty(DATA.weapons.filter(w => ['Submarine','SSBN','SSGN'].includes(w.category) && allyCodes.includes(w.country))),
      fiveGen: sumQty(DATA.weapons.filter(w => w.category === 'Fighter' && allyCodes.includes(w.country) && /F-22|F-35|J-20|KF-21|J-35/.test(w.name))),
      surface: sumQty(DATA.weapons.filter(w => ['Destroyer','Cruiser','Frigate','Corvette'].includes(w.category) && allyCodes.includes(w.country))),
    };
    const adv = {
      bases: DATA.bases.filter(b => advCodes.includes(b.country)).length,
      weapons: DATA.weapons.filter(w => advCodes.includes(w.country)).length,
      fighters: sumQty(DATA.weapons.filter(w => w.category === 'Fighter' && advCodes.includes(w.country))),
      subs: sumQty(DATA.weapons.filter(w => ['Submarine','SSBN','SSGN'].includes(w.category) && advCodes.includes(w.country))),
      fiveGen: sumQty(DATA.weapons.filter(w => w.category === 'Fighter' && advCodes.includes(w.country) && /J-20|J-35/.test(w.name))),
      surface: sumQty(DATA.weapons.filter(w => ['Destroyer','Cruiser','Frigate','Corvette'].includes(w.category) && advCodes.includes(w.country))),
    };
    $('#compare-summary').innerHTML =
      sidePanel('ally', '🟢 盟友 (US+JP+KR+TW+PH+AU)', ally) +
      sidePanel('adversary', '🔴 對峙方 (CN+KP)', adv);

    renderCompareCharts();
  }

  function sidePanel(cls, title, d) {
    return '<div class="compare-side ' + cls + '"><h3>' + title + '</h3><ul>' +
      '<li><span>軍事基地</span><strong>' + d.bases + '</strong></li>' +
      '<li><span>武器系統</span><strong>' + d.weapons + '</strong></li>' +
      '<li><span>戰鬥機（估計）</span><strong>' + d.fighters + '</strong></li>' +
      '<li><span>水面艦艇</span><strong>' + d.surface + '</strong></li>' +
      '<li><span>潛艦</span><strong>' + d.subs + '</strong></li>' +
      '<li><span>五代機</span><strong>' + d.fiveGen + '</strong></li>' +
      '</ul></div>';
  }

  function sumQty(arr) { return arr.reduce((s, w) => s + (w.quantity || 0), 0); }

  function renderCompareCharts() {
    const allyCodes = ['US','JP','KR','TW','PH','AU'];
    const advCodes = ['CN','KP'];

    // Fighters by country (ally vs adv)
    destroy('cmpFighters');
    const allF = {};
    [...allyCodes, ...advCodes].forEach(c => {
      allF[c] = sumQty(DATA.weapons.filter(w => w.category === 'Fighter' && w.country === c));
    });
    charts.cmpFighters = new Chart($('#chart-cmp-fighters').getContext('2d'), {
      type: 'bar',
      data: {
        labels: Object.keys(allF).map(c => DATA.countries[c].flag + ' ' + c),
        datasets: [{
          data: Object.values(allF),
          backgroundColor: Object.keys(allF).map(c => COUNTRY_COLORS[c]),
          label: '戰鬥機數量',
        }]
      },
      options: Object.assign(commonOpts(), { plugins: { legend: { display: false } } })
    });

    // Surface combatants
    destroy('cmpSurface');
    const surfaceByCountry = {};
    [...allyCodes, ...advCodes].forEach(c => {
      surfaceByCountry[c] = sumQty(DATA.weapons.filter(w =>
        ['Destroyer','Cruiser','Frigate','Corvette'].includes(w.category) && w.country === c));
    });
    charts.cmpSurface = new Chart($('#chart-cmp-surface').getContext('2d'), {
      type: 'bar',
      data: {
        labels: Object.keys(surfaceByCountry).map(c => DATA.countries[c].flag + ' ' + c),
        datasets: [{
          data: Object.values(surfaceByCountry),
          backgroundColor: Object.keys(surfaceByCountry).map(c => COUNTRY_COLORS[c]),
        }]
      },
      options: Object.assign(commonOpts(), { plugins: { legend: { display: false } } })
    });

    // Submarines
    destroy('cmpSubs');
    const subsByCountry = {};
    [...allyCodes, ...advCodes].forEach(c => {
      subsByCountry[c] = sumQty(DATA.weapons.filter(w =>
        ['Submarine','SSBN','SSGN'].includes(w.category) && w.country === c));
    });
    charts.cmpSubs = new Chart($('#chart-cmp-subs').getContext('2d'), {
      type: 'bar',
      data: {
        labels: Object.keys(subsByCountry).map(c => DATA.countries[c].flag + ' ' + c),
        datasets: [{
          data: Object.values(subsByCountry),
          backgroundColor: Object.keys(subsByCountry).map(c => COUNTRY_COLORS[c]),
        }]
      },
      options: Object.assign(commonOpts(), { plugins: { legend: { display: false } } })
    });

    // 5th-gen fighters
    destroy('cmp5gen');
    const fifthGen = DATA.weapons.filter(w =>
      w.category === 'Fighter' && /F-22|F-35|J-20|KF-21|J-35/.test(w.name) && w.quantity > 0);
    charts.cmp5gen = new Chart($('#chart-cmp-5gen').getContext('2d'), {
      type: 'bar',
      data: {
        labels: fifthGen.map(w => DATA.countries[w.country].flag + ' ' + w.name.replace(/Lightning II|Raptor|Mighty Dragon/g, '').trim()),
        datasets: [{
          data: fifthGen.map(w => w.quantity),
          backgroundColor: fifthGen.map(w => COUNTRY_COLORS[w.country]),
        }]
      },
      options: Object.assign(commonOpts(), {
        indexAxis: 'y', plugins: { legend: { display: false } }
      })
    });

    // Long range strike (>300km)
    destroy('cmpLongrange');
    const lr = DATA.weapons.filter(w =>
      ['SRBM','MRBM','IRBM','ICBM','SLBM','CM','ASCM','Hypersonic','SSM'].includes(w.category) &&
      w.range_km > 300 && w.range_km < 20000
    ).sort((a, b) => b.range_km - a.range_km);
    charts.cmpLongrange = new Chart($('#chart-cmp-longrange').getContext('2d'), {
      type: 'scatter',
      data: {
        datasets: [{
          label: '盟友',
          data: lr.filter(w => allyCodes.includes(w.country)).map(w => ({
            x: w.range_km, y: Math.max(1, w.quantity || 1), _w: w
          })),
          backgroundColor: '#22c55e', pointRadius: 6, pointHoverRadius: 9,
        }, {
          label: '對峙方',
          data: lr.filter(w => advCodes.includes(w.country)).map(w => ({
            x: w.range_km, y: Math.max(1, w.quantity || 1), _w: w
          })),
          backgroundColor: '#ef4444', pointRadius: 6, pointHoverRadius: 9,
        }]
      },
      options: Object.assign(commonOpts(), {
        scales: {
          x: { title: { display: true, text: '射程 (km)', color: textColor() }, type: 'logarithmic',
               ticks: { color: textColor() }, grid: { color: gridColor() } },
          y: { title: { display: true, text: '數量（log）', color: textColor() }, type: 'logarithmic',
               ticks: { color: textColor() }, grid: { color: gridColor() } }
        },
        plugins: {
          legend: { labels: { color: textColor() } },
          tooltip: { callbacks: { label: ctx => {
            const w = ctx.raw._w;
            return DATA.countries[w.country].flag + ' ' + w.name + ' — ' +
              w.range_km + ' km, qty=' + (w.quantity || '?');
          } } }
        }
      })
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // Bases Table
  // ═══════════════════════════════════════════════════════════════
  function renderBases() {
    const sel = $('#bases-country-select');
    Object.entries(DATA.countries).forEach(([code, c]) => {
      sel.innerHTML += '<option value="' + code + '">' + c.flag + ' ' + c.name_zh + '</option>';
    });
    const branches = [...new Set(DATA.bases.map(b => b.branch))].sort();
    const brSel = $('#bases-branch-select');
    branches.forEach(b => brSel.innerHTML += '<option value="' + b + '">' + b + '</option>');

    ['#bases-search', '#bases-country-select', '#bases-branch-select'].forEach(id =>
      $(id).addEventListener('input', filterBases));
    filterBases();
  }

  function filterBases() {
    const q = $('#bases-search').value.trim().toLowerCase();
    const country = $('#bases-country-select').value;
    const branch = $('#bases-branch-select').value;
    const rows = DATA.bases.filter(b => {
      if (country && b.country !== country) return false;
      if (branch && b.branch !== branch) return false;
      if (q) {
        const hay = [b.name, b.name_local, b.location, b.operator, b.role,
                     (b.notable_units || []).join(' ')].filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    $('#bases-count').textContent = '顯示 ' + rows.length + ' / ' + DATA.bases.length + ' 個基地';
    const tbody = $('#bases-table tbody');
    tbody.innerHTML = rows.map(b =>
      '<tr class="clickable-row" data-id="' + b.id + '">' +
      '<td class="flag-cell">' + DATA.countries[b.country].flag + ' ' + b.country + '</td>' +
      '<td><strong>' + esc(b.name) + '</strong>' +
        (b.name_local ? '<br><span style="color:var(--text-dim);font-size:0.75rem">' + esc(b.name_local) + '</span>' : '') + '</td>' +
      '<td>' + esc(b.branch) + '</td>' +
      '<td>' + esc(b.type || '-') + '</td>' +
      '<td>' + esc(b.location || '-') + '</td>' +
      '<td style="font-size:0.8rem;color:var(--text-dim)">' + esc((b.role || '').slice(0, 80)) + (b.role && b.role.length > 80 ? '…' : '') + '</td>' +
      '</tr>').join('');
    $$('#bases-table .clickable-row').forEach(tr =>
      tr.addEventListener('click', () => showBase(tr.dataset.id)));
  }

  // ═══════════════════════════════════════════════════════════════
  // Weapons Table
  // ═══════════════════════════════════════════════════════════════
  function renderWeapons() {
    const cSel = $('#weapons-country-select');
    Object.entries(DATA.countries).forEach(([code, c]) => {
      cSel.innerHTML += '<option value="' + code + '">' + c.flag + ' ' + c.name_zh + '</option>';
    });
    const cats = [...new Set(DATA.weapons.map(w => w.category))].sort();
    const catSel = $('#weapons-category-select');
    cats.forEach(c => catSel.innerHTML += '<option value="' + c + '">' + c + '</option>');
    const brs = [...new Set(DATA.weapons.map(w => w.branch))].sort();
    const brSel = $('#weapons-branch-select');
    brs.forEach(b => brSel.innerHTML += '<option value="' + b + '">' + b + '</option>');

    ['#weapons-search','#weapons-country-select','#weapons-category-select','#weapons-branch-select'].forEach(id =>
      $(id).addEventListener('input', filterWeapons));
    filterWeapons();
  }

  function filterWeapons() {
    const q = $('#weapons-search').value.trim().toLowerCase();
    const country = $('#weapons-country-select').value;
    const cat = $('#weapons-category-select').value;
    const branch = $('#weapons-branch-select').value;
    const rows = DATA.weapons.filter(w => {
      if (country && w.country !== country) return false;
      if (cat && w.category !== cat) return false;
      if (branch && w.branch !== branch) return false;
      if (q) {
        const hay = [w.name, w.role, w.notes, w.origin].filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    $('#weapons-count').textContent = '顯示 ' + rows.length + ' / ' + DATA.weapons.length + ' 個武器系統';
    const tbody = $('#weapons-table tbody');
    tbody.innerHTML = rows.map(w => {
      const statusCls = (w.status || '').toLowerCase();
      return '<tr class="clickable-row" data-id="' + w.id + '">' +
        '<td class="flag-cell">' + DATA.countries[w.country].flag + ' ' + w.country + '</td>' +
        '<td><strong>' + esc(w.name) + '</strong></td>' +
        '<td><span class="pill">' + esc(w.category) + '</span></td>' +
        '<td>' + esc(w.branch) + '</td>' +
        '<td>' + (w.quantity ? w.quantity : '—') + '</td>' +
        '<td><span class="pill ' + statusCls + '">' + esc(w.status || '-') + '</span></td>' +
        '<td>' + (w.range_km ? w.range_km.toLocaleString() : '—') + '</td>' +
        '<td style="font-size:0.8rem;color:var(--text-dim)">' + esc((w.notes || '').slice(0, 60)) + '</td>' +
        '</tr>';
    }).join('');
    $$('#weapons-table .clickable-row').forEach(tr =>
      tr.addEventListener('click', () => showWeapon(tr.dataset.id)));
  }

  // ═══════════════════════════════════════════════════════════════
  // Modal (detail view)
  // ═══════════════════════════════════════════════════════════════
  function setupModal() {
    const m = $('#base-modal');
    $('.modal-close', m).addEventListener('click', () => m.classList.add('hidden'));
    m.addEventListener('click', e => { if (e.target === m) m.classList.add('hidden'); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') m.classList.add('hidden');
    });
  }

  function showBase(id) {
    const b = DATA.bases.find(x => x.id === id);
    if (!b) return;
    const c = DATA.countries[b.country];
    const html =
      '<h3>' + c.flag + ' ' + esc(b.name) + '</h3>' +
      (b.name_local ? '<p style="color:var(--text-dim)">' + esc(b.name_local) + '</p>' : '') +
      '<dl>' +
        kvp('國家', c.name_zh + ' (' + c.name + ')') +
        kvp('軍種', b.branch) +
        kvp('類型', b.type) +
        kvp('地點', b.location) +
        kvp('座標', b.latitude != null ? b.latitude.toFixed(3) + ', ' + b.longitude.toFixed(3) : null) +
        kvp('駐軍單位', b.operator) +
        kvp('任務角色', b.role) +
        kvp('主要單位', (b.notable_units || []).join('、')) +
        kvp('啟用年份', b.established) +
      '</dl>';
    $('.modal-content', $('#base-modal')).innerHTML = html;
    $('#base-modal').classList.remove('hidden');
  }

  function showWeapon(id) {
    const w = DATA.weapons.find(x => x.id === id);
    if (!w) return;
    const c = DATA.countries[w.country];
    const html =
      '<h3>' + c.flag + ' ' + esc(w.name) + '</h3>' +
      '<dl>' +
        kvp('國家', c.name_zh + ' (' + c.name + ')') +
        kvp('類別', w.category) +
        kvp('軍種', w.branch) +
        kvp('原產國', w.origin) +
        kvp('角色', w.role) +
        kvp('服役數量', w.quantity) +
        kvp('服役年份', w.in_service_since) +
        kvp('狀態', w.status) +
        kvp('射程 (km)', w.range_km ? w.range_km.toLocaleString() : null) +
        kvp('備註', w.notes) +
      '</dl>';
    $('.modal-content', $('#base-modal')).innerHTML = html;
    $('#base-modal').classList.remove('hidden');
  }

  function kvp(label, value) {
    if (value == null || value === '' || value === '-') return '';
    return '<dt>' + label + '</dt><dd>' + esc(String(value)) + '</dd>';
  }

  function esc(s) {
    if (s == null) return '';
    return String(s).replace(/[&<>"']/g, m => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[m]));
  }

})();
