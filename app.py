import os
import uuid
import requests
from flask import Flask, render_template, send_from_directory, request
from flask_socketio import SocketIO, emit, join_room
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'maria-secret-key-change-in-prod')

socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# ── Telegram config ──────────────────────────────────────────────────────────
TELEGRAM_BOT_TOKEN = os.environ.get('TELEGRAM_BOT_TOKEN', 'YOUR_BOT_TOKEN_HERE')
TELEGRAM_CHAT_ID   = os.environ.get('TELEGRAM_CHAT_ID',   'YOUR_CHAT_ID_HERE')

session_to_room = {}   # { visitor_sid: room_id }
session_to_username = {}  # { visitor_sid: telegram_username }

def send_telegram_notification(username: str, message: str):
    """
    Send Maria a Telegram notification with a direct link to the visitor's profile.
    No webhook / ngrok needed — Maria just taps the link to open a private chat.
    """
    if TELEGRAM_BOT_TOKEN == 'YOUR_BOT_TOKEN_HERE':
        print(f"[TELEGRAM STUB] @{username}: {message}")
        return

    # Clean up username — remove @ if they included it
    clean = username.lstrip('@').strip()

    text = (
        f"💬 *New message on your website!*\n\n"
        f"👤 Username: @{clean}\n"
        f"✉️ Message: {message}\n\n"
        f"👇 Tap to open chat with them:\n"
        f"https://t.me/{clean}"
    )

    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": TELEGRAM_CHAT_ID,
        "text": text,
     #   "parse_mode": "Markdown",
        "disable_web_page_preview": False,
    }
    try:
        r = requests.post(url, json=payload, timeout=10)
        print(f"[Telegram] sent notification for @{clean}: {r.status_code}")
    except Exception as e:
        print(f"[Telegram error] {e}")


# ── Routes ───────────────────────────────────────────────────────────────────
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/static/assets/<filename>')
def serve_asset(filename):
    return send_from_directory(
        os.path.join(app.root_path, 'static', 'assets'), filename
    )


# ── Socket events ────────────────────────────────────────────────────────────
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

@socketio.on('submit_username')
def on_submit_username(data):
    """Visitor submitted their Telegram username."""
    username = (data.get('username') or '').strip().lstrip('@')
    if not username:
        emit('username_error', {'text': 'Please enter a valid Telegram username.'})
        return
    session_to_username[request.sid] = username
    emit('username_accepted', {'username': username})

@socketio.on('visitor_message')
def on_visitor_message(data):
    """Visitor sent their message — forward to Telegram with their username."""
    text = (data.get('text') or '').strip()
    username = session_to_username.get(request.sid)

    if not username:
        emit('ask_username')
        return
    if not text:
        return

    print(f"[MSG] @{username}: {text}")
    send_telegram_notification(username, text)
    emit('message_sent')


# ── Run ──────────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    socketio.run(app, debug=True, port=5000)
