const MAPTILER_KEY = 'qXZMMqoofeJQqdk8nsv1';
const MAPTILER_STYLE = `https://api.maptiler.com/maps/019d1f6a-0bb2-7db3-a9c7-670e85ac0f84/style.json?key=${MAPTILER_KEY}`;

/* PLAYER DATA - fallback used until DB loads */
const PLAYERS = [
    { id: 1, gamertag: 'NightOwl_SE',   games: ['Valorant', 'CS2'], rank: 'Diamond', status: 'active', lng: 13.002, lat: 55.607, lastActive: 'Just now', age: 24 },
    { id: 2, gamertag: 'ProPlayer_99',  games: ['Minecraft', 'Fortnite'], rank: 'Gold', status: 'recent', lng: 13.018, lat: 55.612, lastActive: '12 min ago', age: 19 },
    { id: 3, gamertag: 'ZeroGrav',      games: ['League of Legends'], rank: 'Platinum', status: 'active', lng: 12.995, lat: 55.598, lastActive: 'Just now', age: 28 },
    { id: 4, gamertag: 'StealthMode_K', games: ['Valorant', 'Apex Legends'], rank: 'Challenger', status: 'active', lng: 13.010, lat: 55.615, lastActive: 'Just now', age: 22 },
    { id: 5, gamertag: 'CasualGamer88', games: ['Minecraft'], rank: 'Unranked', status: 'recent', lng: 13.025, lat: 55.595, lastActive: '1 hour ago', age: 31 },
    { id: 6, gamertag: 'SniperWolf',    games: ['CS2', 'Valorant'], rank: 'Master', status: 'active', lng: 13.005, lat: 55.600, lastActive: 'Just now', age: 26 },
    { id: 7, gamertag: 'NoobMaster69',  games: ['Fortnite'], rank: 'Silver', status: 'offline', lng: 13.015, lat: 55.620, lastActive: '2 days ago', age: 17 },
];

const MARKER_COLORS = {
    active: '#39d98a',
    recent: '#f5a623',
    offline: '#6c6f78',
};

/* MAP INIT */
const map = new maplibregl.Map({
    container: 'map',
    style: MAPTILER_STYLE,
    center: [13.008, 55.605],
    zoom: 13,
    pitch: 0,
    bearing: 0,
    antialias: true
});

map.addControl(new maplibregl.NavigationControl({
    showCompass: true,
    showZoom: true,
    visualizePitch: true
}), 'bottom-right');

/* GLOBAL STATE */
let isLoggedIn = false;
let currentUsername = null;

