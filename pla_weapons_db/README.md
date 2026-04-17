# PLA 武器系統資料庫

中國人民解放軍（PLA）各軍種主要武器系統資料庫，資料引用 IISS、Janes、DoD CMPR 等專業出版品。

## 線上儀表板

**GitHub Pages 部署後可於任何手機/桌機瀏覽：**
`https://<your-github-user>.github.io/<repo>/pla_weapons_db/docs/`

## 資料範圍

| 軍種 | 筆數 |
|------|------|
| PLAAF（空軍） | 22 |
| PLAN（海軍） | 17 |
| PLAGF（陸軍） | 15 |
| PLARF（火箭軍） | 10 |
| PLASSF（戰略支援） | 5 |
| **合計** | **69** |

來源引用：231 項（IISS、Janes、DoD CMPR、FAS Nuclear Notebook、CSIS Missile Threat 等）

## 檔案結構

```
pla_weapons_db/
├── data/
│   ├── pla_weapons.json      # 主資料（含來源引用）
│   ├── sources.json          # 完整參考書目
│   └── pla_weapons.db        # SQLite 資料庫（由 build_db.py 產生）
├── docs/
│   ├── index.html            # 儀表板前端（GitHub Pages）
│   └── data.js               # 靜態 JS 資料（由 inject_citations.py 產生）
└── scripts/
    ├── inject_citations.py   # 為 JSON 每筆條目注入來源引用
    ├── build_db.py           # 從 JSON 建立 SQLite
    └── query_db.py           # 查詢範例
```

## 使用方式

```bash
cd pla_weapons_db

# 1. 注入來源引用（若修改了 JSON 後重新執行）
python3 scripts/inject_citations.py

# 2. 建立 SQLite
python3 scripts/build_db.py

# 3. 執行查詢範例
python3 scripts/query_db.py
```

## 主要參考來源

- **IISS** – *The Military Balance* (年度版)
- **Janes** – *Fighting Ships / All the World's Aircraft / Land Warfare Platforms*
- **U.S. DoD** – *China Military Power Report (CMPR)* (年度版)
- **FAS** – Kristensen & Korda, *Nuclear Notebook*, Bulletin of the Atomic Scientists
- **CSIS** – Missile Threat / China Power Project
- **RAND Corporation** – 中國軍事現代化研究系列
- **SIPRI** – *Yearbook* / Arms Transfers Database
- Blasko, D. J. (2012). *The Chinese Army Today*. Routledge.
- Cole, B. D. (2016). *The Great Wall at Sea*. Naval Institute Press.
- Fravel, M. T. (2019). *Active Defense*. Princeton UP.
- Erickson, A. S. (2013). *Chinese ASBM Development*. Jamestown Foundation.

## 免責聲明

本資料庫基於公開出版之智庫報告、學術著作及官方白皮書彙整而成，僅供學術研究與教育參考。資料可能不完整或已過時，不代表任何政府立場。
