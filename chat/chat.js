// chat.js

let chatSocket = null;
let currentUsername = null;
let currentChatPartner = null;
let onlineUsers = new Set();
let messagesHistory = {};
let dbContacts = [];       // contacts loaded from DB
let isLoggedIn = false;

// DOM elements
const connectionStatusSpan = document.getElementById('connectionStatus');
const usernameInput         = document.getElementById('usernameInput');
const connectBtn            = document.getElementById('connectBtn');
const contactsListDiv       = document.getElementById('contactsList');
const messagesContainer     = document.getElementById('messagesContainer');
const messageInput          = document.getElementById('messageInput');
const sendBtn               = document.getElementById('sendBtn');
const currentChatNameSpan   = document.getElementById('currentChatName');

function getTime() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Check Flask session on page load
async function checkLoginState() {
    try {
        const res = await fetch('/api/me', { credentials: 'same-origin' });
        const data = await res.json();
        if (data.logged_in) {
            isLoggedIn = true;
            currentUsername = data.username;

            // Auto-fill the username input and mark it read-only
            usernameInput.value = data.username;
            usernameInput.readOnly = true;
            usernameInput.style.opacity = '0.6';
            usernameInput.style.cursor = 'not-allowed';

            connectionStatusSpan.textContent = `Logged in as ${data.username}`;
            connectionStatusSpan.className = 'status-online';

            // Load previous chats from DB
            await loadContactsFromDB();
        }
    } catch (e) {
        console.warn('Session check failed:', e);
    }
}

// Load contacts (people with chat history) from DB
async function loadContactsFromDB() {
    try {
        const res = await fetch('/api/chat/contacts', { credentials: 'same-origin' });
        const data = await res.json();
        if (data.success) {
            dbContacts = data.contacts;
            renderContacts();
        }
    } catch (e) {
        console.warn('Failed to load contacts:', e);
    }
}

// Load full message history with a specific user from DB
async function loadChatHistory(partnerUsername) {
    try {
        const res = await fetch(`/api/chat/history/${encodeURIComponent(partnerUsername)}`, {
            credentials: 'same-origin'
        });
        const data = await res.json();
        if (data.success) {
            // Replace in-memory history with DB history
            messagesHistory[partnerUsername] = data.messages.map(m => ({
                from: m.from,
                to:   m.from === currentUsername ? partnerUsername : currentUsername,
                text: m.text,
                time: m.time
            }));
        }
    } catch (e) {
        console.warn('Failed to load chat history:', e);
    }
}

// Save a sent message to DB
async function saveMessageToDB(toUsername, text) {
    try {
        await fetch('/api/chat/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ to: toUsername, message: text })
        });
    } catch (e) {
        console.warn('Failed to save message to DB:', e);
    }
}

