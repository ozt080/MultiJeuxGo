(function () {
    if (!window.CHAT_USER) return;

    const salonCode = (window.GAME_CONFIG && window.GAME_CONFIG.salon) ? window.GAME_CONFIG.salon : null;
    let mode = salonCode ? 'salon' : 'general';
    let friendId = 0;
    let lastMsgId = 0;
    let unread = 0;
    let isOpen = Boolean(salonCode);

    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
        <button type="button" class="chat-fab" id="chatToggleBtn">
            💬 Chat <span class="chat-badge" id="chatUnread" style="display:none;">0</span>
        </button>
        <div class="chat-drawer ${isOpen ? 'open' : ''}" id="chatDrawer">
            <div class="chat-top">
                <strong>💬 Discussion</strong>
                <button type="button" id="chatCloseBtn" style="background:none;border:none;color:#94a3b8;font-size:1.1rem;cursor:pointer;">✕</button>
            </div>
            <div class="chat-tabs">
                ${salonCode ? `<button type="button" class="chat-tab active" data-mode="salon">🎮 Salon</button>` : ''}
                <button type="button" class="chat-tab ${!salonCode ? 'active' : ''}" data-mode="general">🌍 Général</button>
                <button type="button" class="chat-tab" data-mode="prive">👥 Amis</button>
            </div>
            <div class="chat-friend-bar" id="chatFriendBar" style="display:none;">
                <select id="chatFriendSelect" class="form-control" style="padding:7px 10px;font-size:0.84rem;">
                    <option value="0">Choisir un ami...</option>
                </select>
            </div>
            <div class="chat-messages" id="chatMessages"></div>
            <form class="chat-form" id="chatForm">
                <input type="text" id="chatInput" maxlength="500" placeholder="Écrire un message..." autocomplete="off">
                <button type="submit" class="btn btn-primary" style="padding:8px 13px;">➤</button>
            </form>
        </div>
    `;
    document.body.appendChild(wrapper);

    const drawer = document.getElementById('chatDrawer');
    const box = document.getElementById('chatMessages');
    const input = document.getElementById('chatInput');
    const friendBar = document.getElementById('chatFriendBar');
    const friendSelect = document.getElementById('chatFriendSelect');
    const unreadBadge = document.getElementById('chatUnread');

    // Empêche les touches tapées dans le chat de contrôler les jeux (Snake, Voiture, Pinball...)
    input.addEventListener('keydown', e => e.stopPropagation());
    input.addEventListener('keyup', e => e.stopPropagation());

    function toggleChat(forceState) {
        isOpen = typeof forceState === 'boolean' ? forceState : !isOpen;
        drawer.classList.toggle('open', isOpen);
        if (isOpen) {
            unread = 0;
            unreadBadge.style.display = 'none';
            box.scrollTop = box.scrollHeight;
        }
    }

    document.getElementById('chatToggleBtn').onclick = () => toggleChat();
    document.getElementById('chatCloseBtn').onclick = () => toggleChat(false);

    async function chargerAmis() {
        const res = await fetch('api/chat.php?action=joueurs');
        const data = await res.json();
        if (!data.ok) return;
        const prev = friendSelect.value;
        friendSelect.innerHTML = '<option value="0">Choisir un ami...</option>' +
            data.joueurs.map(j => `<option value="${j.id}">${escapeHtml(j.pseudo)} (${j.score} pts)</option>`).join('');
        if (prev && prev !== '0') friendSelect.value = prev;
        else if (data.joueurs.length > 0 && friendId === 0) {
            friendId = Number(data.joueurs[0].id);
            friendSelect.value = String(friendId);
        }
    }

    document.querySelectorAll('.chat-tab').forEach(tab => {
        tab.onclick = () => {
            document.querySelectorAll('.chat-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            mode = tab.dataset.mode;
            lastMsgId = 0;
            friendBar.style.display = mode === 'prive' ? 'block' : 'none';
            if (mode === 'prive') chargerAmis().then(chargerMessages);
            else chargerMessages();
        };
    });

    friendSelect.onchange = () => {
        friendId = Number(friendSelect.value);
        lastMsgId = 0;
        chargerMessages();
    };

    function escapeHtml(str) {
        return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
    }

    async function chargerMessages() {
        if (mode === 'prive' && !friendId) {
            box.innerHTML = '<p style="color:var(--text-muted);font-size:0.84rem;text-align:center;margin-top:20px;">Sélectionne un ami ci-dessus pour discuter en privé.</p>';
            return;
        }
        const url = `api/chat.php?action=lire&mode=${encodeURIComponent(mode)}&salon=${encodeURIComponent(salonCode || '')}&avec=${friendId}`;
        const res = await fetch(url);
        const data = await res.json();
        if (!data.ok) return;

        const msgs = data.messages;
        const newestId = msgs.length ? Number(msgs[msgs.length - 1].id) : 0;

        if (newestId !== lastMsgId || msgs.length === 0) {
            if (lastMsgId !== 0 && newestId > lastMsgId && !isOpen) {
                unread++;
                unreadBadge.textContent = String(unread);
                unreadBadge.style.display = 'inline-block';
            }
            lastMsgId = newestId;

            if (msgs.length === 0) {
                box.innerHTML = '<p style="color:var(--text-muted);font-size:0.84rem;text-align:center;margin-top:20px;">Aucun message ici. Lance la conversation !</p>';
            } else {
                box.innerHTML = msgs.map(m => {
                    const mine = Number(m.id_expediteur) === Number(window.CHAT_USER.id);
                    return `
                        <div class="msg-bubble ${mine ? 'msg-mine' : 'msg-other'}">
                            <div class="msg-meta">
                                <strong>${mine ? 'Moi' : escapeHtml(m.pseudo)}</strong>
                                <span>${escapeHtml(m.heure)}</span>
                            </div>
                            <div>${escapeHtml(m.contenu)}</div>
                        </div>
                    `;
                }).join('');
                box.scrollTop = box.scrollHeight;
            }
        }
    }

    document.getElementById('chatForm').onsubmit = async (e) => {
        e.preventDefault();
        const contenu = input.value.trim();
        if (!contenu) return;
        if (mode === 'prive' && !friendId) return;

        input.value = '';
        await fetch('api/chat.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'envoyer',
                mode,
                salon: salonCode || '',
                avec: friendId,
                contenu
            })
        });
        chargerMessages();
    };

    chargerAmis();
    chargerMessages();
    setInterval(chargerMessages, 1500);
})();