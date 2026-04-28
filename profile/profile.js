let editMode     = false;
let profileData  = { about_me: '', games: '', interests: '' };
let dbColumnsExist = false;

const ICON_SVG     = `<svg viewBox="0 0 24 24" style="width:22px;height:22px;fill:none;stroke:#c084fc;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round"><path d="M6 12h4m-2-2v4"/><circle cx="17" cy="11" r="1"/><circle cx="15" cy="13" r="1"/><path d="M3 8h18l-2 10H5L3 8z"/></svg>`;
const INTEREST_SVG = `<svg viewBox="0 0 24 24" style="width:28px;height:28px;fill:none;stroke:#c084fc;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`;

async function loadProfile() {
    try {
        const meRes  = await fetch('/api/me', { credentials: 'same-origin' });
        const meData = await meRes.json();

        if (!meData.logged_in) {
            document.getElementById('profileName').textContent = 'Not logged in';
            return;
        }

        document.getElementById('profileName').textContent = meData.username;
        document.getElementById('profileAvatar').src =
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(meData.username)}`;

        // Try /api/profile — only works once DB columns exist
        try {
            const profRes  = await fetch('/api/profile', { credentials: 'same-origin' });
            const profData = await profRes.json();
            if (profData.success) {
                dbColumnsExist = true;
                profileData    = profData;
                renderView();
            }
        } catch (_) {
            // DB columns not added yet — show empty state
        }

    } catch (e) {
        document.getElementById('profileName').textContent = 'Could not load profile';
    }
}

function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

function renderView() {
    // About me
    const aboutEl = document.getElementById('aboutView');
    if (profileData.about_me) {
        aboutEl.textContent = profileData.about_me;
        aboutEl.className   = 'about-text';
    } else {
        aboutEl.textContent = 'No description yet';
        aboutEl.className   = 'about-text empty-hint';
    }

    // Games
    const gamesEl = document.getElementById('gamesView');
    const games   = profileData.games
        ? profileData.games.split(',').map(g => g.trim()).filter(Boolean)
        : [];
    if (games.length === 0) {
        gamesEl.innerHTML = '<span class="empty-hint">No games added yet</span>';
    } else {
        gamesEl.innerHTML = games.map((g, i) => `
            <figure ${i > 0 ? 'class="border-left"' : ''}>
                <div class="game-icon">${ICON_SVG}</div>
                <figcaption>${escapeHtml(g)}</figcaption>
            </figure>`).join('');
    }

    // Interests
    const intEl     = document.getElementById('interestsView');
    const interests = profileData.interests
        ? profileData.interests.split(',').map(i => i.trim()).filter(Boolean)
        : [];
    if (interests.length === 0) {
        intEl.innerHTML = '<span class="empty-hint">No interests added yet</span>';
    } else {
        intEl.innerHTML = interests.map((item, i) => `
            <figure ${i > 0 ? 'class="border-left"' : ''}>
                <div class="interest-icon">${INTEREST_SVG}</div>
                <figcaption>${escapeHtml(item)}</figcaption>
            </figure>`).join('');
    }
}

function toggleEdit() {
    editMode = !editMode;

    document.getElementById('aboutView').style.display    = editMode ? 'none' : '';
    document.getElementById('aboutEdit').style.display    = editMode ? 'block' : 'none';
    if (editMode) document.getElementById('aboutEdit').value = profileData.about_me || '';

    document.getElementById('gamesView').style.display    = editMode ? 'none' : '';
    document.getElementById('gamesEdit').style.display    = editMode ? 'block' : 'none';
    if (editMode) document.getElementById('gamesInput').value = profileData.games || '';

    document.getElementById('interestsView').style.display = editMode ? 'none' : '';
    document.getElementById('interestsEdit').style.display  = editMode ? 'block' : 'none';
    if (editMode) document.getElementById('interestsInput').value = profileData.interests || '';

    document.getElementById('saveBtn').style.display = editMode ? 'block' : 'none';
    document.getElementById('editBtn').style.background =
        editMode ? 'rgba(155, 89, 182, 0.3)' : 'rgba(30, 31, 34, 0.6)';
}

async function saveProfile() {
    if (!dbColumnsExist) {
        alert('Profile saving will be available soon!');
        return;
    }
    const payload = {
        about_me:  document.getElementById('aboutEdit').value.trim(),
        games:     document.getElementById('gamesInput').value.trim(),
        interests: document.getElementById('interestsInput').value.trim()
    };
    try {
        const res  = await fetch('/api/profile', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
            profileData.about_me  = payload.about_me;
            profileData.games     = payload.games;
            profileData.interests = payload.interests;
            renderView();
            toggleEdit();
        } else {
            alert('Could not save: ' + (data.error || 'Unknown error'));
        }
    } catch (e) {
        alert('Network error — could not save profile');
    }
}

loadProfile();
