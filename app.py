import gevent.monkey
gevent.monkey.patch_all()
import logging
import re
import os
import uuid
import sqlite3
import requests
import gevent
from datetime import datetime
from openai import OpenAI
from flask import Flask, render_template, send_from_directory, request
from flask_socketio import SocketIO, emit, join_room
from dotenv import load_dotenv
from ai_profile import SYSTEM_PROMPT

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'maria-secret-key-change-in-prod')

socketio = SocketIO(app, cors_allowed_origins="*", async_mode='gevent')

TELEGRAM_BOT_TOKEN = os.environ.get('TELEGRAM_BOT_TOKEN', '')
TELEGRAM_CHAT_ID   = os.environ.get('TELEGRAM_CHAT_ID', '')
TG_API = f'https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}'

session_to_room     = {}  # { sid: room_id }
session_to_username = {}  # { sid: name }
session_to_thread   = {}  # { sid: tg_thread_id }
session_to_mode     = {}  # { sid: 'ai' | 'human' }
ai_histories        = {}  # { sid: [ {role, content}, ... ] }


# ── Database ──────────────────────────────────────────────────────────────────

DB_PATH = os.path.join(os.path.dirname(__file__), 'chat.db')

def db_init():
    with sqlite3.connect(DB_PATH) as con:
        con.execute('''
            CREATE TABLE IF NOT EXISTS messages (
                id        INTEGER PRIMARY KEY AUTOINCREMENT,
                room_id   TEXT NOT NULL,
                sender    TEXT NOT NULL,
                text      TEXT NOT NULL,
                ts        TEXT NOT NULL
            )
        ''')
        con.execute('''
            CREATE TABLE IF NOT EXISTS sessions (
                room_id   TEXT PRIMARY KEY,
                username  TEXT,
                mode      TEXT,
                tg_thread INTEGER
            )
        ''')
        con.execute('CREATE INDEX IF NOT EXISTS idx_room ON messages(room_id)')

def db_save_message(room_id: str, sender: str, text: str):
    with sqlite3.connect(DB_PATH) as con:
        con.execute(
            'INSERT INTO messages (room_id, sender, text, ts) VALUES (?,?,?,?)',
            (room_id, sender, text, datetime.utcnow().isoformat())
        )

def db_load_messages(room_id: str) -> list:
    with sqlite3.connect(DB_PATH) as con:
        rows = con.execute(
            'SELECT sender, text, ts FROM messages WHERE room_id=? ORDER BY id',
            (room_id,)
        ).fetchall()
    return [{'sender': r[0], 'text': r[1], 'ts': r[2]} for r in rows]

def db_save_session(room_id: str, username: str = None, mode: str = None, tg_thread: int = None):
    with sqlite3.connect(DB_PATH) as con:
        con.execute('''
            INSERT INTO sessions (room_id, username, mode, tg_thread)
            VALUES (?,?,?,?)
            ON CONFLICT(room_id) DO UPDATE SET
                username  = COALESCE(excluded.username,  username),
                mode      = COALESCE(excluded.mode,      mode),
                tg_thread = COALESCE(excluded.tg_thread, tg_thread)
        ''', (room_id, username, mode, tg_thread))

def db_load_session(room_id: str) -> dict:
    with sqlite3.connect(DB_PATH) as con:
        row = con.execute(
            'SELECT username, mode, tg_thread FROM sessions WHERE room_id=?',
            (room_id,)
        ).fetchone()
    if row:
        return {'username': row[0], 'mode': row[1], 'tg_thread': row[2]}
    return {}

db_init()


# ── Telegram helpers ──────────────────────────────────────────────────────────

def tg_post(method: str, payload: dict):
    try:
        r = requests.post(f'{TG_API}/{method}', json=payload, timeout=10)
        return r.json()
    except Exception as e:
        print(f'[TG] {method} error: {e}')
        return {}


def tg_create_topic(name: str) -> int:
    result = tg_post('createForumTopic', {
        'chat_id': TELEGRAM_CHAT_ID,
        'name': name[:128],
    })
    return result.get('result', {}).get('message_thread_id')


def tg_send(text: str, thread_id: int = None):
    payload = {
        'chat_id': TELEGRAM_CHAT_ID,
        'text': text,
        'parse_mode': 'HTML',
        'disable_web_page_preview': True,
    }
    if thread_id:
        payload['message_thread_id'] = thread_id
    tg_post('sendMessage', payload)


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/static/assets/<filename>')
def serve_asset(filename):
    return send_from_directory(
        os.path.join(app.root_path, 'static', 'assets'), filename
    )


# ── Socket events ─────────────────────────────────────────────────────────────

