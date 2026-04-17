"""
從 pla_weapons.json 建立 SQLite 資料庫。
執行: python3 scripts/build_db.py
輸出: data/pla_weapons.db
"""
import json, sqlite3, pathlib

ROOT = pathlib.Path(__file__).parent.parent
DATA = ROOT / "data" / "pla_weapons.json"
DB   = ROOT / "data" / "pla_weapons.db"

SCHEMA = """
CREATE TABLE IF NOT EXISTS branches (
    id          TEXT PRIMARY KEY,
    name_cn     TEXT NOT NULL,
    name_en     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS weapons (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    branch_id       TEXT NOT NULL REFERENCES branches(id),
    category        TEXT NOT NULL,
    name_cn         TEXT NOT NULL,
    name_en         TEXT,
    in_service      TEXT,
    status          TEXT DEFAULT 'active',
    manufacturer    TEXT,
    specs_json      TEXT,
    variants_json   TEXT,
    notes           TEXT
);

CREATE TABLE IF NOT EXISTS weapon_sources (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    weapon_id   INTEGER NOT NULL REFERENCES weapons(id),
    citation    TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_weapons_branch   ON weapons(branch_id);
CREATE INDEX IF NOT EXISTS idx_weapons_category ON weapons(category);
CREATE INDEX IF NOT EXISTS idx_weapons_name_cn  ON weapons(name_cn);
"""

def build():
    with open(DATA, encoding="utf-8") as f:
        db_data = json.load(f)

    if DB.exists():
        DB.unlink()

    con = sqlite3.connect(DB)
    cur = con.cursor()
    cur.executescript(SCHEMA)

    weapon_count = 0
    source_count = 0

    for branch_id, branch in db_data.items():
        if branch_id == "_meta":
            continue
        cur.execute(
            "INSERT OR IGNORE INTO branches VALUES (?, ?, ?)",
            (branch_id, branch["branch_name_cn"], branch["branch_name_en"])
        )
        for w in branch.get("weapons", []):
            cur.execute("""
                INSERT INTO weapons
                    (branch_id, category, name_cn, name_en, in_service,
                     status, manufacturer, specs_json, variants_json, notes)
                VALUES (?,?,?,?,?,?,?,?,?,?)
            """, (
                branch_id,
                w.get("category", ""),
                w.get("name_cn", ""),
                w.get("name_en"),
                str(w.get("in_service", w.get("commissioned", w.get("launched", "")))),
                w.get("status", "active"),
                w.get("manufacturer"),
                json.dumps(w.get("specs"), ensure_ascii=False) if w.get("specs") else None,
                json.dumps(w.get("variants"), ensure_ascii=False) if w.get("variants") else None,
                w.get("notes"),
            ))
            wid = cur.lastrowid
            weapon_count += 1
            for src in w.get("sources", []):
                cur.execute(
                    "INSERT INTO weapon_sources (weapon_id, citation) VALUES (?,?)",
                    (wid, src)
                )
                source_count += 1

    con.commit()
    con.close()

    print(f"✅ 資料庫建立完成: {DB}")
    print(f"   武器條目: {weapon_count}")
    print(f"   來源引用: {source_count}")

if __name__ == "__main__":
    build()
