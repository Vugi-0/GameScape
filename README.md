# **GameScape**

> Find local gamers. Connect, play, meet up.

GameScape is a web-based platform for gamers who want to find others
nearby, chat, and organise meetups. Users appear as markers on an
interactive map, can filter by game and age, message each other
directly, and create or join gaming events.

Repository: <https://github.com/Vugi-0/GameScape>

## Running the login module

### Requirements

-   PostgreSQL (download from https://www.postgresql.org/download/)
-   pgAdmin (usually installed together with PostgreSQL)
-   Python 3.10+
-   pip install flask psycopg2

### Setup

1.  Install PostgreSQL. If pgAdmin asks for a password during setup

<!-- -->

1.  Open pgAdmin, connect to the local server and create the tables by
    running the SQL file:

    -   Open the Query Tool in pgAdmin

    <!-- -->

    -   Open the file login/Gamescape_db_sql/sql_kod.sql

    <!-- -->

    -   Run it

2.  Run the server:

<!-- -->

    		cd login
    		python app.py

4.  In the terminal, click the link or open http://127.0.0.1:5000/ in a
    browser.

<!-- -->

4.  Register an account on the registration page.

## Running the map module

Open map/index.html with a local web server.

Option 1 - VS Code Live Server: - Right-click index.html and select Open
with Live Server

Option 2 - Python:

    		cd map
    		python -m http.server 8000

Then open http://localhost:8000

## Running the chat module

### Chat (FastAPI + WebSockets)

Real-time 1-on-1 direct messaging between users.

**Requirements:** - Python 3.10+: `pip install fastapi uvicorn`

**Running:**

    cd chat
    uvicorn chat:app --reload
    Open http://localhost:8000

**How to test:** 1. Open `http://localhost:8000` in two browser tabs 2.
Enter a different username in each tab and click Connect 3. Type the
other tab's username in the "Send to..." field and start chatting

**Known limitations (in progress):** - No message history: chat clears
on page reload - No authentication: username is not verified against the
user database yet - WebSocket URL is hardcoded to `localhost:8000`;
needs updating before deployment

## 

## 

## 

## 

## Current status

  -----------------------------------------------------------------------
  Feature                             Status
  ----------------------------------- -----------------------------------
  User registration                   Working

  Login / authentication              In progress

  Interactive map with player markers Working

  Map filters (age, game)             Working

  Location-based filter               Placeholder

  Real-time chat                      Working (local)

  Chat \<=\> login integration        In progress

  User profiles with database         In progress

  Event creation and management       Planned
  -----------------------------------------------------------------------

## Player marker colours (map)

  -----------------------------------------------------------------------
  Colour                              Meaning
  ----------------------------------- -----------------------------------
  🟢 Green                            Active now

  🟡 Amber                            Recently active

  ⚫ Grey                             Offline
  -----------------------------------------------------------------------

## Tech stack

  -----------------------------------------------------------------------
  Layer                               Technology
  ----------------------------------- -----------------------------------
  Login backend                       Python / Flask

  Chat backend                        Python / FastAPI

  Database                            PostgreSQL

  Map                                 MapLibre GL + MapTiler Streets Dark

  Frontend                            HTML5, CSS3, Vanilla JavaScript

  Avatars                             DiceBear
  -----------------------------------------------------------------------

## Acknowledgements

-   [MapTiler](https://maptiler.com/) - map tiles and Streets Dark style
-   [MapLibre GL JS](https://maplibre.org/) - open-source mapping
    library
-   [DiceBear](https://dicebear.com/) - avatar placeholders
-   Discord - design inspiration

*Developed as part of a university course (DA336A). All rights reserved
by the team.*
