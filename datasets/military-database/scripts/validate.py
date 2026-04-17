#!/usr/bin/env python3
"""Validate the JSON dataset: schema, enums, uniqueness, and referential integrity."""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BASES_DIR = ROOT / "bases"
WEAPONS_DIR = ROOT / "weapons"

COUNTRIES = {"US", "JP", "KR", "TW", "PH", "CN"}
BRANCHES = {
    "Army", "Navy", "Air Force", "Marines", "Space", "Coast Guard",
    "Rocket Force", "Aerospace", "Cyber", "Joint",
}
BASE_TYPES = {
    "Airbase", "Naval", "Army", "Joint", "Missile", "Radar",
    "Logistics", "HQ", "RnD",
}
WEAPON_CATEGORIES = {
    "Fighter", "Bomber", "Attack", "Trainer", "Transport", "Tanker",
    "AEW", "MPA", "EW", "UAV", "Helicopter",
    "Carrier", "Cruiser", "Destroyer", "Frigate", "Corvette", "Patrol",
    "Amphibious", "Submarine", "SSBN", "SSGN",
    "Tank", "IFV", "APC", "Artillery", "MLRS",
    "SAM", "BMD", "SAM/BMD", "SAM/SSM",
    "SSM", "SRBM", "MRBM", "IRBM", "ICBM", "SLBM", "ASCM", "CM", "Hypersonic",
    "ATGM", "AAM", "ASAT", "ISR", "Radar", "Satellite",
}

REQUIRED_BASE_FIELDS = {"id", "name", "country", "branch"}
REQUIRED_WEAPON_FIELDS = {"id", "name", "category", "branch", "country"}


def check(condition: bool, msg: str, errors: list[str]) -> None:
    if not condition:
        errors.append(msg)


def validate_bases(errors: list[str]) -> set[str]:
    ids: set[str] = set()
    for jf in sorted(BASES_DIR.glob("*.json")):
        data = json.loads(jf.read_text(encoding="utf-8"))
        for b in data["bases"]:
            ctx = f"[{jf.name} / {b.get('id', '???')}]"
            for f in REQUIRED_BASE_FIELDS:
                check(f in b and b[f], f"{ctx} missing required field: {f}", errors)
            check(b["id"] not in ids, f"{ctx} duplicate id", errors)
            ids.add(b["id"])
            check(b["country"] in COUNTRIES,
                  f"{ctx} unknown country: {b['country']}", errors)
            check(b["branch"] in BRANCHES,
                  f"{ctx} unknown branch: {b['branch']}", errors)
            if "type" in b and b["type"] is not None:
                check(b["type"] in BASE_TYPES,
                      f"{ctx} unknown base type: {b['type']}", errors)
            if b.get("latitude") is not None:
                check(-90.0 <= b["latitude"] <= 90.0,
                      f"{ctx} latitude out of range: {b['latitude']}", errors)
            if b.get("longitude") is not None:
                check(-180.0 <= b["longitude"] <= 180.0,
                      f"{ctx} longitude out of range: {b['longitude']}", errors)
    return ids


def validate_weapons(errors: list[str]) -> set[str]:
    ids: set[str] = set()
    for jf in sorted(WEAPONS_DIR.glob("*.json")):
        data = json.loads(jf.read_text(encoding="utf-8"))
        for w in data["weapons"]:
            ctx = f"[{jf.name} / {w.get('id', '???')}]"
            for f in REQUIRED_WEAPON_FIELDS:
                check(f in w and w[f], f"{ctx} missing required field: {f}", errors)
            check(w["id"] not in ids, f"{ctx} duplicate id", errors)
            ids.add(w["id"])
            check(w["country"] in COUNTRIES,
                  f"{ctx} unknown country: {w['country']}", errors)
            check(w["branch"] in BRANCHES,
                  f"{ctx} unknown branch: {w['branch']}", errors)
            check(w["category"] in WEAPON_CATEGORIES,
                  f"{ctx} unknown category: {w['category']}", errors)
            qty = w.get("quantity")
            if qty is not None:
                check(isinstance(qty, int) and qty >= 0,
                      f"{ctx} invalid quantity: {qty}", errors)
    return ids


def main() -> int:
    errors: list[str] = []
    base_ids = validate_bases(errors)
    weapon_ids = validate_weapons(errors)

    if errors:
        print(f"FAILED — {len(errors)} error(s):")
        for e in errors:
            print(f"  {e}")
        return 1

    print("OK")
    print(f"  bases:   {len(base_ids)} unique ids")
    print(f"  weapons: {len(weapon_ids)} unique ids")
    return 0


if __name__ == "__main__":
    sys.exit(main())
