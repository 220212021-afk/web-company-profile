from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import json
from datetime import datetime
import aiosqlite

app = Flask(__name__)
CORS(app)

async def get_db():
    db = await aiosqlite.connect('kasir_pro.db')
    db.row_factory = sqlite3.Row
    return db

@app.route('/api/login', methods=['POST'])
async def login():
    data = request.get_json()
    if data.get('username') == 'admin' and data.get('password') == '123':
        return jsonify({'success': True, 'message': 'Login successful'})
    return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

@app.route('/api/transaksi', methods=['POST'])
async def simpan_transaksi():
    data = request.get_json()
    db = await get_db()
    
    await db.execute(
        'INSERT INTO transaksi (data_transaksi, total, created_at) VALUES (?, ?, ?)',
        (json.dumps(data['transaksi']), data['total'], datetime.now().isoformat())
    )
    await db.commit()
    await db.close()
    
    return jsonify({'success': True, 'message': 'Transaksi tersimpan'})

@app.route('/api/laporan', methods=['GET'])
async def get_laporan():
    db = await get_db()
    async with db.execute('SELECT * FROM transaksi ORDER BY created_at DESC') as cursor:
        rows = await cursor.fetchall()
    await db.close()
    
    return jsonify([dict(row) for row in rows])

if __name__ == '__main__':
    import asyncio
    app.run(debug=True, port=5000)