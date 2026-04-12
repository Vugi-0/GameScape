/* ============================================================
   map.js - MapLibre GL with MapTiler Streets Dark
   ============================================================ */

const MAPTILER_KEY = 'qXZMMqoofeJQqdk8nsv1';

// Your exact MapTiler style URL
const MAPTILER_STYLE = `https://api.maptiler.com/maps/019d1f6a-0bb2-7db3-a9c7-670e85ac0f84/style.json?key=${MAPTILER_KEY}`;

/* ============================================================
   PLAYER DATA
   ============================================================ */
const PLAYERS = [
  { id: 1, gamertag: 'NightOwl_SE',   games: ['Valorant', 'CS2'],         rank: 'Diamond',   status: 'active',  lng: 13.002, lat: 55.607, lastActive: 'Just now', age: 24 },
  { id: 2, gamertag: 'ProPlayer_99',  games: ['Minecraft', 'Fortnite'],    rank: 'Gold',      status: 'recent',  lng: 13.018, lat: 55.612, lastActive: '12 min ago', age: 19 },
  { id: 3, gamertag: 'ZeroGrav',      games: ['League of Legends'],        rank: 'Platinum',  status: 'active',  lng: 12.995, lat: 55.598, lastActive: 'Just now', age: 28 },
  { id: 4, gamertag: 'StealthMode_K', games: ['Valorant', 'Apex Legends'], rank: 'Challenger',status: 'active',  lng: 13.010, lat: 55.615, lastActive: 'Just now', age: 22 },
  { id: 5, gamertag: 'CasualGamer88', games: ['Minecraft'],                rank: 'Unranked',  status: 'recent',  lng: 13.025, lat: 55.595, lastActive: '1 hour ago', age: 31 },
  { id: 6, gamertag: 'SniperWolf',    games: ['CS2', 'Valorant'],          rank: 'Master',    status: 'active',  lng: 13.005, lat: 55.600, lastActive: 'Just now', age: 26 },
  { id: 7, gamertag: 'NoobMaster69',  games: ['Fortnite'],                 rank: 'Silver',    status: 'offline', lng: 13.015, lat: 55.620, lastActive: '2 days ago', age: 17 },
];

const MARKER_COLORS = {
  active:  '#39d98a',
  recent:  '#f5a623',
  offline: '#6c6f78',
};

/* ============================================================
   INITIALIZE MAPLIBRE MAP
   ============================================================ */
const map = new maplibregl.Map({
  container: 'map',
  style: MAPTILER_STYLE,
  center: [13.008, 55.605],  // [lng, lat] for Malmö
  zoom: 13,
  pitch: 0,
  bearing: 0,
  antialias: true
});

// Add zoom controls
map.addControl(new maplibregl.NavigationControl({
  showCompass: true,
  showZoom: true,
  visualizePitch: true
}), 'bottom-right');

// Wait for map to load
map.on('load', () => {
  console.log('MapTiler Streets Dark loaded successfully!');
  
  // Add player markers as a GeoJSON source
  map.addSource('players', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: PLAYERS.map(player => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [player.lng, player.lat]
        },
        properties: {
          id: player.id,
          gamertag: player.gamertag,
          games: player.games,
          rank: player.rank,
          status: player.status,
          lastActive: player.lastActive,
          age: player.age
        }
      }))
    }
  });

  // Add circle layer for player markers
  map.addLayer({
    id: 'players-layer',
    type: 'circle',
    source: 'players',
    paint: {
      'circle-radius': [
        'match',
        ['get', 'status'],
        'active', 11,
        'recent', 9,
        'offline', 9,
        9
      ],
      'circle-color': [
        'match',
        ['get', 'status'],
        'active', '#39d98a',
        'recent', '#f5a623',
        'offline', '#6c6f78',
        '#6c6f78'
      ],
      'circle-opacity': [
        'match',
        ['get', 'status'],
        'offline', 0.4,
        0.9
      ],
      'circle-stroke-width': 2,
      'circle-stroke-color': '#1e1f22'
    }
  });

  // Add tooltip on hover
  const popup = new maplibregl.Popup({
    closeButton: false,
    closeOnClick: false,
    offset: [0, -12]
  });

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

  // Click handler for players
  map.on('click', 'players-layer', (e) => {
    const props = e.features[0].properties;
    const player = PLAYERS.find(p => p.id === props.id);
    if (player) openPlayerPanel(player);
  });

  // Update player count
  updatePlayerCount(PLAYERS);
});

