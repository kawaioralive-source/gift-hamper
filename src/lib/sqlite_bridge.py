import sqlite3
import json
import sys
import os

def main():
    if len(sys.argv) < 3:
        print(json.dumps([]))
        return

    db_path = sys.argv[1]
    query = sys.argv[2]
    params = json.loads(sys.argv[3]) if len(sys.argv) > 3 else []

    if not os.path.exists(db_path):
        print(json.dumps([]))
        return

    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        cur.execute(query, params)

        if query.strip().upper().startswith("SELECT"):
            rows = [dict(r) for r in cur.fetchall()]
            print(json.dumps(rows))
        else:
            conn.commit()
            print(json.dumps({"success": True, "lastrowid": cur.lastrowid}))
        conn.close()
    except Exception as e:
        sys.stderr.write(str(e))
        print(json.dumps([]))

if __name__ == '__main__':
    main()