function renderMessages(partner) {
    messagesContainer.innerHTML = '';
    const history = messagesHistory[partner] || [];
    if (history.length === 0) {
        messagesContainer.innerHTML = '<div class="placeholder-message">No messages yet — say hi!</div>';
        return;
    }
    history.forEach(msg => {
        const isSelf = msg.from === currentUsername || msg.from === 'You';
        const sender = isSelf ? 'You' : msg.from;
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isSelf ? 'self' : ''}`;
        messageDiv.innerHTML = `
            <div class="sender">${escapeHtml(sender)}</div>
            <div class="text">${escapeHtml(msg.text)}</div>
            <div class="time">${msg.time}</div>
        `;
        messagesContainer.appendChild(messageDiv);
    });
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function addMessageLocally(from, to, text) {
    const partner = from === currentUsername ? to : from;
    if (!messagesHistory[partner]) messagesHistory[partner] = [];
    messagesHistory[partner].push({ from, to, text, time: getTime() });
    if (currentChatPartner === partner) {
        renderMessages(partner);
    }
}

function renderContacts() {
    contactsListDiv.innerHTML = '';

    // Merge DB contacts + online WS users, deduplicated
    const allUsernames = new Set();
    const contactMap = {};  // username -> { lastMessage, lastTime, isOnline }

    // DB contacts first
    dbContacts.forEach(c => {
        allUsernames.add(c.username);
        contactMap[c.username] = {
            lastMessage: c.last_message,
            lastTime: c.last_time,
            isOnline: false
        };
    });

    // Online WS users
    onlineUsers.forEach(u => {
        if (u === currentUsername) return;
        allUsernames.add(u);
        if (contactMap[u]) {
            contactMap[u].isOnline = true;
        } else {
            contactMap[u] = { lastMessage: '', lastTime: '', isOnline: true };
        }
    });

    // If not connected and not logged in, show DemoGamer
    const wsConnected = chatSocket && chatSocket.readyState === WebSocket.OPEN;
    if (!wsConnected && !isLoggedIn) {
        allUsernames.add('DemoGamer');
        if (!contactMap['DemoGamer']) {
            contactMap['DemoGamer'] = { lastMessage: 'Hey! Want to play?', lastTime: '', isOnline: false };
        }
    }

    if (allUsernames.size === 0) {
        contactsListDiv.innerHTML = '<div class="contact-placeholder">No chats yet</div>';
        return;
    }

    [...allUsernames].forEach(username => {
        const info = contactMap[username] || {};
        const isDemo = username === 'DemoGamer';
        const isActive = currentChatPartner === username;

        let statusLabel;
        if (isDemo)          statusLabel = '● Demo mode';
        else if (info.isOnline) statusLabel = '● Online';
        else if (info.lastTime) statusLabel = `Last message ${info.lastTime}`;
        else                    statusLabel = '● Offline';

        const contactDiv = document.createElement('div');
        contactDiv.className = `contact-item ${isActive ? 'active' : ''}`;
        contactDiv.innerHTML = `
            <div class="contact-avatar">${username.charAt(0).toUpperCase()}</div>
            <div class="contact-info">
                <div class="contact-name">${escapeHtml(username)}</div>
                <div class="contact-status">${statusLabel}</div>
            </div>
        `;
        contactDiv.addEventListener('click', () => {
            document.querySelectorAll('.contact-item').forEach(el => el.classList.remove('active'));
            contactDiv.classList.add('active');

            if (isDemo) {
                loadDemoChat();
            } else {
                openChatWith(username);
            }
        });
        contactsListDiv.appendChild(contactDiv);
    });
}

// Open a chat — load DB history first, then allow typing
async function openChatWith(username) {
    currentChatPartner = username;
    currentChatNameSpan.textContent = username;
    messagesContainer.innerHTML = '<div class="placeholder-message">Loading messages...</div>';

    await loadChatHistory(username);
    renderMessages(username);

    messageInput.disabled = false;
    sendBtn.disabled = false;
}

function loadDemoChat() {
    const demoContact = 'DemoGamer';
    if (!messagesHistory[demoContact]) {
        messagesHistory[demoContact] = [
            { from: demoContact, to: 'You', text: 'Hey! Want to play some Valorant?', time: '14:32' },
            { from: 'You', to: demoContact, text: 'Sure! What rank are you?', time: '14:33' },
            { from: demoContact, to: 'You', text: "Platinum 2, let's queue up!", time: '14:34' }
        ];
    }
    currentChatPartner = demoContact;
    currentChatNameSpan.textContent = demoContact;
    renderMessages(demoContact);
    messageInput.disabled = false;
    sendBtn.disabled = false;
}

function connectWebSocket(username) {
    if (chatSocket && chatSocket.readyState === WebSocket.OPEN) {
        chatSocket.close();
    }
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    chatSocket = new WebSocket(`${protocol}//${window.location.host}/ws/${username}`);

    chatSocket.onopen = () => {
        currentUsername = username;
        connectionStatusSpan.textContent = `Connected as ${username}`;
        connectionStatusSpan.className = 'status-online';
        connectBtn.textContent = 'Disconnect';
        onlineUsers.clear();
        renderContacts();
        messagesContainer.innerHTML = '<div class="placeholder-message">Click on a friend to start chatting</div>';
    };

    chatSocket.onmessage = (e) => {
        const data = JSON.parse(e.data);
        if (data.system) {
            if (data.system.includes('is not online')) {
                onlineUsers.delete(data.system.split(' ')[0]);
                renderContacts();
            }
            return;
        }
        // Incoming real-time message (already saved by sender to DB)
        addMessageLocally(data.from, currentUsername, data.message);
        if (!onlineUsers.has(data.from)) {
            onlineUsers.add(data.from);
            renderContacts();
        }
    };

    chatSocket.onclose = () => {
        connectionStatusSpan.textContent = isLoggedIn ? `Logged in as ${currentUsername}` : 'Disconnected';
        connectionStatusSpan.className = isLoggedIn ? 'status-online' : 'status-offline';
        connectBtn.textContent = 'Connect';
        onlineUsers.clear();
        renderContacts();
    };

    chatSocket.onerror = (err) => {
        console.error('WebSocket error', err);
        connectionStatusSpan.textContent = 'Connection error';
    };
}

async function sendMessage() {
    // Demo mode
    if (currentChatPartner === 'DemoGamer') {
        const text = messageInput.value.trim();
        if (!text) return;
        addMessageLocally(currentUsername || 'You', 'DemoGamer', text);
        messageInput.value = '';
        setTimeout(() => {
            addMessageLocally('DemoGamer', currentUsername || 'You', 'Thanks for the demo! 😊');
        }, 1000);
        return;
    }

    // Need to be logged in or WS connected to send
    if (!currentUsername) {
        alert('Please log in or connect first');
        return;
    }
    if (!currentChatPartner) {
        alert('Select a friend first');
        return;
    }

    const text = messageInput.value.trim();
    if (!text) return;

    messageInput.value = '';

    // Save to DB (works whether WS is connected or not)
    await saveMessageToDB(currentChatPartner, text);

    // Show locally immediately
    addMessageLocally(currentUsername, currentChatPartner, text);

    // Also send via WebSocket for real-time delivery if connected
    if (chatSocket && chatSocket.readyState === WebSocket.OPEN) {
        chatSocket.send(JSON.stringify({ to: currentChatPartner, message: text }));
    }
}

// EVENT LISTENERS
connectBtn.addEventListener('click', () => {
    if (chatSocket && chatSocket.readyState === WebSocket.OPEN) {
        chatSocket.close();
    } else {
        const username = usernameInput.value.trim();
        if (!username) {
            alert('Enter a username');
            return;
        }
        connectWebSocket(username);
    }
});

sendBtn.addEventListener('click', sendMessage);

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !messageInput.disabled) {
        sendMessage();
    }
});

document.getElementById('searchInput').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    document.querySelectorAll('.contact-item').forEach(item => {
        const name = item.querySelector('.contact-name').textContent.toLowerCase();
        item.style.display = name.includes(term) ? 'flex' : 'none';
    });
});

document.addEventListener('DOMContentLoaded', async () => {
    await checkLoginState();   // check session → auto-fill username + load DB contacts
    renderContacts();          // show DemoGamer if not logged in
});