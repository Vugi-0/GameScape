let chatSocket = null

function connectChat() {
    let username = document.getElementById("username").value
    if (!username) return

    // open a websocket connection under this username
    chatSocket = new WebSocket("ws://localhost:8000/ws/" + username)

    chatSocket.onopen = function() {
        document.getElementById("status").innerText = "connected as " + username
        document.getElementById("status").className = "connected"
        renderMessage("system", "you joined the chat")
    }

    chatSocket.onmessage = function(e) {
        let data = JSON.parse(e.data)

        // system messages are things like "x is not online"
        if (data.system) {
            renderMessage("system", data.system)
            return
        }

        renderMessage(data.from, data.message)
    }

    chatSocket.onclose = function() {
        document.getElementById("status").innerText = "disconnected"
        document.getElementById("status").className = ""
        renderMessage("system", "you left the chat")
    }
}

function getTime() {
    let now = new Date()
    let h   = String(now.getHours()).padStart(2, "0")
    let m   = String(now.getMinutes()).padStart(2, "0")
    return h + ":" + m
}

function renderMessage(name, text) {
    let chat = document.getElementById("chat")

    let isYou    = name === document.getElementById("username").value
    let isSystem = name === "system"

    let cssClass = "msg"
    if (isYou)    cssClass += " self"
    if (isSystem) cssClass += " system"

    let time = "<span class='time'>" + getTime() + "</span>"

    if (isSystem) {
        chat.innerHTML += "<div class='" + cssClass + "'>" + time + " " + text + "</div>"
    } else {
        chat.innerHTML += "<div class='" + cssClass + "'>" + time + " <span class='name'>" + name + "</span><span class='text'>" + text + "</span></div>"
    }

    chat.scrollTop = chat.scrollHeight
}

function sendChatMessage() {
    let to      = document.getElementById("to").value
    let message = document.getElementById("input").value

    if (!to || !message) return
    if (!chatSocket || chatSocket.readyState !== WebSocket.OPEN) return

    // send to server, also show it on our own screen
    chatSocket.send(JSON.stringify({ to: to, message: message }))
    renderMessage(document.getElementById("username").value, message)

    document.getElementById("input").value = ""
}

// let the user press enter instead of clicking send
document.getElementById("input").addEventListener("keydown", function(e) {
    if (e.key == "Enter") sendChatMessage()
})
