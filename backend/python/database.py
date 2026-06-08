import sqlite3

def init_db():
    conn = sqlite3.connect('kasir_pro.db')
    conn.execute('''
        CREATE TABLE IF NOT EXISTS transaksi (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            data_transaksi TEXT,
            total REAL,
            created_at TEXT
        )
    ''')
    conn.commit()
    conn.close()