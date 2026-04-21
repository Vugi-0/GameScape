from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

app = FastAPI()
app.mount("/static", StaticFiles(directory="frontend"), name="static")

chat_users   = {}
chat_history = {}

HISTORY_LIMIT = 200


def history_key(a, b):
    # always the same key regardless of who is "a" and who is "b"
    return tuple(sorted([a, b]))


def save_message(sender, recipient, message):
    key = history_key(sender, recipient)
    chat_history.setdefault(key, []).append({"from": sender, "message": message})
    # trim oldest messages if we go over the limit
    if len(chat_history[key]) > HISTORY_LIMIT:
        chat_history[key] = chat_history[key][-HISTORY_LIMIT:]


async def broadcast_user_list():
    # let everyone know the current online list
    user_list = list(chat_users.keys())
    for ws in chat_users.values():
        await ws.send_json({"users": user_list})


@app.get("/")
async def home():
    return FileResponse("frontend/chat.html")


@app.get("/users")
async def get_users():
    # called on page load so the sidebar shows who's online before connecting
    return JSONResponse(list(chat_users.keys()))


@app.websocket("/ws/{username}")
async def chat_handler(websocket: WebSocket, username: str):
    await websocket.accept()
    chat_users[username] = websocket
    print(username, "connected")

    # replay history for every conversation this user has been part of
    for key, messages in chat_history.items():
        if username in key:
            other = key[0] if key[1] == username else key[1]
            await websocket.send_json({"history": messages, "with": other})

    await broadcast_user_list()

    try:
        while True:
            data    = await websocket.receive_json()
            to      = data["to"]
            message = data["message"]

            save_message(username, to, message)

            if to in chat_users:
                await chat_users[to].send_json({"from": username, "message": message})
            else:
                await websocket.send_json({"system": f"{to} is not online"})

    except WebSocketDisconnect:
        chat_users.pop(username, None)
        print(username, "disconnected")
        await broadcast_user_list()
