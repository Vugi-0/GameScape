let chatSocket    = null
let currentTarget = null
let openTabs      = []    // usernames of open chat tabs, in order
let localHistory  = {}    // { username: [{ from, message }, ...] }


// ── startup ──────────────────────────────────────────────────────────────────

// fetch who's online right now, before the user even connects
function loadOnlineUsers() {
    fetch("/users")
        .then(function(r) { return r.json() })
        .then(function(users) { renderUserList(users) })
}


// ── connection ────────────────────────────────────────────────────────────────

function connectChat() {
    let username = document.getElementById("username").value.trim()
    if (!username) return

    chatSocket = new WebSocket("ws://localhost:8000/ws/" + username)

    chatSocket.onopen = function() {
        document.getElementById("status").innerText = "online as " + username
        document.getElementById("status").className = "connected"
    }

    chatSocket.onmessage = function(e) {
        let data = JSON.parse(e.data)

        // history replay on connect
        if (data.history) {
            localHistory[data["with"]] = data.history
            if (currentTarget === data["with"]) renderConversation(currentTarget)
            return
        }

        // user list update
        if (data.users) {
            renderUserList(data.users)
            return
        }

        // system notice e.g. "X is not online"
        if (data.system) {
            addSystemMessage(data.system)
            return
        }

        // regular incoming message
        let sender = data.from
        if (!localHistory[sender]) localHistory[sender] = []
        localHistory[sender].push({ from: sender, message: data.message })

        if (!openTabs.includes(sender)) {
            openTabs.push(sender)
            renderTabs()
        }

        if (currentTarget === sender) {
            appendMessage(sender, data.message)
        } else {
            // mark their tab as unread
            let tab = document.querySelector(".tab[data-user='" + sender + "']")
            if (tab) tab.classList.add("unread")
        }
    }

    chatSocket.onclose = function() {
        document.getElementById("status").innerText = "disconnected"
        document.getElementById("status").className = ""
    }
}


// ── tabs ──────────────────────────────────────────────────────────────────────

function openConversation(username) {
    if (!openTabs.includes(username)) {
        openTabs.push(username)
        renderTabs()
    }
    switchTab(username)
}

function switchTab(username) {
    currentTarget = username
    renderTabs()

    // clear unread marker on sidebar item
    let sideItem = document.querySelector(".user-item[data-user='" + username + "']")
    if (sideItem) sideItem.classList.remove("unread")

    renderConversation(username)
    document.getElementById("input").focus()
}

function closeTab(username, e) {
    e.stopPropagation()
    openTabs = openTabs.filter(function(u) { return u !== username })

    // switch to the next available tab, or clear the chat
    if (currentTarget === username) {
        currentTarget = openTabs.length > 0 ? openTabs[openTabs.length - 1] : null
    }

    renderTabs()

    if (currentTarget) {
        renderConversation(currentTarget)
    } else {
        document.getElementById("chat").innerHTML = ""
        showEmptyState()
    }
}

function renderTabs() {
    let tabsEl = document.getElementById("tabs")
    tabsEl.innerHTML = ""

    for (let user of openTabs) {
        let tab      = document.createElement("div")
        tab.className    = "tab"
        tab.dataset.user = user
        if (user === currentTarget) tab.classList.add("active")

        let label     = document.createElement("span")
        label.innerText = user
        label.onclick   = function() { switchTab(user) }

        let closeBtn     = document.createElement("span")
        closeBtn.className = "tab-close"
        closeBtn.innerText = "×"
        closeBtn.onclick   = function(e) { closeTab(user, e) }

        tab.appendChild(label)
        tab.appendChild(closeBtn)
        tabsEl.appendChild(tab)
    }
}


// ── messages ──────────────────────────────────────────────────────────────────

function sendChatMessage() {
    let message = document.getElementById("input").value.trim()

    if (!currentTarget || !message) return
    if (!chatSocket || chatSocket.readyState !== WebSocket.OPEN) return

    let me = document.getElementById("username").value.trim()

    chatSocket.send(JSON.stringify({ to: currentTarget, message: message }))

    if (!localHistory[currentTarget]) localHistory[currentTarget] = []
    localHistory[currentTarget].push({ from: me, message: message })
    appendMessage(me, message)

    document.getElementById("input").value = ""
    document.getElementById("input").focus()
}

function renderConversation(username) {
    let chat     = document.getElementById("chat")
    chat.innerHTML = ""

    let messages = localHistory[username] || []
    for (let msg of messages) {
        appendMessage(msg.from, msg.message)
    }
}

function appendMessage(name, text) {
    let chat  = document.getElementById("chat")
    let me    = document.getElementById("username").value.trim()

    let div       = document.createElement("div")
    div.className = "msg" + (name === me ? " self" : "")

    let timeSpan       = document.createElement("span")
    timeSpan.className = "time"
    timeSpan.innerText = getTime()

    let nameSpan       = document.createElement("span")
    nameSpan.className = "name"
    nameSpan.innerText = name

    let textSpan       = document.createElement("span")
    textSpan.className = "text"
    textSpan.innerText = text

    div.appendChild(timeSpan)
    div.appendChild(nameSpan)
    div.appendChild(textSpan)
    chat.appendChild(div)
    chat.scrollTop = chat.scrollHeight
}

function addSystemMessage(text) {
    let chat = document.getElementById("chat")

    let div       = document.createElement("div")
    div.className = "msg system"
    div.innerText = text

    chat.appendChild(div)
    chat.scrollTop = chat.scrollHeight
}

function showEmptyState() {
    let chat = document.getElementById("chat")
    chat.innerHTML = "<div class='empty-state'>select someone to start chatting</div>"
}

function getTime() {
    let now = new Date()
    let h   = String(now.getHours()).padStart(2, "0")
    let m   = String(now.getMinutes()).padStart(2, "0")
    return h + ":" + m
}


// ── user list ─────────────────────────────────────────────────────────────────

function renderUserList(users) {
    let list = document.getElementById("user-list")
    let me   = document.getElementById("username").value.trim()

    // remember who had unread before we wipe the list
    let hadUnread = []
    document.querySelectorAll(".user-item.unread").forEach(function(el) {
        hadUnread.push(el.dataset.user)
    })

    list.innerHTML = ""

    for (let user of users) {
        if (user === me) continue

        let div          = document.createElement("div")
        div.className    = "user-item"
        div.dataset.user = user
        div.innerText    = user
        div.onclick      = function() { openConversation(user) }

        if (user === currentTarget)    div.classList.add("active")
        if (hadUnread.includes(user))  div.classList.add("unread")

        list.appendChild(div)
    }

    let count = Math.max(0, users.length - (me ? 1 : 0))
    document.getElementById("online-count").innerText = "online — " + count
}


// ── event listeners ───────────────────────────────────────────────────────────

document.getElementById("input").addEventListener("keydown", function(e) {
    if (e.key === "Enter") sendChatMessage()
})

document.getElementById("username").addEventListener("keydown", function(e) {
    if (e.key === "Enter") connectChat()
})


// ── init ──────────────────────────────────────────────────────────────────────

showEmptyState()
loadOnlineUsers()
