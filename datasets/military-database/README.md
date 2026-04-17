# 第一島鏈軍事資料庫 (First Island Chain Military Database)

## 概述

本資料庫收集 **美國 (United States)** 與 **第一島鏈盟友** — 日本 (Japan)、韓國 (South Korea)、台灣 (Taiwan/ROC)、菲律賓 (Philippines)、**澳洲 (Australia, AUKUS)** — 的主要軍事基地與各軍種武器系統資訊。另收錄 **中華人民共和國 (PRC/PLA)** 與 **北韓 (DPRK/KPA)** 作為對峙參考。

## 🌐 互動式儀表板（手機友善）

👉 **[開啟互動式儀表板 →](../../docs/military-dashboard/)**

部署後公開網址（啟用 GitHub Pages 後）：
`https://<your-username>.github.io/hermes-agent/military-dashboard/`

儀表板特色：📊 概覽統計、🗺️ 互動地圖、⚖️ 戰力比較、🏛️🚀 搜尋過濾、🌗 明暗主題、📱 響應式（手機最佳化）。

所有資料均以 **專業智庫、專業軍事資料庫、專書與參考書／教科書** 為主要來源。完整書目請見 [`SOURCES.md`](SOURCES.md)。核心來源類別：

- **專業軍事資料庫**：IISS *The Military Balance*（年度）、*Jane's Fighting Ships* / *Jane's All the World's Aircraft* / *Jane's Sentinel*、SIPRI Arms Transfers Database
- **專業智庫**：CSIS（含 China Power Project、AMTI）、RAND、CNAS、NIDS（日本防衛研究所）、INDSR（國防安全研究院）、KIDA、ASPI
- **官方國防文件**：美 DoD 中國軍力報告、CRS 報告、日本《防衛白書》、韓《國防白皮書》、ROC《國防報告書》/QDR、菲 AFP Modernization Program
- **專書與參考書／教科書**：Polmar *Naval Institute Guide to the Ships and Aircraft of the U.S. Fleet*、Wertheim *Combat Fleets of the World*、Yoshihara & Holmes *Red Star over the Pacific*、Friedberg *A Contest for Supremacy*、Easton *Chinese Invasion Threat*、Erickson (ed.) *Chinese Naval Shipbuilding*、Osprey *New Vanguard/Weapon* 系列，等

**用途**：學術研究、戰略分析、政策研究、新聞報導、地緣政治教學。

**免責聲明**：本資料為公開資訊彙整，資料可能隨時間變動；精確度以官方來源為準。不包含任何機密、作戰部署或即時情報。

---

## 資料規模

| 國家 | 陣營 | 基地數 | 武器系統數 |
|---|---|---:|---:|
| US (美國 INDOPACOM) | 盟友 | 28 | 52 |
| JP (日本 JSDF) | 盟友 | 20 | 36 |
| KR (韓國 ROK) | 盟友 | 20 | 40 |
| TW (台灣 ROC) | 盟友 | 22 | 38 |
| PH (菲律賓 AFP) | 盟友 | 16 | 25 |
| AU (澳洲 ADF/AUKUS) | 盟友 | 16 | 27 |
| CN (中國 PLA) | 對峙 | 28 | 57 |
| KP (北韓 KPA) | 對峙 | 15 | 33 |
| **合計** | | **165** | **308** |

---

## 目錄結構

```
datasets/military-database/
├── README.md                  # 本文件
├── SOURCES.md                 # 完整參考文獻／書目
├── schema.sql                 # SQLite/PostgreSQL 資料表結構
├── bases/                     # 軍事基地資料（依國家分檔）
│   ├── united_states.json
│   ├── japan.json
│   ├── south_korea.json
│   ├── taiwan.json
│   ├── philippines.json
│   ├── australia.json
│   ├── china.json
│   └── north_korea.json
├── weapons/                   # 武器系統資料（依國家分檔）
│   └── {同上}.json
├── scripts/
│   ├── build_db.py            # 讀取 JSON → 產生 SQLite DB
│   ├── query_examples.py      # 範例查詢
│   ├── to_csv.py              # 匯出 CSV (bases.csv / weapons.csv)
│   ├── validate.py            # 資料完整性與 enum 驗證
│   ├── force_comparison.py    # 盟友 vs 對峙方戰力比較分析
│   └── generate_map.py        # 互動式地圖 (folium HTML / matplotlib PNG)
└── csv/                       # (to_csv.py 產出)
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
| branch | string | 軍種 (Army/Navy/Air Force/Marines/Space/Coast Guard/Rocket Force/Aerospace/Cyber/Joint) |
| type | string | 類型 (Airbase/Naval/Army/Joint/Missile/Radar/Logistics/HQ/RnD) |
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
| name | string | 型號（如 F-35A, Aegis, HIMARS, DF-26） |
| category | string | 類別 (Fighter/Bomber/Tank/Destroyer/SSBN/SAM/BMD/SRBM/MRBM/IRBM/ICBM/SLBM/CM/ASCM/Hypersonic/UAV/ASAT/…) |
| branch | string | 服役軍種 |
| country | string | 國碼 |
| origin | string | 原產國 |
| role | string | 角色任務 |
| quantity | int | 服役數量（估計） |
| in_service_since | int | 服役年份 |
| status | string | Active / Retiring / Planned / Ordered |
| range_km | float | 射程 (km)（適用） |
| notes | string | 備註 |

---

## 快速使用

```bash
cd datasets/military-database

# 驗證資料完整性
python3 scripts/validate.py

# 產生 SQLite 資料庫
python3 scripts/build_db.py                  # → military.db

# 跑範例查詢
python3 scripts/query_examples.py

# 匯出 CSV（給 Excel/Pandas/BI 工具）
python3 scripts/to_csv.py                    # → csv/bases.csv, csv/weapons.csv

# 盟友 vs 對峙方戰力比較分析（10 項指標）
python3 scripts/force_comparison.py

# 互動式地圖（需 pip install folium）
python3 scripts/generate_map.py              # → map.html
```

### SQL 範例

```sql
-- 所有沖繩的美軍基地
SELECT name, branch, type FROM bases
WHERE country='US' AND location LIKE '%Okinawa%';

-- 第一島鏈上所有射程 >1000 km 的打擊系統
SELECT country, name, category, range_km FROM weapons
WHERE range_km > 1000 AND country IN ('US','JP','KR','TW','PH','AU')
ORDER BY range_km DESC;

-- 中方 PLARF 對台飛彈兵力
SELECT name, category, range_km, quantity FROM weapons
WHERE country='CN' AND branch='Rocket Force'
ORDER BY range_km;

-- 各國 Aegis/神盾艦清點
SELECT country, name, quantity, in_service_since FROM weapons
WHERE category='Destroyer' AND (notes LIKE '%Aegis%' OR name LIKE '%Aegis%'
      OR name LIKE '%Sejong%' OR name LIKE '%Maya%' OR name LIKE '%Atago%'
      OR name LIKE '%Kongo%' OR name LIKE '%Arleigh%' OR name LIKE '%Kee Lung%');
```

---

## 版本

- **v0.3.0** (2026-04-17)：加入澳洲 (AUKUS) 與北韓 (DPRK)；165 基地 / 308 武器 / 8 國。新增 `force_comparison.py` (10 項戰力比較分析) 與 `generate_map.py` (互動式地圖)。
- v0.2.0：加入 PRC/PLA 作為對峙參考；134 基地 / 248 武器。新增 CSV 匯出與資料驗證。
- v0.1.0：初版，涵蓋 US + JP/KR/TW/PH。
