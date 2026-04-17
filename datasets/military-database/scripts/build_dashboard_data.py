#!/usr/bin/env python3
"""Compile all JSON source files into a single data.json for the dashboard.

Output: docs/military-dashboard/data/data.json
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REPO_ROOT = ROOT.parent.parent
BASES_DIR = ROOT / "bases"
WEAPONS_DIR = ROOT / "weapons"
OUT = REPO_ROOT / "docs" / "military-dashboard" / "dataset" / "data.json"

COUNTRIES = {
    "US": {"name": "United States", "name_zh": "美國", "side": "Ally", "flag": "🇺🇸"},
    "JP": {"name": "Japan", "name_zh": "日本", "side": "Ally", "flag": "🇯🇵"},
    "KR": {"name": "South Korea", "name_zh": "韓國", "side": "Ally", "flag": "🇰🇷"},
    "TW": {"name": "Taiwan", "name_zh": "台灣", "side": "Ally", "flag": "🇹🇼"},
    "PH": {"name": "Philippines", "name_zh": "菲律賓", "side": "Ally", "flag": "🇵🇭"},
    "AU": {"name": "Australia", "name_zh": "澳洲", "side": "Ally", "flag": "🇦🇺"},
    "CN": {"name": "China (PLA)", "name_zh": "中國", "side": "Adversary", "flag": "🇨🇳"},
    "KP": {"name": "North Korea", "name_zh": "北韓", "side": "Adversary", "flag": "🇰🇵"},
}


def load_all(directory: Path, key: str) -> list[dict]:
    items: list[dict] = []
    for jf in sorted(directory.glob("*.json")):
        with jf.open("r", encoding="utf-8") as f:
            items.extend(json.load(f)[key])
    return items


def main() -> None:
    bases = load_all(BASES_DIR, "bases")
    weapons = load_all(WEAPONS_DIR, "weapons")

    payload = {
        "meta": {
            "version": "0.4.0",
            "generated": "2026-04-17",
            "title": "First Island Chain Military Database",
            "title_zh": "第一島鏈軍事資料庫",
            "counts": {
                "countries": len(COUNTRIES),
                "bases": len(bases),
                "weapons": len(weapons),
            },
        },
        "countries": COUNTRIES,
        "bases": bases,
        "weapons": weapons,
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    with OUT.open("w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, separators=(",", ":"))

    size_kb = OUT.stat().st_size / 1024
    print(f"Wrote {OUT}")
    print(f"  {len(bases)} bases, {len(weapons)} weapons, {size_kb:.1f} KB")


if __name__ == "__main__":
    main()
