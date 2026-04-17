# 第一島鏈軍事資料庫 — 互動式儀表板

A mobile-friendly, interactive dashboard for the First Island Chain military database.

## Live Demo

After enabling GitHub Pages (see below), the dashboard will be available at:

```
https://<your-github-username>.github.io/hermes-agent/military-dashboard/
```

## Features

- 📊 **Overview**: Key stats (countries, bases, weapons), per-country cards, branch/category breakdowns, missile range distribution
- 🗺️ **Interactive Map**: Leaflet-based map with per-country marker layers and base details popups
- ⚖️ **Force Comparison**: Allied vs. adversary comparison across fighters, naval, submarines, 5th-gen, and long-range strike
- 🏛️ **Bases Table**: Searchable, filterable table of all 165 bases
- 🚀 **Weapons Table**: Searchable, filterable table of all 308 weapon systems
- 📚 **Sources**: Bibliography of think tanks, databases, official documents, and reference books
- 🌗 **Dark/Light theme toggle** (dark by default for military aesthetic)
- 📱 **Fully responsive** — works on mobile, tablet, and desktop

## Tech Stack

- Pure HTML / CSS / vanilla JavaScript (no build step)
- [Leaflet](https://leafletjs.com/) for maps
- [Chart.js](https://www.chartjs.org/) for charts
- Data: single `data/data.json` file (~140 KB)

## Local Development

```bash
# From repo root
cd docs/military-dashboard
python3 -m http.server 8000
# open http://localhost:8000/
```

## Updating Data

Source data lives in `datasets/military-database/`. After modifying the JSON files there:

```bash
python3 datasets/military-database/scripts/build_dashboard_data.py
```

This regenerates `docs/military-dashboard/data/data.json`.

## Enabling GitHub Pages

1. In GitHub repo settings → **Pages**
2. Source: **Deploy from a branch**
3. Branch: `main` (or your default branch) / folder: `/docs`
4. Save

The site will be live within a few minutes at:
`https://<username>.github.io/<repo>/military-dashboard/`

Alternatively, use the included GitHub Actions workflow (`.github/workflows/deploy-dashboard.yml`) to deploy automatically whenever data is updated.

## Disclaimer

This dashboard visualises **public OSINT data only** — drawn from IISS Military Balance, Jane's, CSIS, RAND, NIDS, INDSR, CRS, ASPI, official defense white papers, and standard reference books. It is intended for academic research, strategic analysis, policy studies, and journalism. No classified, operational, or real-time intelligence is included.