// Handle map load errors
map.on('error', (e) => {
  console.error('Map error:', e);
  alert('Map failed to load. Check your MapTiler API key.');
});

/* ============================================================
   HELPER FUNCTIONS
   ============================================================ */
function updatePlayerCount(players) {
  const activeCount = players.filter(p => p.status === 'active').length;
  const countText = document.getElementById('countText');
  if (countText) {
    countText.textContent = `${players.length} players nearby · ${activeCount} active now`;
  }
}

function renderPlayers(playerList) {
  // Update GeoJSON source
  const source = map.getSource('players');
  if (source) {
    source.setData({
      type: 'FeatureCollection',
      features: playerList.map(player => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [player.lng, player.lat]
        },
        properties: {
          id: player.id,
          gamertag: player.gamertag,
          games: player.games,
          rank: player.rank,
          status: player.status,
          lastActive: player.lastActive,
          age: player.age
        }
      }))
    });
  }
  updatePlayerCount(playerList);
}

/* ============================================================
   SIDE PANEL (Player profile)
   ============================================================ */
function openPlayerPanel(player) {
  const sidebarEmpty = document.getElementById('sidebarEmpty');
  const profileCard = document.getElementById('profileCard');
  const chatPanel = document.getElementById('chatPanel');

  if (sidebarEmpty) sidebarEmpty.style.display = 'none';
  if (profileCard) profileCard.style.display = 'block';
  if (chatPanel) chatPanel.style.display = 'none';

  const statusText = {
    active: 'Active now',
    recent: `Active ${player.lastActive}`,
    offline: 'Offline',
  }[player.status];

  const gameTags = player.games
    .map(game => `<span class="game-tag">${game}</span>`)
    .join('');

  if (profileCard) {
    profileCard.innerHTML = `
      <div style="padding: 20px; border-bottom: 1px solid #1e1f22;">
        <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 16px;">
          <div style="
            width: 52px; height: 52px; border-radius: 50%;
            background: rgba(155, 89, 182, 0.15); border: 2px solid #9b59b6;
            display: flex; align-items: center; justify-content: center;
            font-size: 16px; font-weight: 700; color: #bb8fce;">
            ${player.gamertag.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div style="font-size: 16px; font-weight: 700;">${player.gamertag}</div>
            <div style="font-size: 11px; color: ${MARKER_COLORS[player.status]}; margin-top: 3px;">
              ● ${statusText}
            </div>
          </div>
        </div>

        <div style="margin-bottom: 12px;">
          <div style="font-size: 10px; font-weight: 600; color: #949ba4; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 6px;">Games</div>
          <div style="display: flex; flex-wrap: wrap; gap: 5px;">${gameTags}</div>
        </div>

        <div style="margin-bottom: 16px;">
          <div style="font-size: 10px; font-weight: 600; color: #949ba4; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px;">Rank</div>
          <div style="font-size: 14px; font-weight: 600;">${player.rank}</div>
        </div>

        <div style="margin-bottom: 16px;">
          <div style="font-size: 10px; font-weight: 600; color: #949ba4; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px;">Age</div>
          <div style="font-size: 14px;">${player.age}</div>
        </div>

        <button class="chat-btn" onclick="openChat(${player.id})">
          💬 Start Chat
        </button>
      </div>

      <div id="chatArea" style="flex: 1; display: flex; align-items: center; justify-content: center; color: #949ba4; font-size: 13px; padding: 20px; text-align: center;">
        Click "Start Chat" to message ${player.gamertag}
      </div>
    `;
  }

  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.classList.add('open');
}

function closePanel() {
  const sidebar = document.getElementById('sidebar');
  const sidebarEmpty = document.getElementById('sidebarEmpty');
  const profileCard = document.getElementById('profileCard');
  const chatPanel = document.getElementById('chatPanel');

  if (sidebar) sidebar.classList.remove('open');
  if (sidebarEmpty) sidebarEmpty.style.display = 'flex';
  if (profileCard) profileCard.style.display = 'none';
  if (chatPanel) chatPanel.style.display = 'none';
}

