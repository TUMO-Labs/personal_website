import gevent.monkey
gevent.monkey.patch_all()
import logging
import re
import os
import uuid
import requests
import gevent
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
    room = str(uuid.uuid4())
    session_to_room[request.sid] = room
    join_room(room)
    emit('connected', {'room': room})


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
    emit('registered', {'name': name})


@socketio.on('select_mode')
def on_select_mode(data):
    mode = data.get('mode')
    if mode not in ('ai', 'human'):
        return
    session_to_mode[request.sid] = mode
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
    thread_id = session_to_thread.get(sid)
    if not thread_id:
        thread_id = tg_create_topic(username[:128])
        if thread_id:
            session_to_thread[sid] = thread_id
            tg_send(
                f'👤 <b>{username}</b> started a conversation',
                thread_id=thread_id
            )
    tg_send(f'<b>{username}:</b> {text}', thread_id=thread_id)
    print(f'[MSG] {username} (thread {thread_id}): {text}')


def _handle_ai_message(sid, username, text):
    def _call():
        history = ai_histories.setdefault(sid, [])
        history.append({"role": "user", "content": text})

        try:
            client = OpenAI(
                base_url="https://openrouter.ai/api/v1",
                api_key=os.environ.get('OPENROUTER_API_KEY', ''),
            )
            response = client.chat.completions.create(
                model="openrouter/free",  # Let OpenRouter dynamically pick a working free model
                messages=[{"role": "system", "content": SYSTEM_PROMPT}] + history,
                max_tokens=500,
            )           
            reply = response.choices[0].message.content
            reply = re.sub(r'</?assistant>', '', reply, flags=re.IGNORECASE)
            reply = re.sub(r'</?user>', '', reply, flags=re.IGNORECASE)
            reply = re.sub(r'\s+', ' ', reply).strip()   # also fixes merged words
            history.append({"role": "assistant", "content": reply})
        except Exception as e:
            logging.exception("AI Processing failed") 
            reply = "Sorry, I'm having a little trouble right now."
        room = session_to_room.get(sid)
        if room:
            socketio.emit('new_message', {
                'sender': 'ai',
                'text': reply,
            }, room=room)

    gevent.spawn(_call)


# ── Run ───────────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    socketio.run(app, debug=True, port=5000)