function setLoggedIn(status, username) {
    isLoggedIn = status;
    currentUsername = username || null;
    updateLoginLogoutButton();

    const avatarImg = document.querySelector('.avatar-img');
    if (avatarImg && username) {
        avatarImg.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username)}`;
        avatarImg.alt = username;
    }
}

/* Check if already logged in (e.g. after page refresh) */
async function checkSession() {
    try {
        const res = await fetch('/api/me', { credentials: 'same-origin' });
        const data = await res.json();
        if (data.logged_in) {
            setLoggedIn(true, data.username);
        }
    } catch (e) {
        console.warn('Session check failed:', e);
    }
}

/* MODAL NAVIGATION */
function openModalPage(page) {
    let overlay = document.getElementById('modalOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'modalOverlay';
        overlay.className = 'modal-overlay';
        document.body.appendChild(overlay);
        overlay.addEventListener('click', closeModalPage);
    }
    
    let modalFrame = document.getElementById('modalFrame');
    if (!modalFrame) {
        modalFrame = document.createElement('iframe');
        modalFrame.id = 'modalFrame';
        modalFrame.className = 'modal-frame';
        document.body.appendChild(modalFrame);
    }
    
    modalFrame.src = page;
    overlay.classList.add('show');
    modalFrame.classList.add('show');
    
    function handleEscape(e) {
        if (e.key === 'Escape') {
            closeModalPage();
            document.removeEventListener('keydown', handleEscape);
        }
    }
    document.addEventListener('keydown', handleEscape);
}

function closeModalPage() {
    const overlay = document.getElementById('modalOverlay');
    const modalFrame = document.getElementById('modalFrame');
    
    if (overlay) overlay.classList.remove('show');
    if (modalFrame) {
        modalFrame.classList.remove('show');
        setTimeout(() => {
            if (modalFrame) modalFrame.src = 'about:blank';
        }, 300);
    }
}

/* PLAYER MARKERS */
map.on('load', () => {
    console.log('Map loaded');
    
    map.addSource('players', {
        type: 'geojson',
        data: {
            type: 'FeatureCollection',
            features: PLAYERS.map(player => ({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [player.lng, player.lat] },
                properties: { ...player }
            }))
        }
    });
    
    map.addLayer({
        id: 'players-layer',
        type: 'circle',
        source: 'players',
        paint: {
            'circle-radius': ['match', ['get', 'status'], 'active', 11, 'recent', 9, 'offline', 9, 9],
            'circle-color': ['match', ['get', 'status'], 'active', '#39d98a', 'recent', '#f5a623', 'offline', '#6c6f78', '#6c6f78'],
            'circle-opacity': ['match', ['get', 'status'], 'offline', 0.4, 0.9],
            'circle-stroke-width': 2,
            'circle-stroke-color': '#1e1f22'
        }
    });
    
    const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: [0, -12] });
    
    map.on('mouseenter', 'players-layer', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        const props = e.features[0].properties;
        popup.setLngLat(e.features[0].geometry.coordinates)
            .setHTML(`<strong>${props.gamertag}</strong><br>${props.status === 'active' ? '🟢 Active' : props.status === 'recent' ? '🟡 Recently active' : '⚫ Offline'}`)
            .addTo(map);
    });
    
    map.on('mouseleave', 'players-layer', () => {
        map.getCanvas().style.cursor = '';
        popup.remove();
    });
    
    map.on('click', 'players-layer', (e) => {
        const props = e.features[0].properties;
        const player = PLAYERS.find(p => p.id === props.id);
        if (player) openPlayerModal(player);
    });
    
    updatePlayerCount(PLAYERS);
});

map.on('error', (e) => {
    console.error('Map error:', e);
    alert('Map failed to load. Check your MapTiler API key.');
});

/* HELPER FUNCTIONS */
function updatePlayerCount(players) {
    const activeCount = players.filter(p => p.status === 'active').length;
    const countText = document.getElementById('countText');
    if (countText) {
        countText.textContent = `${players.length} players nearby · ${activeCount} active now`;
    }
}

function renderPlayers(playerList) {
    const source = map.getSource('players');
    if (source) {
        source.setData({
            type: 'FeatureCollection',
            features: playerList.map(player => ({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [player.lng, player.lat] },
                properties: { ...player }
            }))
        });
    }
    updatePlayerCount(playerList);
}

function openPlayerModal(player) {
    let overlay = document.getElementById('modalOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'modalOverlay';
        overlay.className = 'modal-overlay';
        document.body.appendChild(overlay);
        overlay.addEventListener('click', closePlayerModal);
    }
    
    let modalContainer = document.getElementById('dynamicModalContainer');
    if (!modalContainer) {
        modalContainer = document.createElement('div');
        modalContainer.id = 'dynamicModalContainer';
        modalContainer.className = 'modal-frame';
        document.body.appendChild(modalContainer);
    }
    
    const statusText = { active: 'Active now', recent: `Active ${player.lastActive}`, offline: 'Offline' }[player.status];
    const statusColor = { active: '#39d98a', recent: '#f5a623', offline: '#6c6f78' }[player.status];
    const gameTags = player.games.map(game => `<span class="modal-game-tag">${game}</span>`).join('');
    
    modalContainer.innerHTML = `
        <div class="player-modal">
            <button class="close-btn-modal" onclick="window.closePlayerModal()">✕</button>
            <div class="player-modal-header">
                <div class="player-avatar">${player.gamertag.slice(0, 2).toUpperCase()}</div>
                <div class="player-info">
                    <div class="player-name">${player.gamertag}</div>
                    <div class="player-status" style="color: ${statusColor};">● ${statusText}</div>
                </div>
            </div>
            <div class="player-section">
                <div class="section-label">Games</div>
                <div class="player-games">${gameTags}</div>
            </div>
            <div class="player-section">
                <div class="section-label">Rank</div>
                <div class="player-rank">${player.rank}</div>
            </div>
            <div class="player-section">
                <div class="section-label">Age</div>
                <div class="player-age">${player.age}</div>
            </div>
            <button class="modal-chat-btn" onclick="alert('Chat with ${player.gamertag} coming soon')">💬 Start Chat</button>
        </div>
    `;
    
    if (!document.getElementById('player-modal-styles')) {
        const style = document.createElement('style');
        style.id = 'player-modal-styles';
        style.textContent = `
            .player-modal {
                width: 100%;
                height: 100%;
                background: rgba(14, 15, 18, 0.95);
                backdrop-filter: blur(32px);
                border-radius: 28px;
                padding: 30px 25px 35px 25px;
                color: #dbdee1;
                position: relative;
                box-sizing: border-box;
                border: 1px solid rgba(155, 89, 182, 0.3);
            }
            .player-modal::before {
                content: '';
                position: absolute;
                top: -2px;
                left: -2px;
                right: -2px;
                bottom: -2px;
                background: linear-gradient(90deg, 
                    transparent, 
                    #9b59b6, 
                    #c084fc, 
                    #e9d5ff, 
                    #c084fc, 
                    #9b59b6, 
                    transparent);
                border-radius: 30px;
                z-index: -2;
                animation: neon-sweep 3s linear infinite;
                background-size: 200% 100%;
                pointer-events: none;
            }
            .player-modal::after {
                content: '';
                position: absolute;
                top: 2px;
                left: 2px;
                right: 2px;
                bottom: 2px;
                background: rgba(14, 15, 18, 0.95);
                backdrop-filter: blur(32px);
                border-radius: 26px;
                z-index: -1;
                pointer-events: none;
            }
            @keyframes neon-sweep {
                0% { background-position: 100% 0; }
                100% { background-position: -100% 0; }
            }
            .close-btn-modal {
                position: absolute;
                top: 15px;
                right: 15px;
                background: rgba(30, 31, 34, 0.6);
                border: 1px solid rgba(155, 89, 182, 0.4);
                color: #c084fc;
                font-size: 16px;
                cursor: pointer;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
                z-index: 10;
            }
            .close-btn-modal:hover {
                background: rgba(155, 89, 182, 0.2);
                border-color: rgba(155, 89, 182, 0.8);
            }
            .player-modal-header {
                display: flex;
                align-items: center;
                gap: 15px;
                margin-bottom: 25px;
            }
            .player-avatar {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: rgba(155, 89, 182, 0.2);
                border: 2px solid #9b59b6;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                font-weight: bold;
                color: #c084fc;
            }
            .player-name {
                font-size: 20px;
                font-weight: 700;
            }
            .player-status {
                font-size: 12px;
                margin-top: 5px;
            }
            .player-section {
                margin-bottom: 18px;
            }
            .section-label {
                font-size: 11px;
                font-weight: 600;
                color: #c084fc;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 6px;
            }
            .player-games {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
            }
            .modal-game-tag {
                background: rgba(30, 31, 34, 0.7);
                border: 1px solid rgba(155, 89, 182, 0.3);
                padding: 4px 10px;
                border-radius: 20px;
                font-size: 12px;
            }
            .player-rank, .player-age {
                font-size: 15px;
                font-weight: 500;
            }
            .modal-chat-btn {
                width: 100%;
                background: linear-gradient(135deg, #9b59b6, #7c3aed);
                border: none;
                color: white;
                padding: 12px;
                border-radius: 40px;
                font-size: 14px;
                font-weight: bold;
                cursor: pointer;
                margin-top: 15px;
                transition: all 0.2s;
            }
            .modal-chat-btn:hover {
                opacity: 0.9;
                transform: translateY(-1px);
            }
        `;
        document.head.appendChild(style);
    }
    
    overlay.classList.add('show');
    modalContainer.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    window.closePlayerModal = function() {
        overlay.classList.remove('show');
        modalContainer.classList.remove('show');
        document.body.style.overflow = '';
        setTimeout(() => {
            if (modalContainer) modalContainer.innerHTML = '';
        }, 300);
    };
    
    function handleEscape(e) {
        if (e.key === 'Escape') {
            window.closePlayerModal();
            document.removeEventListener('keydown', handleEscape);
        }
    }
    document.addEventListener('keydown', handleEscape);
}

function closePanel() {
    const sidebar = document.getElementById('sidebar');
    const sidebarEmpty = document.getElementById('sidebarEmpty');
    const profileCard = document.getElementById('profileCard');
    
    if (sidebar) sidebar.classList.remove('open');
    if (sidebarEmpty) sidebarEmpty.style.display = 'flex';
    if (profileCard) profileCard.style.display = 'none';
}

function openChat(playerId) {
    console.log('Opening chat with player ID:', playerId);
    alert('Chat feature coming soon! (Zakaria will implement this)');
}

map.on('click', () => closePanel());

/* HAMBURGER MENU */
function toggleMenu() {
    document.getElementById('sideMenu')?.classList.toggle('open');
    document.getElementById('menuOverlay')?.classList.toggle('show');
}

function closeMenu() {
    document.getElementById('sideMenu')?.classList.remove('open');
    document.getElementById('menuOverlay')?.classList.remove('show');
}

function updateLoginLogoutButton() {
    const textSpan = document.getElementById('loginLogoutText');
    if (textSpan) textSpan.textContent = isLoggedIn ? 'Logout' : 'Login';
}

async function handleLogout() {
    try {
        await fetch('/api/logout', { method: 'POST', credentials: 'same-origin' });
    } catch (e) {
        console.warn('Logout request failed:', e);
    }
    setLoggedIn(false, null);
    alert('Logged out successfully');
}

function handleMenuClick(page) {
    closeMenu();
    switch(page) {
        case 'home':
            map.invalidateSize();
            break;
        case 'chat':
            window.location.href = 'chat/chat.html';
            break;
        case 'notifications':
            alert('Notifications - Placeholder for now');
            break;
        case 'settings':
            alert('Settings - Coming soon!');
            break;
        case 'login':
            if (isLoggedIn) {
                handleLogout();
            } else {
                openModalPage('login/login.html');
            }
            break;
    }
}

/* FILTER FUNCTIONALITY */
function toggleFilterDropdown() {
    document.getElementById('filterDropdown')?.classList.toggle('show');
}

function closeFilterDropdown() {
    document.getElementById('filterDropdown')?.classList.remove('show');
}

function applyFilters() {
    const ageFilter = document.getElementById('filterAge')?.value || 'all';
    const gameFilter = document.getElementById('filterGames')?.value || 'all';
    
    let filteredPlayers = [...PLAYERS];
    
    if (gameFilter !== 'all') {
        filteredPlayers = filteredPlayers.filter(player =>
            player.games.some(game => game.toLowerCase() === gameFilter.toLowerCase())
        );
    }
    
    if (ageFilter === '18-25') {
        filteredPlayers = filteredPlayers.filter(p => p.age >= 18 && p.age <= 25);
    } else if (ageFilter === '26-35') {
        filteredPlayers = filteredPlayers.filter(p => p.age >= 26 && p.age <= 35);
    } else if (ageFilter === '35+') {
        filteredPlayers = filteredPlayers.filter(p => p.age >= 35);
    }
    
    renderPlayers(filteredPlayers);
    closeFilterDropdown();
}

/* EVENT LISTENERS */
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('hamburgerBtn')?.addEventListener('click', toggleMenu);
    document.getElementById('menuCloseBtn')?.addEventListener('click', closeMenu);
    document.getElementById('menuOverlay')?.addEventListener('click', closeMenu);
    
    document.querySelectorAll('.menu-items li').forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            const page = item.getAttribute('data-page');
            if (page) handleMenuClick(page);
        });
    });
    
    document.getElementById('filterToggleBtn')?.addEventListener('click', toggleFilterDropdown);
    document.getElementById('applyFilters')?.addEventListener('click', applyFilters);
    
    document.addEventListener('click', (e) => {
        const filterSection = document.querySelector('.filter-section');
        const dropdown = document.getElementById('filterDropdown');
        if (filterSection && dropdown && !filterSection.contains(e.target) && dropdown.classList.contains('show')) {
            closeFilterDropdown();
        }
    });
    
    const profilePic = document.getElementById('profilePic');
    if (profilePic) {
        profilePic.addEventListener('click', () => {
            if (isLoggedIn) {
                openModalPage('profile/profile.html');
            } else {
                alert('Please login first to view your profile');
                openModalPage('login/login.html');
            }
        });
    }
    
    updateLoginLogoutButton();
    checkSession();
});

