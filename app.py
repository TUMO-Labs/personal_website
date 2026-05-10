import os
import uuid
import requests
from flask import Flask, render_template, send_from_directory, request, jsonify
from flask_socketio import SocketIO, emit, join_room
from dotenv import load_dotenv
load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'maria-secret-key-change-in-prod')

socketio = SocketIO(app, cors_allowed_origins="*")

TELEGRAM_BOT_TOKEN = os.environ.get('TELEGRAM_BOT_TOKEN', 'YOUR_BOT_TOKEN_HERE')
TELEGRAM_CHAT_ID   = os.environ.get('TELEGRAM_CHAT_ID',   'YOUR_CHAT_ID_HERE')

session_to_room     = {}
session_to_username = {}
room_to_sid         = {}

def send_telegram_notification(username: str, message: str, room_id: str):
    if TELEGRAM_BOT_TOKEN == 'YOUR_BOT_TOKEN_HERE':
        print(f"[TELEGRAM STUB] room={room_id} @{username}: {message}")
        return None

    clean = username.lstrip('@').strip()

    text = (
        f"💬 *New message on your website!*\n\n"
        f"👤 Visitor: @{clean}\n"
        f"✉️ Message: {message}\n\n"
        f"👇 Reply to *this message* to respond in the chat widget.\n"
        f"`room:{room_id}`"
    )

    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": TELEGRAM_CHAT_ID,
        "text": text,
        "parse_mode": "Markdown",
        "disable_web_page_preview": True,
    }
    try:
        r = requests.post(url, json=payload, timeout=10)
        data = r.json()
        msg_id = data.get("result", {}).get("message_id")
        print(f"[Telegram] sent notification for @{clean}, msg_id={msg_id}: {r.status_code}")
        return msg_id
    except Exception as e:
        print(f"[Telegram error] {e}")
        return None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/static/assets/<filename>')
def serve_asset(filename):
    return send_from_directory(
        os.path.join(app.root_path, 'static', 'assets'), filename
    )

@app.route('/telegram-webhook', methods=['POST'])
def telegram_webhook():
    data = request.get_json(silent=True) or {}
    message = data.get('message', {})

    reply_to = message.get('reply_to_message', {})
    reply_text = reply_to.get('text', '')

    room_id = None
    for line in reply_text.splitlines():
        line = line.strip()
        if line.startswith('room:'):
            room_id = line[len('room:'):]
            break

    if not room_id:
        return jsonify(ok=True)

    reply_body = (message.get('text') or '').strip()
    if not reply_body:
        return jsonify(ok=True)

    visitor_sid = room_to_sid.get(room_id)
    if visitor_sid and visitor_sid in session_to_room:
        room = session_to_room[visitor_sid]
        socketio.emit('maria_reply', {'text': reply_body}, room=room)
        print(f"[Webhook] routed reply to room={room_id}: {reply_body[:60]}")
    else:
        print(f"[Webhook] room_id={room_id} not found or visitor disconnected")

    return jsonify(ok=True)

@socketio.on('connect')
def on_connect():
    room = str(uuid.uuid4())
    session_to_room[request.sid] = room
    room_to_sid[room] = request.sid
    join_room(room)
    emit('connected', {'room': room})

@socketio.on('disconnect')
def on_disconnect():
    room = session_to_room.pop(request.sid, None)
    if room:
        room_to_sid.pop(room, None)
    session_to_username.pop(request.sid, None)

@socketio.on('submit_username')
def on_submit_username(data):
    username = (data.get('username') or '').strip().lstrip('@')
    if not username:
        emit('username_error', {'text': 'Please enter a valid Telegram username.'})
        return
    session_to_username[request.sid] = username
    emit('username_accepted', {'username': username})

@socketio.on('visitor_message')
def on_visitor_message(data):
    text     = (data.get('text') or '').strip()
    username = session_to_username.get(request.sid)
    room     = session_to_room.get(request.sid)

    if not username:
        emit('ask_username')
        return
    if not text or not room:
        return

    print(f"[MSG] @{username} (room={room}): {text}")
    send_telegram_notification(username, text, room)
    emit('message_sent')

if __name__ == '__main__':
    socketio.run(app, debug=True, port=5000)
