
(function () {
  /* ── Build DOM ─────────────────────────────────── */
  const style = document.createElement('style');
  style.textContent = `
    /* Bubble trigger */
    #chat-bubble {
      position: fixed;
      bottom: 28px;
      right: 28px;
      z-index: 9000;
      display: flex;
      align-items: center;
      gap: 10px;
      background: #F7C0E5;
      color: #5a1a45;
      border: 1.5px solid #e8a0d0;
      border-radius: 40px;
      padding: 10px 18px 10px 14px;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(247,192,229,0.45);
      font-family: 'DM Mono', monospace;
      font-size: 11px;
      letter-spacing: 0.08em;
      transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1),
                  box-shadow 0.25s ease;
      user-select: none;
    }
    #chat-bubble:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 28px rgba(247,192,229,0.6);
    }
    #chat-bubble .bubble-icon {
      font-size: 16px;
      line-height: 1;
      flex-shrink: 0;
    }
    #chat-bubble .bubble-label {
      line-height: 1.35;
    }
    /* Unread badge */
    #chat-badge {
      position: absolute;
      top: -6px;
      right: -6px;
      width: 18px;
      height: 18px;
      background: #b8357a;
      color: #fff;
      border-radius: 50%;
      font-size: 10px;
      display: none;
      align-items: center;
      justify-content: center;
      font-family: 'DM Mono', monospace;
      font-weight: 400;
      border: 2px solid #F7C0E5;
    }
    #chat-badge.show { display: flex; }

    /* Chat window */
    #chat-window {
      position: fixed;
      bottom: 90px;
      right: 28px;
      z-index: 9001;
      width: 320px;
      max-height: 430px;
      background: #fdf0f8;
      border: 1.5px solid #e8a0d0;
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      box-shadow: 0 12px 48px rgba(184,53,122,0.18);
      transform: scale(0.88) translateY(12px);
      transform-origin: bottom right;
      opacity: 0;
      pointer-events: none;
      transition: transform 0.28s cubic-bezier(0.34,1.56,0.64,1),
                  opacity 0.22s ease;
      font-family: 'DM Mono', monospace;
    }
    #chat-window.open {
      transform: scale(1) translateY(0);
      opacity: 1;
      pointer-events: all;
    }

    /* Header */
    #chat-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 16px 12px;
      border-bottom: 1px solid #f0c8e4;
      background: #F7C0E5;
      border-radius: 14px 14px 0 0;
      flex-shrink: 0;
    }
    #chat-header .ch-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #b8357a;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 15px;
      flex-shrink: 0;
    }
    #chat-header .ch-info { flex: 1; }
    #chat-header .ch-name {
      font-size: 12px;
      color: #5a1a45;
      font-weight: 400;
      letter-spacing: 0.06em;
    }
    #chat-header .ch-status {
      font-size: 10px;
      color: #9a5080;
      letter-spacing: 0.04em;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    #chat-header .ch-status::before {
      content: '';
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #4caf82;
      display: inline-block;
    }
    #chat-close {
      background: none;
      border: none;
      font-size: 18px;
      color: #9a5080;
      cursor: pointer;
      padding: 2px 4px;
      line-height: 1;
      transition: color 0.2s;
    }
    #chat-close:hover { color: #5a1a45; }

    /* Messages */
    #chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 14px 14px 8px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      scroll-behavior: smooth;
    }
    #chat-messages::-webkit-scrollbar { width: 3px; }
    #chat-messages::-webkit-scrollbar-thumb { background: #e8a0d0; border-radius: 2px; }

    .chat-msg {
      max-width: 82%;
      padding: 8px 12px;
      border-radius: 12px;
      font-size: 12px;
      line-height: 1.5;
      letter-spacing: 0.02em;
      animation: msgIn 0.22s cubic-bezier(0.34,1.56,0.64,1);
    }
    @keyframes msgIn {
      from { opacity: 0; transform: translateY(6px) scale(0.95); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    .chat-msg.visitor {
      background: #F7C0E5;
      color: #4a1038;
      align-self: flex-end;
      border-bottom-right-radius: 4px;
    }
    .chat-msg.maria {
      background: #b8357a;
      color: #fff;
      align-self: flex-start;
      border-bottom-left-radius: 4px;
    }
    .chat-msg.system {
      background: transparent;
      color: #9a7090;
      font-size: 10px;
      align-self: center;
      text-align: center;
      letter-spacing: 0.08em;
      padding: 2px 0;
    }

    /* Input row */
    #chat-input-row {
      display: flex;
      gap: 8px;
      padding: 10px 12px 12px;
      border-top: 1px solid #f0c8e4;
      flex-shrink: 0;
    }
    #chat-input {
      flex: 1;
      border: 1.5px solid #e8a0d0;
      border-radius: 20px;
      padding: 8px 14px;
      font-family: 'DM Mono', monospace;
      font-size: 12px;
      color: #4a1038;
      background: #fff;
      outline: none;
      transition: border-color 0.2s;
      resize: none;
    }
    #chat-input::placeholder { color: #c090b0; }
    #chat-input:focus { border-color: #b8357a; }
    #chat-send {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: #b8357a;
      border: none;
      color: #fff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      flex-shrink: 0;
      transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1),
                  background 0.2s;
      align-self: flex-end;
    }
    #chat-send:hover { transform: scale(1.12); background: #d04090; }
    #chat-send:active { transform: scale(0.95); }
  `;
  document.head.appendChild(style);

  // Bubble
  const bubble = document.createElement('div');
  bubble.id = 'chat-bubble';
  bubble.innerHTML = `
    <span class="bubble-icon">💬</span>
    <span class="bubble-label">Have a question?<br>Chat with me.</span>
    <span id="chat-badge"></span>
  `;
  document.body.appendChild(bubble);

  // Window
  const win = document.createElement('div');
  win.id = 'chat-window';
  win.innerHTML = `
    <div id="chat-header">
      <div class="ch-avatar">🌸</div>
      <div class="ch-info">
        <div class="ch-name">Maria Aslanyan</div>
        <div class="ch-status">Usually replies soon</div>
      </div>
      <button id="chat-close" title="Close">×</button>
    </div>
    <div id="chat-messages">
      <div class="chat-msg system">Say hello 👋</div>
    </div>
    <div id="chat-input-row">
      <input id="chat-input" type="text" placeholder="Type a message…" maxlength="400" />
      <button id="chat-send">➤</button>
    </div>
  `;
  document.body.appendChild(win);

  const messagesEl = document.getElementById('chat-messages');
  const inputEl    = document.getElementById('chat-input');
  const badge      = document.getElementById('chat-badge');
  let unread = 0;
  let isOpen = false;

  /* ── Toggle ───────────────────────────────────── */
  function openChat()  { isOpen = true;  win.classList.add('open');    unread = 0; badge.textContent = ''; badge.classList.remove('show'); }
  function closeChat() { isOpen = false; win.classList.remove('open'); }

  bubble.addEventListener('click', () => isOpen ? closeChat() : openChat());
  document.getElementById('chat-close').addEventListener('click', closeChat);

  /* ── Messages ─────────────────────────────────── */
  function addMsg(text, type) {
    const m = document.createElement('div');
    m.className = `chat-msg ${type}`;
    m.textContent = text;
    messagesEl.appendChild(m);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  /* ── Socket.IO ────────────────────────────────── */
  // Load Socket.IO client from CDN then connect
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.7.5/socket.io.min.js';
  script.onload = function () {
    const socket = io();

    socket.on('connect', () => {
      console.log('[Chat] connected', socket.id);
    });

    socket.on('connected', () => {
      addMsg('Connected! Send me a message.', 'system');
    });

    // Visitor's own message confirmed by server
    socket.on('message_received', (data) => {
      // already shown optimistically, nothing to do
    });

    // Maria's reply coming back from Telegram
    socket.on('maria_reply', (data) => {
      addMsg(data.text, 'maria');
      if (!isOpen) {
        unread++;
        badge.textContent = unread;
        badge.classList.add('show');
        // gentle pulse on bubble
        bubble.style.transform = 'scale(1.08)';
        setTimeout(() => bubble.style.transform = '', 300);
      }
    });

    socket.on('disconnect', () => {
      addMsg('Connection lost. Refresh to reconnect.', 'system');
    });

    /* ── Send ──────────────────────────────────── */
    function sendMessage() {
      const text = inputEl.value.trim();
      if (!text) return;
      addMsg(text, 'visitor');
      socket.emit('visitor_message', { text });
      inputEl.value = '';
    }

    document.getElementById('chat-send').addEventListener('click', sendMessage);
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    });
  };
  document.head.appendChild(script);
})();