@socketio.on('connect')
def on_connect():
    # reuse existing room_id if the client sends one (survives page refresh)
    existing_room = request.args.get('room_id')
    room = existing_room if existing_room else str(uuid.uuid4())

    session_to_room[request.sid] = room
    join_room(room)

    # restore session state from DB
    saved = db_load_session(room)
    if saved.get('username'):
        session_to_username[request.sid] = saved['username']
    if saved.get('mode'):
        session_to_mode[request.sid] = saved['mode']
    if saved.get('tg_thread'):
        session_to_thread[request.sid] = saved['tg_thread']

    # load message history
    history = db_load_messages(room)

    emit('connected', {
        'room': room,
        'history': history,
        'session': saved,
    })


@socketio.on('disconnect')
def on_disconnect():
    session_to_room.pop(request.sid, None)
    session_to_username.pop(request.sid, None)
    session_to_thread.pop(request.sid, None)
    session_to_mode.pop(request.sid, None)
    ai_histories.pop(request.sid, None)


@socketio.on('register_visitor')
def on_register_visitor(data):
    name = (data.get('name') or '').strip()
    if not name:
        emit('error', {'message': 'Please enter a valid name.'})
        return
    session_to_username[request.sid] = name
    room = session_to_room.get(request.sid)
    if room:
        db_save_session(room, username=name)
    emit('registered', {'name': name})


@socketio.on('select_mode')
def on_select_mode(data):
    mode = data.get('mode')
    if mode not in ('ai', 'human'):
        return
    session_to_mode[request.sid] = mode
    room = session_to_room.get(request.sid)
    if room:
        db_save_session(room, mode=mode)
    emit('mode_selected', {'mode': mode})


@socketio.on('visitor_message')
def on_visitor_message(data):
    text = (data.get('message') or '').strip()
    username = session_to_username.get(request.sid)

    if not username:
        emit('error', {'message': 'Please register first.'})
        return
    if not text:
        return

    mode = session_to_mode.get(request.sid, 'human')

    if mode == 'ai':
        _handle_ai_message(request.sid, username, text)
    else:
        _handle_human_message(request.sid, username, text)


# ── Message handlers ──────────────────────────────────────────────────────────

def _handle_human_message(sid, username, text):
    room = session_to_room.get(sid)
    db_save_message(room, 'visitor', text)

    thread_id = session_to_thread.get(sid)
    if not thread_id:
        thread_id = tg_create_topic(username[:128])
        if thread_id:
            session_to_thread[sid] = thread_id
            if room:
                db_save_session(room, tg_thread=thread_id)
            tg_send(
                f'👤 <b>{username}</b> started a conversation',
                thread_id=thread_id
            )
    tg_send(f'<b>{username}:</b> {text}', thread_id=thread_id)
    print(f'[MSG] {username} (thread {thread_id}): {text}')


def _handle_ai_message(sid, username, text):
    def _call():
        room = session_to_room.get(sid)
        history = ai_histories.setdefault(sid, [])

        # if history is empty but we have DB history, rebuild it for context
        if not history and room:
            db_msgs = db_load_messages(room)
            for m in db_msgs:
                if m['sender'] == 'visitor':
                    history.append({"role": "user", "content": m['text']})
                elif m['sender'] == 'ai':
                    history.append({"role": "assistant", "content": m['text']})

        history.append({"role": "user", "content": text})
        db_save_message(room, 'visitor', text)

        try:
            client = OpenAI(
                base_url="https://openrouter.ai/api/v1",
                api_key=os.environ.get('OPENROUTER_API_KEY', ''),
            )
            response = client.chat.completions.create(
                model="openrouter/free",
                messages=[{"role": "system", "content": SYSTEM_PROMPT}] + history,
                max_tokens=500,
            )
            reply = response.choices[0].message.content
            reply = re.sub(r'</?assistant>', '', reply, flags=re.IGNORECASE)
            reply = re.sub(r'</?user>', '', reply, flags=re.IGNORECASE)
            reply = re.sub(r'\s+', ' ', reply).strip()
            history.append({"role": "assistant", "content": reply})
            db_save_message(room, 'ai', reply)
        except Exception as e:
            logging.exception("AI Processing failed")
            reply = "Sorry, I'm having a little trouble right now."

        if room:
            socketio.emit('new_message', {
                'sender': 'ai',
                'text': reply,
            }, room=room)

    gevent.spawn(_call)


# ── Telegram webhook (incoming replies from Maria) ────────────────────────────

@app.route('/telegram-webhook', methods=['POST'])
def telegram_webhook():
    import json
    data = request.get_json(silent=True) or {}
    message = data.get('message', {})
    thread_id = message.get('message_thread_id')
    text = message.get('text', '').strip()

    if not text or not thread_id:
        return 'ok'

    # find which room this thread belongs to
    target_room = None
    for sid, tid in session_to_thread.items():
        if tid == thread_id:
            target_room = session_to_room.get(sid)
            break

    if target_room:
        db_save_message(target_room, 'maria', text)
        socketio.emit('new_message', {'sender': 'you', 'text': text}, room=target_room)

    return 'ok'


# ── Run ───────────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    socketio.run(app, debug=True, port=5000)
