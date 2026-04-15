#!/usr/bin/env python3
"""Example queries against the built military.db SQLite database."""
from __future__ import annotations

import sqlite3
from pathlib import Path

DB = Path(__file__).resolve().parent.parent / "military.db"


def section(title: str) -> None:
    print("\n" + "=" * 72)
    print(title)
    print("=" * 72)


def main() -> None:
    if not DB.exists():
        print(f"Database not found: {DB}. Run build_db.py first.")
        return

    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row

    section("1) Bases per country × branch")
    rows = conn.execute(
        """SELECT country, branch, COUNT(*) AS n
           FROM bases GROUP BY country, branch
           ORDER BY country, branch"""
    ).fetchall()
    for r in rows:
        print(f"  {r['country']}  {r['branch']:<14} {r['n']}")

    section("2) Weapons per country × category")
    rows = conn.execute(
        """SELECT country, category, COUNT(*) AS n
           FROM weapons GROUP BY country, category
           ORDER BY country, category"""
    ).fetchall()
    for r in rows:
        print(f"  {r['country']}  {r['category']:<14} {r['n']}")

    section("3) All US bases in Okinawa")
    rows = conn.execute(
        "SELECT id, name, branch, type FROM bases "
        "WHERE country='US' AND location LIKE '%Okinawa%' ORDER BY branch"
    ).fetchall()
    for r in rows:
        print(f"  [{r['branch']:<8}] {r['name']} ({r['type']})")

    section("4) Long-range strike assets (range > 500 km)")
    rows = conn.execute(
        """SELECT country, name, category, range_km FROM weapons
           WHERE range_km > 500 AND category IN ('CM','SRBM','SLBM','ICBM','Bomber','ASCM','SAM/SSM','Hypersonic','SSM')
           ORDER BY range_km DESC LIMIT 20"""
    ).fetchall()
    for r in rows:
        print(f"  {r['country']}  {r['name']:<40} {r['category']:<10} {r['range_km']:>6.0f} km")

    section("5) Aegis-equipped ships across allies")
    rows = conn.execute(
        """SELECT country, name, quantity FROM weapons
           WHERE (name LIKE '%Aegis%' OR notes LIKE '%Aegis%' OR name LIKE '%Sejong%' OR name LIKE '%Maya%' OR name LIKE '%Atago%' OR name LIKE '%Kongo%' OR name LIKE '%Arleigh%')
           ORDER BY country"""
    ).fetchall()
    for r in rows:
        print(f"  {r['country']}  {r['name']:<40} qty={r['quantity']}")

    section("6) 5th-generation fighters deployed in the region")
    rows = conn.execute(
        """SELECT country, name, quantity, status FROM weapons
           WHERE category='Fighter' AND (name LIKE '%F-35%' OR name LIKE '%F-22%' OR name LIKE '%KF-21%')
           ORDER BY country, name"""
    ).fetchall()
    for r in rows:
        print(f"  {r['country']}  {r['name']:<30} qty={r['quantity']:<4} [{r['status']}]")

    conn.close()


if __name__ == "__main__":
    main()
