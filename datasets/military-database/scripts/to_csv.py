#!/usr/bin/env python3
"""Export bases and weapons JSON → CSV (flat tables for spreadsheet / BI tools)."""
from __future__ import annotations

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BASES_DIR = ROOT / "bases"
WEAPONS_DIR = ROOT / "weapons"
OUT_DIR = ROOT / "csv"

BASE_COLS = [
    "id", "name", "name_local", "country", "branch", "type", "location",
    "latitude", "longitude", "operator", "role", "notable_units", "established",
]
WEAPON_COLS = [
    "id", "name", "category", "branch", "country", "origin", "role",
    "quantity", "in_service_since", "status", "range_km", "notes",
]


def load_all(directory: Path, key: str) -> list[dict]:
    rows: list[dict] = []
    for jf in sorted(directory.glob("*.json")):
        with jf.open("r", encoding="utf-8") as f:
            rows.extend(json.load(f)[key])
    return rows


def write_csv(rows: list[dict], cols: list[str], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=cols, extrasaction="ignore")
        writer.writeheader()
        for row in rows:
            out = dict(row)
            if "notable_units" in out and isinstance(out["notable_units"], list):
                out["notable_units"] = "; ".join(out["notable_units"])
            writer.writerow(out)


def main() -> None:
    bases = load_all(BASES_DIR, "bases")
    weapons = load_all(WEAPONS_DIR, "weapons")

    write_csv(bases, BASE_COLS, OUT_DIR / "bases.csv")
    write_csv(weapons, WEAPON_COLS, OUT_DIR / "weapons.csv")

    print(f"Wrote {OUT_DIR / 'bases.csv'}   ({len(bases)} rows)")
    print(f"Wrote {OUT_DIR / 'weapons.csv'} ({len(weapons)} rows)")


if __name__ == "__main__":
    main()
