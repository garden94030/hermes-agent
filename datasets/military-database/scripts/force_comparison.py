#!/usr/bin/env python3
"""Force-comparison analysis queries.

Generates side-by-side summaries of military capabilities across the
First Island Chain alliance vs. PRC/DPRK opposition forces.

Usage:
    python3 scripts/force_comparison.py

Requires military.db — run build_db.py first.
"""
from __future__ import annotations

import sqlite3
from pathlib import Path

DB = Path(__file__).resolve().parent.parent / "military.db"

ALLIES = ("US", "JP", "KR", "TW", "PH", "AU")
ADVERSARIES = ("CN", "KP")


def s(title: str) -> None:
    print(f"\n{'=' * 74}")
    print(title)
    print("=" * 74)


def run(conn: sqlite3.Connection) -> None:
    # ──────────────────────────────────────────────
    s("1) TOTAL BASES & WEAPONS BY SIDE")
    for label, countries in [("Allies (US+JP+KR+TW+PH+AU)", ALLIES),
                             ("Adversaries (CN+KP)", ADVERSARIES)]:
        bc = conn.execute(
            f"SELECT COUNT(*) FROM bases WHERE country IN ({','.join('?' * len(countries))})",
            countries).fetchone()[0]
        wc = conn.execute(
            f"SELECT COUNT(*) FROM weapons WHERE country IN ({','.join('?' * len(countries))})",
            countries).fetchone()[0]
        print(f"  {label}: {bc} bases, {wc} weapon systems")

    # ──────────────────────────────────────────────
    s("2) FIGHTER AIRCRAFT INVENTORY (qty × type)")
    for label, countries in [("Allies", ALLIES), ("Adversaries", ADVERSARIES)]:
        print(f"\n  --- {label} ---")
        rows = conn.execute(
            f"""SELECT country, name, quantity, status FROM weapons
                WHERE category='Fighter'
                  AND country IN ({','.join('?' * len(countries))})
                  AND quantity > 0
                ORDER BY quantity DESC""",
            countries).fetchall()
        total = sum(r[2] for r in rows)
        for r in rows:
            print(f"    {r[0]}  {r[1]:<36} {r[2]:>5} [{r[3]}]")
        print(f"    {'':42} TOTAL: {total}")

    # ──────────────────────────────────────────────
    s("3) NAVAL SURFACE COMBATANTS (Destroyer/Cruiser/Frigate/Corvette)")
    for label, countries in [("Allies", ALLIES), ("Adversaries", ADVERSARIES)]:
        print(f"\n  --- {label} ---")
        rows = conn.execute(
            f"""SELECT country, name, category, quantity FROM weapons
                WHERE category IN ('Destroyer','Cruiser','Frigate','Corvette')
                  AND country IN ({','.join('?' * len(countries))})
                  AND quantity > 0
                ORDER BY country, category, quantity DESC""",
            countries).fetchall()
        total = sum(r[3] for r in rows)
        for r in rows:
            print(f"    {r[0]}  {r[1]:<40} {r[2]:<12} {r[3]:>3}")
        print(f"    {'':58} TOTAL: {total}")

    # ──────────────────────────────────────────────
    s("4) SUBMARINE FORCE COMPARISON")
    for label, countries in [("Allies", ALLIES), ("Adversaries", ADVERSARIES)]:
        print(f"\n  --- {label} ---")
        rows = conn.execute(
            f"""SELECT country, name, category, quantity FROM weapons
                WHERE category IN ('Submarine','SSBN','SSGN')
                  AND country IN ({','.join('?' * len(countries))})
                  AND quantity > 0
                ORDER BY country, category""",
            countries).fetchall()
        total = sum(r[3] for r in rows)
        for r in rows:
            print(f"    {r[0]}  {r[1]:<40} {r[2]:<12} {r[3]:>3}")
        print(f"    {'':58} TOTAL: {total}")

    # ──────────────────────────────────────────────
    s("5) BALLISTIC / CRUISE MISSILE ARSENAL (range > 300 km)")
    for label, countries in [("Allies", ALLIES), ("Adversaries", ADVERSARIES)]:
        print(f"\n  --- {label} ---")
        rows = conn.execute(
            f"""SELECT country, name, category, range_km, quantity FROM weapons
                WHERE category IN ('SRBM','MRBM','IRBM','ICBM','SLBM','CM','Hypersonic','SSM','ASCM')
                  AND range_km > 300
                  AND country IN ({','.join('?' * len(countries))})
                ORDER BY range_km DESC""",
            countries).fetchall()
        for r in rows:
            q = f"~{r[4]}" if r[4] and r[4] > 0 else "?"
            print(f"    {r[0]}  {r[1]:<40} {r[2]:<10} {r[3]:>6.0f} km  qty={q}")

    # ──────────────────────────────────────────────
    s("6) AIR DEFENSE / BMD SYSTEMS")
    for label, countries in [("Allies", ALLIES), ("Adversaries", ADVERSARIES)]:
        print(f"\n  --- {label} ---")
        rows = conn.execute(
            f"""SELECT country, name, category, range_km FROM weapons
                WHERE category IN ('SAM','SAM/BMD','SAM/SSM','BMD')
                  AND country IN ({','.join('?' * len(countries))})
                ORDER BY range_km DESC""",
            countries).fetchall()
        for r in rows:
            print(f"    {r[0]}  {r[1]:<40} {r[2]:<10} {r[3]:>6.0f} km")

    # ──────────────────────────────────────────────
    s("7) 5TH-GEN FIGHTER COUNT (F-22 / F-35 / J-20 / KF-21)")
    rows = conn.execute(
        """SELECT country, name, quantity, status FROM weapons
           WHERE category='Fighter'
             AND (name LIKE '%F-22%' OR name LIKE '%F-35%'
                  OR name LIKE '%J-20%' OR name LIKE '%KF-21%'
                  OR name LIKE '%J-35%')
           ORDER BY quantity DESC"""
    ).fetchall()
    ally_total, adv_total = 0, 0
    for r in rows:
        side = "Ally" if r[0] in ALLIES else "Adv "
        if r[0] in ALLIES:
            ally_total += r[2]
        else:
            adv_total += r[2]
        print(f"  [{side}] {r[0]}  {r[1]:<36} qty={r[2]:<5} [{r[3]}]")
    print(f"\n  Allies total: {ally_total}   |   Adversaries total: {adv_total}")

    # ──────────────────────────────────────────────
    s("8) CARRIER / AMPHIBIOUS ASSAULT FORCE")
    for label, countries in [("Allies", ALLIES), ("Adversaries", ADVERSARIES)]:
        print(f"\n  --- {label} ---")
        rows = conn.execute(
            f"""SELECT country, name, category, quantity FROM weapons
                WHERE category IN ('Carrier','Amphibious')
                  AND country IN ({','.join('?' * len(countries))})
                  AND quantity > 0
                ORDER BY category, quantity DESC""",
            countries).fetchall()
        for r in rows:
            print(f"    {r[0]}  {r[1]:<44} {r[2]:<12} {r[3]:>2}")

    # ──────────────────────────────────────────────
    s("9) BASES WITHIN 500 KM OF TAIWAN STRAIT (lat 22-26, lon 117-125)")
    rows = conn.execute(
        """SELECT country, name, branch, type, latitude, longitude FROM bases
           WHERE latitude BETWEEN 22 AND 26
             AND longitude BETWEEN 117 AND 125
           ORDER BY country, branch"""
    ).fetchall()
    for r in rows:
        print(f"  {r[0]}  {r[1]:<44} {r[2]:<10} ({r[4]:.2f}, {r[5]:.2f})")

    # ──────────────────────────────────────────────
    s("10) NUCLEAR TRIAD COMPARISON (US vs CN vs KP)")
    for c in ["US", "CN", "KP"]:
        print(f"\n  --- {c} ---")
        rows = conn.execute(
            """SELECT name, category, range_km, quantity FROM weapons
               WHERE country=? AND category IN ('ICBM','SLBM','Bomber')
               ORDER BY category, range_km DESC""",
            (c,)).fetchall()
        for r in rows:
            q = r[3] if r[3] and r[3] > 0 else "?"
            print(f"    {r[0]:<40} {r[1]:<8} {r[2]:>6.0f} km  qty={q}")


def main() -> None:
    if not DB.exists():
        print(f"Database not found: {DB}. Run build_db.py first.")
        return
    conn = sqlite3.connect(DB)
    run(conn)
    conn.close()


if __name__ == "__main__":
    main()