function openChat(playerId) {
  console.log('Opening chat with player ID:', playerId);
  alert('Chat feature coming soon! (Zakaria will implement this)');
}

/* ============================================================
   HAMBURGER MENU
   ============================================================ */
let isLoggedIn = false;

function toggleMenu() {
  const menu = document.getElementById('sideMenu');
  const overlay = document.getElementById('menuOverlay');
  if (menu) menu.classList.toggle('open');
  if (overlay) overlay.classList.toggle('show');
}

function closeMenu() {
  const menu = document.getElementById('sideMenu');
  const overlay = document.getElementById('menuOverlay');
  if (menu) menu.classList.remove('open');
  if (overlay) overlay.classList.remove('show');
}

function updateLoginLogoutButton() {
  const textSpan = document.getElementById('loginLogoutText');
  if (textSpan) {
    textSpan.textContent = isLoggedIn ? 'Logout' : 'Login';
  }
}

function handleMenuClick(page) {
  closeMenu();
  switch(page) {
    case 'home':
      // Already on map
      break;
    case 'chat':
      alert('Chat page - Coming soon! (Zakaria will implement)');
      break;
    case 'notifications':
      alert('Notifications - Placeholder for now');
      break;
    case 'settings':
      alert('Settings - Coming soon!');
      break;
    case 'login':
      if (isLoggedIn) {
        isLoggedIn = false;
        updateLoginLogoutButton();
        alert('Logged out successfully');
      } else {
        if (confirm('Demo login? (Full auth coming soon)')) {
          isLoggedIn = true;
          updateLoginLogoutButton();
          alert('Logged in as DemoUser');
        }
      }
      break;
  }
}

/* ============================================================
   FILTER FUNCTIONALITY
   ============================================================ */
function toggleFilterDropdown() {
  const dropdown = document.getElementById('filterDropdown');
  if (dropdown) dropdown.classList.toggle('show');
}

function closeFilterDropdown() {
  const dropdown = document.getElementById('filterDropdown');
  if (dropdown) dropdown.classList.remove('show');
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
  
  if (ageFilter !== 'all') {
    if (ageFilter === '18-25') {
      filteredPlayers = filteredPlayers.filter(p => p.age >= 18 && p.age <= 25);
    } else if (ageFilter === '26-35') {
      filteredPlayers = filteredPlayers.filter(p => p.age >= 26 && p.age <= 35);
    } else if (ageFilter === '35+') {
      filteredPlayers = filteredPlayers.filter(p => p.age >= 35);
    }
  }
  
  renderPlayers(filteredPlayers);
  closeFilterDropdown();
}

/* ============================================================
   EVENT LISTENERS
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  // Hamburger menu
  document.getElementById('hamburgerBtn')?.addEventListener('click', toggleMenu);
  document.getElementById('menuCloseBtn')?.addEventListener('click', closeMenu);
  document.getElementById('menuOverlay')?.addEventListener('click', closeMenu);
  
  // Menu items
  document.querySelectorAll('.menu-items li').forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const page = item.getAttribute('data-page');
      if (page) handleMenuClick(page);
    });
  });
  
  // Filters
  document.getElementById('filterToggleBtn')?.addEventListener('click', toggleFilterDropdown);
  document.getElementById('applyFilters')?.addEventListener('click', applyFilters);
  
  document.addEventListener('click', (e) => {
    const filterSection = document.querySelector('.filter-section');
    const dropdown = document.getElementById('filterDropdown');
    if (filterSection && dropdown && !filterSection.contains(e.target) && dropdown.classList.contains('show')) {
      closeFilterDropdown();
    }
  });
  
  updateLoginLogoutButton();
});

// Add styles
const style = document.createElement('style');
style.textContent = `
  .game-tag {
    font-size: 11px;
    background: #1e1f22;
    border: 1px solid #3b3f45;
    color: #949ba4;
    padding: 3px 9px;
    border-radius: 8px;
  }
  
  .chat-btn {
    background: linear-gradient(135deg, #9b59b6, #8e44ad);
    border: none;
    color: white;
    padding: 10px 16px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    width: 100%;
    transition: opacity 0.2s;
    font-family: inherit;
  }
  
  .chat-btn:hover {
    opacity: 0.9;
  }
`;
document.head.appendChild(style);