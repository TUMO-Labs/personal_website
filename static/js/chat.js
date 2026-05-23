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
      background: #fff;
      color: #1e3a5f;
      border: 1.5px solid #bfd4ef;
      border-radius: 40px;
      padding: 10px 18px 10px 14px;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(59,130,246,0.12);
      font-family: 'DM Mono', monospace;
      font-size: 11px;
      letter-spacing: 0.08em;
      transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease;
      user-select: none;
    }
    #chat-bubble:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 28px rgba(59,130,246,0.2);
    }
    #chat-bubble .bubble-icon { font-size: 16px; line-height: 1; flex-shrink: 0; }
    #chat-badge {
      position: absolute;
      top: -6px;
      right: -6px;
      width: 14px;
      height: 14px;
      background: #3b82f6;
      border-radius: 50%;
      display: none;
      border: 2px solid #fff;
    }
    #chat-badge.show { display: block; }
    #chat-window {
      position: fixed;
      bottom: 90px;
      right: 28px;
      z-index: 9001;
      width: 320px;
      background: #fff;
      border: 1.5px solid #bfd4ef;
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      box-shadow: 0 12px 48px rgba(59,130,246,0.12);
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
    #chat-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 16px 12px;
      border-bottom: 1px solid #bfd4ef;
      background: #f0f6ff;
      flex-shrink: 0;
    }
    .ch-avatar {
      width: 32px; height: 32px;
      border-radius: 50%;
      background: #bfd4ef;
      display: flex; align-items: center; justify-content: center;
      font-size: 15px; flex-shrink: 0;
    }
    .ch-info { flex: 1; }
    .ch-name { font-size: 12px; color: #1e3a5f; letter-spacing: 0.06em; }
    .ch-status {
      font-size: 10px; color: #4f6f96; letter-spacing: 0.04em;
      display: flex; align-items: center; gap: 4px;
    }
    .ch-status::before {
      content: ''; width: 6px; height: 6px;
      border-radius: 50%; background: #4caf82; display: inline-block;
    }
    #chat-close {
      background: none; border: none; font-size: 18px;
      color: #4f6f96; cursor: pointer; padding: 2px 4px;
      line-height: 1; transition: color 0.2s;
    }
    #chat-close:hover { color: #1e3a5f; }
    .chat-step { display: none; flex-direction: column; flex: 1; }
    .chat-step.active { display: flex; }
    #step-register {
      padding: 24px 20px;
      gap: 14px;
      align-items: center;
      text-align: center;
    }
    #step-register .step-intro {
      font-size: 12px;
      color: #2d5a8e;
      line-height: 1.6;
      letter-spacing: 0.04em;
    }
    #step-register .step-intro strong {
      display: block;
      font-size: 14px;
      color: #1e3a5f;
      margin-bottom: 6px;
    }
    .reg-input {
      width: 100%;
      border: 1.5px solid #bfd4ef;
      border-radius: 20px;
      padding: 9px 16px;
      font-family: 'DM Mono', monospace;
      font-size: 12px;
      color: #1e3a5f;
      background: #fff;
      outline: none;
      transition: border-color 0.2s;
      text-align: center;
      box-sizing: border-box;
    }
    .reg-input::placeholder { color: #8ca3bd; }
    .reg-input:focus { border-color: #3b82f6; }
    #reg-error {
      font-size: 10px;
      color: #3b82f6;
      letter-spacing: 0.06em;
      min-height: 14px;
    }
    #reg-submit {
      width: 100%;
      padding: 10px;
      background: #3b82f6;
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
    #reg-submit:hover { transform: translateY(-2px); background: #2563eb; }
    #reg-submit:active { transform: translateY(1px); }
    #step-mode {
      padding: 24px 20px;
      gap: 12px;
      align-items: center;
      text-align: center;
    }
    #step-mode .mode-intro {
      font-size: 13px;
      color: #1e3a5f;
      letter-spacing: 0.04em;
      line-height: 1.6;
    }
    #step-mode .mode-intro strong {
      display: block;
      font-size: 14px;
      color: #1e3a5f;
      margin-bottom: 8px;
    }
    .mode-btn {
      width: 100%;
      padding: 12px 16px;
      background: #fff;
      border: 1.5px solid #bfd4ef;
      border-radius: 12px;
      font-family: 'DM Mono', monospace;
      font-size: 12px;
      color: #1e3a5f;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
      letter-spacing: 0.04em;
    }
    .mode-btn:hover {
      border-color: #3b82f6;
      box-shadow: 0 4px 14px rgba(59,130,246,0.12);
      transform: translateY(-2px);
    }
    .mode-btn small {
      display: block;
      font-size: 10px;
      color: #8ca3bd;
      letter-spacing: 0.06em;
    }
    #step-message { flex-direction: column; }
    #chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 14px 14px 8px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-height: 160px;
      max-height: 260px;
      scroll-behavior: smooth;
    }
    #chat-messages::-webkit-scrollbar { width: 3px; }
    #chat-messages::-webkit-scrollbar-thumb { background: #bfd4ef; border-radius: 2px; }
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
      background: #eff6ff;
      color: #1e3a5f;
      align-self: flex-end;
      border-bottom-right-radius: 4px;
      border: 1px solid #bfd4ef;
    }
    .chat-msg.maria {
      background: #fff;
      color: #1e3a5f;
      align-self: flex-start;
      border-bottom-left-radius: 4px;
      border: 1.5px solid #bfd4ef;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .chat-msg.maria .maria-label {
      font-size: 9px;
      color: #3b82f6;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .chat-msg.system {
      background: transparent; color: #8ca3bd;
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
      border-top: 1px solid #bfd4ef;
      flex-shrink: 0;
    }
    #chat-input {
      flex: 1;
      border: 1.5px solid #bfd4ef;
      border-radius: 20px;
      padding: 8px 14px;
      font-family: 'DM Mono', monospace;
      font-size: 12px;
      color: #1e3a5f;
      background: #fff;
      outline: none;
      transition: border-color 0.2s;
    }
    #chat-input::placeholder { color: #8ca3bd; }
    #chat-input:focus { border-color: #3b82f6; }
    #chat-send {
      width: 34px; height: 34px;
      border-radius: 50%;
      background: #3b82f6;
      border: none; color: #fff; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      font-size: 14px; flex-shrink: 0; align-self: flex-end;
      transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1), background 0.2s;
    }
    #chat-send:hover { transform: scale(1.12); background: #2563eb; }
    #chat-send:active { transform: scale(0.95); }
    #chat-send:disabled { background: #bfd4ef; cursor: default; transform: none; }
  `;
  document.head.appendChild(style);

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
      <div class="ch-avatar"></div>
      <div class="ch-info">
        <div class="ch-name">Maria Aslanyan</div>
        <div class="ch-status">Usually replies soon</div>
      </div>
      <button id="chat-close" title="Close">×</button>
    </div>
    <div class="chat-step active" id="step-register">
      <div class="step-intro">
        <strong>Hey there! 👋</strong>
        Enter your name to start chatting.
      </div>
      <input id="reg-name" class="reg-input" type="text" placeholder="Your name" maxlength="50" />
      <div id="reg-error"></div>
      <button id="reg-submit">Start chatting →</button>
    </div>
    <div class="chat-step" id="step-mode">
      <div class="mode-intro">
        <strong>How would you like to chat?</strong>
      </div>
      <button class="mode-btn" id="mode-ai">
        🤖 AI Assistant
        <small>Instant answers about Maria</small>
      </button>
      <button class="mode-btn" id="mode-human">
        👤 Maria personally
        <small>She'll reply when available</small>
      </button>
    </div>
    <div class="chat-step" id="step-message">
      <div id="chat-messages"></div>
      <div id="chat-input-row">
        <input id="chat-input" type="text" placeholder="Type a message…" maxlength="400" />
        <button id="chat-send">➤</button>
      </div>
    </div>
  `;
  document.body.appendChild(win);

  const badge        = document.getElementById('chat-badge');
  const stepRegister = document.getElementById('step-register');
  const stepMode     = document.getElementById('step-mode');
  const stepMessage  = document.getElementById('step-message');
  const regName      = document.getElementById('reg-name');
  const regError     = document.getElementById('reg-error');
  const regBtn       = document.getElementById('reg-submit');
  const messagesEl   = document.getElementById('chat-messages');
  const inputEl      = document.getElementById('chat-input');
  const sendBtn      = document.getElementById('chat-send');
  let isOpen  = false;
  let sending = false;

  function openChat()  { isOpen = true;  win.classList.add('open');    badge.classList.remove('show'); }
  function closeChat() { isOpen = false; win.classList.remove('open'); }
  bubble.addEventListener('click', () => isOpen ? closeChat() : openChat());
  document.getElementById('chat-close').addEventListener('click', closeChat);

  function showStep(step) {
    [stepRegister, stepMode, stepMessage].forEach(s => s.classList.remove('active'));
    step.classList.add('active');
  }

  function addMsg(text, type) {
    const m = document.createElement('div');
    m.className = `chat-msg ${type}`;
    if (type === 'maria') {
      m.innerHTML = `<span class="maria-label">Maria</span><span>${escapeHtml(text)}</span>`;
    } else {
      m.textContent = text;
    }
    messagesEl.appendChild(m);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return m;
  }

  function escapeHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  const socket = io();

  // ── Register step ──────────────────────────────────────────────────────────

  function submitRegister() {
    const name = regName.value.trim();
    if (!name) { regError.textContent = 'Please enter your name.'; return; }
    regError.textContent = '';
    regBtn.textContent = '...';
    regBtn.disabled = true;
    socket.emit('register_visitor', { name });
  }

  regBtn.addEventListener('click', submitRegister);
  regName.addEventListener('keydown', e => { if (e.key === 'Enter') submitRegister(); });

  socket.on('registered', () => {
    showStep(stepMode);
    regBtn.textContent = 'Start chatting →';
    regBtn.disabled = false;
  });

  socket.on('error', data => {
    regError.textContent = data.message;
    regBtn.textContent = 'Start chatting →';
    regBtn.disabled = false;
  });

  // ── Mode selection step ────────────────────────────────────────────────────

  document.getElementById('mode-ai').addEventListener('click', () => {
    socket.emit('select_mode', { mode: 'ai' });
  });

  document.getElementById('mode-human').addEventListener('click', () => {
    socket.emit('select_mode', { mode: 'human' });
  });

  socket.on('mode_selected', data => {
    showStep(stepMessage);
    if (data.mode === 'ai') {
      addMsg("Hi! I'm Maria's AI assistant. Ask me anything about her background, skills, or projects.", 'maria');
    } else {
      addMsg("Hey! Maria will get back to you soon. Leave your message below 👇", 'maria');
    }
  });

  // ── Message step ───────────────────────────────────────────────────────────

  function sendMessage() {
    if (sending) return;
    const text = inputEl.value.trim();
    if (!text) return;
    addMsg(text, 'visitor');
    socket.emit('visitor_message', { message: text });
    inputEl.value = '';
    sending = true;
    inputEl.disabled = true;
    sendBtn.disabled = true;
    setTimeout(() => {
      sending = false;
      inputEl.disabled = false;
      sendBtn.disabled = false;
      inputEl.focus();
    }, 1000);
  }

  socket.on('new_message', data => {
    if (data.sender === 'you' || data.sender === 'ai') {
      if (!isOpen) badge.classList.add('show');
      showStep(stepMessage);
      addMsg(data.text, 'maria');
      bubble.style.transform = 'scale(1.1)';
      setTimeout(() => { bubble.style.transform = ''; }, 350);
    }
  });

  socket.on('chat_closed', data => {
    addMsg(data.message || 'Chat closed.', 'system');
    inputEl.disabled = true;
    sendBtn.disabled = true;
  });

  sendBtn.addEventListener('click', sendMessage);
  inputEl.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
})();
