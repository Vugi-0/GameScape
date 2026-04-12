README.txt

GameScape

Find local gamers -- connect, play, meet up

GameScape is a web-based meetup platform for gamers who want to connect
with others in their local area or global distance meeting. Users can
see other players on an interactive map, filter by game and age, chat
with nearby players, and create or join gaming events.

\-\--

Table of Contents

\- Features

\- Tech Stack

\- Project Structure

\- Installation

\- Running the Project

\- API Keys

\- Usage

\- Team Members

\- License

\-\--

Features

Interactive Map - Built with MapTiler and MapLibre GL -- shows players
in real-time

Player Profiles - View gamertag, games, rank, age, and online status

Chat System - Direct messaging between players (coming soon)

Filters - Filter players by age, game, and location

Dark Theme - Discord-style dark theme with purple accents

Location-Based - See players near your current area

Privacy Controls - Invisible mode to hide from the map

Responsive - Works on desktop and mobile devices

\-\--

Tech Stack

Frontend: HTML5, CSS3, JavaScript

Mapping: MapTiler Streets Dark + MapLibre GL

Icons: DiceBear Avatars (profile pictures)

Hosting: Static files (any web server)

\-\--

Project Structure

GameScape/

├── index.html Main application file

├── map.js Map logic and player markers (MapLibre)

├── layout.css Layout and navbar styling

├── map.css Map-specific styling

├── sidebar.css Hamburger menu styling

└── README.txt This file

\-\--

Installation

1\. Download all files to the same folder

2\. No dependencies to install - the project uses CDN links for MapLibre

3\. Get a MapTiler API key if needed

The current API key is already in the code, but for production you
should get your own:

Go to MapTiler website

Create a free account

Get your API key

Replace MAPTILER_KEY in map.js with your key

\-\--

Running the Project

Option 1: VS Code Live Server (recommended)

Open the project folder in VS Code

Install the \"Live Server\" extension if you don\'t have it

Right-click on index.html

Select \"Open with Live Server\"

Option 2: Python HTTP server

For Python 3:

python -m http.server 8000

Then open http://localhost:8000 in your browser

Option 3: Any web server

Simply upload all files to any static web host (Netlify, Vercel, GitHub
Pages, etc.)

\-\--

API Keys

Service: MapTiler

Key Location: map.js line 8

Purpose: Map tiles and style

Service: DiceBear

Key Location: index.html (hardcoded)

Purpose: Avatar images

Note: The MapTiler API key is currently visible in the code. For
production, move it to environment variables or a backend proxy.

\-\--

Usage

Navigation

Hamburger menu (three lines) at top-left - Opens menu with Home, Chat,
Notifications, Settings, Login

Profile picture at top-right - Static for now -- will link to profile
page

Filters button at top-right (floating on map) - Filter players by age,
game, location

Player markers on the map - Click to see player profile and start chat

Player Status Colors

Green - Active now

Amber - Recently active

Grey - Offline

Filters

Age: All ages, 18-25, 26-35, 35+

Games: Valorant, CS2, League of Legends, Minecraft, Fortnite

Location: All locations, Malmö, Gothenburg, Stockholm (placeholder)

\-\--

Current Status

Implemented:

MapTiler Streets Dark map

Player markers with status colors

Clickable player profiles

Filter dropdown (Age, Games, Location)

Hamburger menu (Home, Chat, Notifications, Settings, Login/Logout)

Discord-style dark theme

Responsive design (desktop and mobile)

In Progress / Planned:

Real-time chat system (Zakaria)

User profiles with database (Mohamad)

Event creation and management

Location-based filtering (full implementation)

Login and authentication system

\-\--

Known Issues

MapTiler API sometimes returns 403 error - use fallback (will be fixed
in production)

Chat and profile pages are placeholders - being implemented

Location filter is placeholder - will be implemented with geocoding

\-\--

License

This project is developed as part of a university course. All rights
reserved by the team members.

\-\--

Acknowledgments

MapTiler for map tiles and Streets Dark style

MapLibre GL for the mapping library

DiceBear Avatars for profile picture placeholders

Discord for design inspiration ( can change later)

\-\--

Contact

For questions about this project, contact the team via the course
supervisor.

Happy gaming
