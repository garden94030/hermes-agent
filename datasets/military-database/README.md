# 第一島鏈軍事資料庫 (First Island Chain Military Database)

## 概述

本資料庫收集 **美國 (United States)** 與 **第一島鏈盟友** — 日本 (Japan)、韓國 (South Korea)、台灣 (Taiwan/ROC)、菲律賓 (Philippines) — 的主要軍事基地與各軍種武器系統資訊。

所有資料均以 **專業智庫、專業軍事資料庫、專書與參考書／教科書** 為主要來源。完整書目請見 [`SOURCES.md`](SOURCES.md)。核心來源類別：

- **專業軍事資料庫**：IISS *The Military Balance*（年度）、*Jane's Fighting Ships* / *Jane's All the World's Aircraft* / *Jane's Sentinel*、SIPRI Arms Transfers Database
- **專業智庫**：CSIS（含 China Power Project、AMTI）、RAND、CNAS、NIDS（日本防衛研究所）、INDSR（國防安全研究院）、KIDA、ASPI
- **官方國防文件**：美 DoD 中國軍力報告、CRS 報告、日本《防衛白書》、韓《國防白皮書》、ROC《國防報告書》/QDR、菲 AFP Modernization Program
- **專書與參考書／教科書**：Polmar *Naval Institute Guide to the Ships and Aircraft of the U.S. Fleet*、Wertheim *Combat Fleets of the World*、Yoshihara & Holmes *Red Star over the Pacific*、Friedberg *A Contest for Supremacy*、Easton *Chinese Invasion Threat*、Osprey *New Vanguard/Weapon* 系列，等

**用途**：學術研究、戰略分析、政策研究、新聞報導、地緣政治教學。

**免責聲明**：本資料為公開資訊彙整，資料可能隨時間變動；精確度以官方來源為準。不包含任何機密、作戰部署或即時情報。

---

## 目錄結構

```
data/military-database/
├── README.md                  # 本文件
├── SOURCES.md                 # 完整參考文獻／書目
├── schema.sql                 # SQLite/PostgreSQL 資料表結構
├── bases/                     # 軍事基地資料（依國家分檔）
│   ├── united_states.json
│   ├── japan.json
│   ├── south_korea.json
│   ├── taiwan.json
│   └── philippines.json
├── weapons/                   # 武器系統資料（依國家分檔）
│   ├── united_states.json
│   ├── japan.json
│   ├── south_korea.json
│   ├── taiwan.json
│   └── philippines.json
└── scripts/
    ├── build_db.py            # 讀取 JSON → 產生 SQLite DB
    └── query_examples.py      # 範例查詢
```

---

## 資料模型

### Bases（軍事基地）

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | string | 唯一識別碼 (如 `US-KADENA`) |
| name | string | 基地名稱 |
| name_local | string | 當地語言名稱 |
| country | string | ISO-3166 國碼 |
| branch | string | 軍種 (Army/Navy/Air Force/Marines/Space/Coast Guard/Joint) |
| type | string | 類型 (Airbase/Naval/Army/Joint/Missile/Radar/Logistics) |
| location | string | 地點 (縣市/州) |
| latitude | float | 緯度（概略） |
| longitude | float | 經度（概略） |
| operator | string | 駐軍單位 |
| role | string | 任務角色 |
| notable_units | list | 駐紮主要單位 |
| established | int | 啟用年份 |

### Weapons（武器系統）

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | string | 唯一識別碼 |
| name | string | 型號（如 F-35A, Aegis, HIMARS） |
| category | string | 類別 (Fighter/Bomber/Tank/Frigate/SSBN/SAM/SSM/Radar/ISR/UAV) |
| branch | string | 服役軍種 |
| country | string | 國碼 |
| origin | string | 原產國 |
| role | string | 角色任務 |
| quantity | int | 服役數量（估計） |
| in_service_since | int | 服役年份 |
| status | string | Active/Retiring/Planned |
| range_km | float | 射程 (km)（適用） |
| notes | string | 備註 |

---

## 快速使用

```bash
cd data/military-database
python3 scripts/build_db.py      # 產生 military.db (SQLite)
python3 scripts/query_examples.py
```

---

## 版本

- v0.1.0 (2026-04-15)：初版，涵蓋五國主要基地與武器系統（代表性樣本，非窮舉）
