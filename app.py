import os
import uuid
import requests
from flask import Flask, render_template, send_from_directory, request
from flask_socketio import SocketIO, emit, join_room

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'maria-secret-key-change-in-prod')

socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# ── Telegram config ─────────────────────────────────────────────────────────
# Set these as environment variables, or replace the defaults below for local dev
TELEGRAM_BOT_TOKEN = os.environ.get('TELEGRAM_BOT_TOKEN', 'YOUR_BOT_TOKEN_HERE')
TELEGRAM_CHAT_ID   = os.environ.get('TELEGRAM_CHAT_ID',   'YOUR_CHAT_ID_HERE')

# Maps telegram message_id → visitor socket session id
pending_replies = {}   # { telegram_msg_id: visitor_sid }
session_to_room  = {}  # { visitor_sid: room_id }

def send_telegram(text: str, visitor_sid: str):
    """Forward a visitor message to your Telegram. Returns the sent message_id."""
    if TELEGRAM_BOT_TOKEN == 'YOUR_BOT_TOKEN_HERE':
        print(f"[TELEGRAM STUB] Would send: {text}")
        return None
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": TELEGRAM_CHAT_ID,
        "text": f"💬 *Visitor says:*\n{text}\n\n_Reply to this message to respond to them._",
        "parse_mode": "Markdown",
    }
    try:
        r = requests.post(url, json=payload, timeout=10)
        data = r.json()
        if data.get("ok"):
            msg_id = data["result"]["message_id"]
            pending_replies[msg_id] = visitor_sid
            return msg_id
    except Exception as e:
        print(f"[Telegram error] {e}")
    return None


# ── Routes ───────────────────────────────────────────────────────────────────
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
    """
    Telegram calls this when you REPLY to a forwarded visitor message.
    For local dev: run  ngrok http 5000  then set the webhook once:
      https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<ngrok-id>.ngrok.io/telegram-webhook
    """
    data = request.get_json(silent=True) or {}
    message = data.get('message', {})
    reply_to = message.get('reply_to_message', {})
    if not reply_to:
        return 'ok', 200

    replied_msg_id = reply_to.get('message_id')
    text = message.get('text', '')
    visitor_sid = pending_replies.get(replied_msg_id)

    if visitor_sid and text:
        room = session_to_room.get(visitor_sid)
        if room:
            socketio.emit('maria_reply', {'text': text}, room=room)

    return 'ok', 200


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

@socketio.on('visitor_message')
def on_visitor_message(data):
    text = (data.get('text') or '').strip()
    if not text:
        return
    print(f"[MSG from {request.sid[:8]}] {text}")
    send_telegram(text, request.sid)
    emit('message_received', {'text': text})


# ── Run ──────────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    socketio.run(app, debug=True, port=5000)
