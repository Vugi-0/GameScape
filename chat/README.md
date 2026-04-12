# Gamescape Chat

1-on-1 real time chat built with FastAPI and WebSockets.  
Part of the GameScape project which handles the direct messaging system.

---

## Stack

- **Python / FastAPI** — websocket server
- **Vanilla JS** — browser client

---

## Setup

```bash
pip install fastapi uvicorn
python -m uvicorn chat:app --reload
```

Then open `http://localhost:8000`.

---

## How to use

1. Enter a username and click **Connect**
2. Open a second tab with a different username
3. Type the other person's username in **Send to...**
4. Start chatting

---

## File structure

```
gamescape/
├── chat.py          # server — registers users, routes messages
└── frontend/
    ├── chat.html    # the page
    ├── chat.js      # websocket client, message rendering
    └── chat.css     # styles
```

---

## Limitations

- Usernames are not unique. Reconnecting with the same name kicks the old session.
- No message history. Reloading makes chat disappear.
- Local only. Both users need to be on the same machine.
