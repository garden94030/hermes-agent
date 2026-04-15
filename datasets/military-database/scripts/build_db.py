#!/usr/bin/env python3
"""Build a SQLite database from the JSON source files.

Usage:
    python3 scripts/build_db.py [--db military.db]
"""
from __future__ import annotations

import argparse
import json
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCHEMA = ROOT / "schema.sql"
BASES_DIR = ROOT / "bases"
WEAPONS_DIR = ROOT / "weapons"

COUNTRIES = [
    ("US", "United States", "United States of America"),
    ("JP", "Japan", "日本国"),
    ("KR", "Republic of Korea", "대한민국"),
    ("TW", "Taiwan", "中華民國"),
    ("PH", "Philippines", "Republika ng Pilipinas"),
]


def load_json(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def build(db_path: Path) -> None:
    if db_path.exists():
        db_path.unlink()

    conn = sqlite3.connect(db_path)
    conn.executescript(SCHEMA.read_text(encoding="utf-8"))

    # countries
    conn.executemany(
        "INSERT INTO countries (code, name_en, name_local) VALUES (?, ?, ?)",
        COUNTRIES,
    )

    # bases
    base_count = 0
    for jf in sorted(BASES_DIR.glob("*.json")):
        data = load_json(jf)
        for b in data["bases"]:
            conn.execute(
                """INSERT INTO bases
                   (id, name, name_local, country, branch, type, location,
                    latitude, longitude, operator, role, notable_units, established)
                   VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                (
                    b["id"],
                    b["name"],
                    b.get("name_local"),
                    b["country"],
                    b["branch"],
                    b.get("type"),
                    b.get("location"),
                    b.get("latitude"),
                    b.get("longitude"),
                    b.get("operator"),
                    b.get("role"),
                    json.dumps(b.get("notable_units", []), ensure_ascii=False),
                    b.get("established"),
                ),
            )
            base_count += 1

    # weapons
    weapon_count = 0
    for jf in sorted(WEAPONS_DIR.glob("*.json")):
        data = load_json(jf)
        for w in data["weapons"]:
            conn.execute(
                """INSERT INTO weapons
                   (id, name, category, branch, country, origin, role,
                    quantity, in_service_since, status, range_km, notes)
                   VALUES (?,?,?,?,?,?,?,?,?,?,?,?)""",
                (
                    w["id"],
                    w["name"],
                    w["category"],
                    w["branch"],
                    w["country"],
                    w.get("origin"),
                    w.get("role"),
                    w.get("quantity"),
                    w.get("in_service_since"),
                    w.get("status"),
                    w.get("range_km"),
                    w.get("notes"),
                ),
            )
            weapon_count += 1

    conn.commit()
    conn.close()

    print(f"Built {db_path}")
    print(f"  Countries: {len(COUNTRIES)}")
    print(f"  Bases:     {base_count}")
    print(f"  Weapons:   {weapon_count}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--db",
        default=str(ROOT / "military.db"),
        help="Output SQLite database path",
    )
    args = parser.parse_args()
    build(Path(args.db))


if __name__ == "__main__":
    main()
