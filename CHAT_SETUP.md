# Chat → Telegram Setup Guide

## How it works
1. Visitor types in the chat widget on your site
2. Flask-SocketIO receives it in real-time
3. Your Flask server forwards it to **your Telegram** via a bot
4. You **reply** to that Telegram message → it appears in the visitor's chat instantly

---

## Step 1 — Create a Telegram Bot

1. Open Telegram → search **@BotFather**
2. Send `/newbot` → follow prompts → copy your **bot token**
   Example: `7123456789:AAFxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

## Step 2 — Get your Telegram Chat ID

1. Start a chat with your new bot (send it any message)
2. Open this URL in your browser (replace TOKEN):
   `https://api.telegram.org/bot<TOKEN>/getUpdates`
3. Find `"chat":{"id":` — that number is your **CHAT_ID**

## Step 3 — Set environment variables

**macOS/Linux:**
```bash
export TELEGRAM_BOT_TOKEN="7123456789:AAFxxx..."
export TELEGRAM_CHAT_ID="123456789"
python app.py
```

**Windows (CMD):**
```cmd
set TELEGRAM_BOT_TOKEN=7123456789:AAFxxx...
set TELEGRAM_CHAT_ID=123456789
python app.py
```

**Or** just edit `app.py` lines 13–14 directly for local dev:
```python
TELEGRAM_BOT_TOKEN = '7123456789:AAFxxx...'
TELEGRAM_CHAT_ID   = '123456789'
```

## Step 4 — Set the Telegram Webhook (for replies to reach visitors)

You need a public URL. For **local dev**, use [ngrok](https://ngrok.com):

```bash
# In a separate terminal:
ngrok http 5000
# Copy the https URL, e.g. https://abc123.ngrok-free.app
```

Then register the webhook once:
```
https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://abc123.ngrok-free.app/telegram-webhook
```

For **production**, replace the ngrok URL with your real domain.

## Step 5 — Install & run

```bash
pip install -r requirements.txt
python app.py
```

Open http://localhost:5000 — the chat bubble is in the bottom-left corner!

---

## How to reply

1. A visitor sends a message → you get a Telegram notification from your bot
2. In Telegram, **long-press → Reply** to that specific message
3. Type your reply → visitor sees it instantly in their chat window
