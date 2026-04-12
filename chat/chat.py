from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

app = FastAPI()
app.mount("/static", StaticFiles(directory="frontend"), name="static")

# keeps track of who is online, username ---> their connection
chat_users = {}


@app.get("/")
async def home():
    # serve the chat page
    return FileResponse("frontend/chat.html")


@app.websocket("/ws/{username}")
async def chat_handler(websocket: WebSocket, username: str):
    # accept the connection and register the user
    await websocket.accept()
    chat_users[username] = websocket
    print(username, "connected")

    try:
        while True:
            data = await websocket.receive_json()
            to      = data["to"]
            message = data["message"]

            if to in chat_users:
                # forward the message to the recipient
                await chat_users[to].send_json({"from": username, "message": message})
            else:
                # tell the sender that person is offline
                await websocket.send_json({"system": to + " is not online"})

    except WebSocketDisconnect:
        del chat_users[username]
        print(username, "disconnected")
