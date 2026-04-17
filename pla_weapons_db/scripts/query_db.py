"""
pla_weapons.db 查詢範例。
執行: python3 scripts/query_db.py
"""
import sqlite3, json, pathlib

DB = pathlib.Path(__file__).parent.parent / "data" / "pla_weapons.db"

def show(title, rows, headers):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print('='*60)
    col_w = [max(len(str(r[i])) for r in ([headers] + list(rows))) for i in range(len(headers))]
    fmt = "  ".join(f"{{:<{w}}}" for w in col_w)
    print(fmt.format(*headers))
    print("  ".join("-"*w for w in col_w))
    for row in rows:
        print(fmt.format(*[str(v or "") for v in row]))

def main():
    con = sqlite3.connect(DB)
    cur = con.cursor()

    # 1. 各軍種武器數量統計
    rows = cur.execute("""
        SELECT b.id, b.name_cn, COUNT(w.id) as 武器筆數
        FROM branches b LEFT JOIN weapons w ON b.id = w.branch_id
        GROUP BY b.id ORDER BY 武器筆數 DESC
    """).fetchall()
    show("各軍種武器數量統計", rows, ["軍種代號", "軍種名稱", "武器筆數"])

    # 2. 各類別武器分布
    rows = cur.execute("""
        SELECT category, COUNT(*) as 筆數,
               GROUP_CONCAT(branch_id, '/') as 涉及軍種
        FROM weapons GROUP BY category ORDER BY 筆數 DESC
    """).fetchall()
    show("各武器類別統計", rows, ["類別", "筆數", "涉及軍種"])

    # 3. 火箭軍彈道飛彈列表
    rows = cur.execute("""
        SELECT name_cn, name_en, in_service, notes
        FROM weapons
        WHERE branch_id='PLARF' AND category LIKE '%彈道飛彈%'
        ORDER BY in_service
    """).fetchall()
    show("火箭軍彈道飛彈", rows, ["中文名", "英文/代號", "服役年份", "備註"])

    # 4. 近十年服役 (2015+) 之武器
    rows = cur.execute("""
        SELECT branch_id, category, name_cn, in_service
        FROM weapons
        WHERE CAST(in_service AS INTEGER) >= 2015
        ORDER BY in_service DESC
    """).fetchall()
    show("2015 年後服役新裝備", rows, ["軍種", "類別", "中文名", "服役年份"])

    # 5. 某武器來源引用範例 (殲-20)
    rows = cur.execute("""
        SELECT ws.citation
        FROM weapon_sources ws
        JOIN weapons w ON w.id = ws.weapon_id
        WHERE w.name_cn = '殲-20 威龍'
    """).fetchall()
    show("殲-20 威龍 專業來源引用", rows, ["來源引用"])

    con.close()

if __name__ == "__main__":
    main()
