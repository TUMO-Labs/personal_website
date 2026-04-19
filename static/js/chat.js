/* =====================================================
   CHAT WIDGET — username flow, no webhook needed
   ===================================================== */

(function () {
  const style = document.createElement('style');
  style.textContent = `
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
      transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease;
      user-select: none;
    }
    #chat-bubble:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 28px rgba(247,192,229,0.6);
    }
    #chat-bubble .bubble-icon { font-size: 16px; line-height: 1; flex-shrink: 0; }

    /* Notification badge */
    #chat-badge {
      position: absolute;
      top: -6px;
      right: -6px;
      width: 14px;
      height: 14px;
      background: #b8357a;
      border-radius: 50%;
      display: none;
      border: 2px solid #F7C0E5;
    }
    #chat-badge.show { display: block; }

    /* Chat window */
    #chat-window {
      position: fixed;
      bottom: 90px;
      right: 28px;
      z-index: 9001;
      width: 320px;
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
      transition: transform 0.28s cubic-bezier(0.34,1.56,0.64,1), opacity 0.22s ease;
      font-family: 'DM Mono', monospace;
      overflow: hidden;
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
      flex-shrink: 0;
    }
    .ch-avatar {
      width: 32px; height: 32px;
      border-radius: 50%;
      background: #b8357a;
      display: flex; align-items: center; justify-content: center;
      font-size: 15px; flex-shrink: 0;
    }
    .ch-info { flex: 1; }
    .ch-name { font-size: 12px; color: #5a1a45; letter-spacing: 0.06em; }
    .ch-status {
      font-size: 10px; color: #9a5080; letter-spacing: 0.04em;
      display: flex; align-items: center; gap: 4px;
    }
    .ch-status::before {
      content: ''; width: 6px; height: 6px;
      border-radius: 50%; background: #4caf82; display: inline-block;
    }
    #chat-close {
      background: none; border: none; font-size: 18px;
      color: #9a5080; cursor: pointer; padding: 2px 4px;
      line-height: 1; transition: color 0.2s;
    }
    #chat-close:hover { color: #5a1a45; }

    /* Step panels */
    .chat-step {
      display: none;
      flex-direction: column;
      flex: 1;
    }
    .chat-step.active { display: flex; }

    /* ── Step 1: username form ── */
    #step-username {
      padding: 24px 20px;
      gap: 14px;
      align-items: center;
      text-align: center;
    }
    #step-username .step-intro {
      font-size: 12px;
      color: #7a2258;
      line-height: 1.6;
      letter-spacing: 0.04em;
    }
    #step-username .step-intro strong {
      display: block;
      font-size: 14px;
      color: #5a1a45;
      margin-bottom: 6px;
    }
    #username-input {
      width: 100%;
      border: 1.5px solid #e8a0d0;
      border-radius: 20px;
      padding: 9px 16px;
      font-family: 'DM Mono', monospace;
      font-size: 12px;
      color: #4a1038;
      background: #fff;
      outline: none;
      transition: border-color 0.2s;
      text-align: center;
    }
    #username-input::placeholder { color: #c090b0; }
    #username-input:focus { border-color: #b8357a; }
    #username-error {
      font-size: 10px;
      color: #b8357a;
      letter-spacing: 0.06em;
      min-height: 14px;
    }
    #username-submit {
      width: 100%;
      padding: 10px;
      background: #b8357a;
      color: #fff;
      border: none;
      border-radius: 20px;
      font-family: 'DM Mono', monospace;
      font-size: 11px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      cursor: pointer;
      transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1), background 0.2s;
    }
    #username-submit:hover { transform: translateY(-2px); background: #d04090; }
    #username-submit:active { transform: translateY(1px); }

    /* ── Step 2: message form ── */
    #step-message {
      flex-direction: column;
    }
    #chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 14px 14px 8px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-height: 160px;
      max-height: 220px;
      scroll-behavior: smooth;
    }
    #chat-messages::-webkit-scrollbar { width: 3px; }
    #chat-messages::-webkit-scrollbar-thumb { background: #e8a0d0; border-radius: 2px; }

    .chat-msg {
      max-width: 85%;
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
      background: #F7C0E5; color: #4a1038;
      align-self: flex-end; border-bottom-right-radius: 4px;
    }
    .chat-msg.system {
      background: transparent; color: #9a7090;
      font-size: 10px; align-self: center;
      text-align: center; letter-spacing: 0.07em; padding: 2px 0;
    }
    .chat-msg.success {
      background: #f0faf5; color: #2d7a55;
      align-self: center; text-align: center;
      font-size: 11px; border: 1px solid #a8e0c0;
      border-radius: 12px; padding: 8px 14px;
    }

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
    }
    #chat-input::placeholder { color: #c090b0; }
    #chat-input:focus { border-color: #b8357a; }
    #chat-send {
      width: 34px; height: 34px;
      border-radius: 50%;
      background: #b8357a;
      border: none; color: #fff; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      font-size: 14px; flex-shrink: 0; align-self: flex-end;
      transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1), background 0.2s;
    }
    #chat-send:hover { transform: scale(1.12); background: #d04090; }
    #chat-send:active { transform: scale(0.95); }
    #chat-send:disabled { background: #e8a0d0; cursor: default; transform: none; }
  `;
  document.head.appendChild(style);

  /* ── Build DOM ───────────────────────────────── */
  const bubble = document.createElement('div');
  bubble.id = 'chat-bubble';
  bubble.innerHTML = `
    <span class="bubble-icon">💬</span>
    <span class="bubble-label">Have a question?<br>Chat with me.</span>
    <span id="chat-badge"></span>
  `;
  document.body.appendChild(bubble);

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

    <!-- Step 1: ask for Telegram username -->
    <div class="chat-step active" id="step-username">
      <div class="step-intro">
        <strong>Hey there! 👋</strong>
        Enter your Telegram username so I can reply to you directly.
      </div>
      <input id="username-input" type="text" placeholder="@yourusername" maxlength="32" />
      <div id="username-error"></div>
      <button id="username-submit">Continue →</button>
    </div>

    <!-- Step 2: write message -->
    <div class="chat-step" id="step-message">
      <div id="chat-messages">
        <div class="chat-msg system">Say hello 👋</div>
      </div>
      <div id="chat-input-row">
        <input id="chat-input" type="text" placeholder="Type a message…" maxlength="400" />
        <button id="chat-send">➤</button>
      </div>
    </div>
  `;
  document.body.appendChild(win);

  /* ── Refs ──────────────────────────────────────────── */
  const badge         = document.getElementById('chat-badge');
  const stepUsername  = document.getElementById('step-username');
  const stepMessage   = document.getElementById('step-message');
  const usernameInput = document.getElementById('username-input');
  const usernameError = document.getElementById('username-error');
  const usernameBtn   = document.getElementById('username-submit');
  const messagesEl    = document.getElementById('chat-messages');
  const inputEl       = document.getElementById('chat-input');
  const sendBtn       = document.getElementById('chat-send');
  let isOpen = false;
  let messageSent = false;

  /* ── Toggle ─────────────────────────────────── */
  function openChat()  { isOpen = true;  win.classList.add('open');    badge.classList.remove('show'); }
  function closeChat() { isOpen = false; win.classList.remove('open'); }
  bubble.addEventListener('click', () => isOpen ? closeChat() : openChat());
  document.getElementById('chat-close').addEventListener('click', closeChat);

  function showStep(step) {
    stepUsername.classList.remove('active');
    stepMessage.classList.remove('active');
    step.classList.add('active');
  }

  function addMsg(text, type) {
    const m = document.createElement('div');
    m.className = `chat-msg ${type}`;
    m.textContent = text;
    messagesEl.appendChild(m);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  /* ── Socket.IO ─────────────────────────────── */
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.7.5/socket.io.min.js';
  script.onload = function () {
    const socket = io();

    /* username step */
    function submitUsername() {
      const val = usernameInput.value.trim();
      if (!val || val === '@') {
        usernameError.textContent = 'Please enter your Telegram username.';
        return;
      }
      usernameError.textContent = '';
      usernameBtn.textContent = '...';
      usernameBtn.disabled = true;
      socket.emit('submit_username', { username: val });
    }

    usernameBtn.addEventListener('click', submitUsername);
    usernameInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') submitUsername();
    });

    socket.on('username_error', data => {
      usernameError.textContent = data.text;
      usernameBtn.textContent = 'Continue →';
      usernameBtn.disabled = false;
    });

    socket.on('username_accepted', data => {
      showStep(stepMessage);
      addMsg(`Hi! I'm @${data.username.replace('@','')}. I'd like to ask you something.`, 'visitor');
    });

    /* message step */
    function sendMessage() {
      if (messageSent) return;
      const text = inputEl.value.trim();
      if (!text) return;
      addMsg(text, 'visitor');
      socket.emit('visitor_message', { text });
      inputEl.value = '';
      inputEl.disabled = true;
      sendBtn.disabled = true;
    }

    socket.on('message_sent', () => {
      messageSent = true;
      addMsg('✓ Message sent! Maria will reach out to you on Telegram soon.', 'success');
      badge.classList.add('show');
      // after a short delay allow sending more messages
      setTimeout(() => {
        messageSent = false;
        inputEl.disabled = false;
        sendBtn.disabled = false;
        inputEl.focus();
      }, 2000);
    });

    socket.on('ask_username', () => {
      showStep(stepUsername);
    });

    sendBtn.addEventListener('click', sendMessage);
    inputEl.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    });
  };
  document.head.appendChild(script);
})();
