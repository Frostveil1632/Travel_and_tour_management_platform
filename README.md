# Waypoint - Travel and Tour Management Platform

B.Tech CSE 3rd year project, GLA University, Mathura.
Team: Om Singh, Nishant Prajapati, Palak Kamra, Naveen Yadav. Supervisor: Mr. Yash Singh.

A frontend-only web app (no backend, no database). Destination data lives in JSON files,
user data lives in the browser's localStorage, and an itinerary planner builds a day-wise
plan that stays inside the traveller's budget while keeping travel short.

## Run it
Open the folder in VS Code and use the **Live Server** extension on `index.html`
(or run `python -m http.server 8000` and open http://localhost:8000).
Do not double-click the HTML files - browsers block loading the JSON data that way.

Demo login: `demo@waypoint.com` / `demo123` (demo-level login, not secure authentication).

## Features
| Page | What it does |
|---|---|
| `index.html` | Home page |
| `destinations.html` | Browse and filter destinations (region, trip length, budget), wishlist |
| `itinerary.html` | Itinerary builder: knapsack + nearest-neighbour + 2-opt, runs in a Web Worker |
| `login.html` | Demo login and signup (checked against `data/users.json` + localStorage) |
| `booking.html` | Mock checkout, saves the booking in localStorage |
| `profile.html` | My Trips: wishlist, saved itineraries, bookings |
| `editor.html` | Data Editor: add / edit / delete JSON records with validation, download JSON |
| `benchmark.html` | Route length: naive vs nearest-neighbour vs 2-opt vs brute force |

## How the itinerary algorithm works (`js/planner.js`)
1. Weighted graph: attractions are nodes, edge weight = distance between coordinates (haversine formula).
2. Budget step: 0/1 knapsack picks the attractions with the highest total rating that fit the budget left after package fare and transport.
3. Route step: nearest-neighbour builds a first route, 2-opt reverses parts of it while that makes it shorter.
4. The route is split across the days and given visiting times.

## Folders
```
data/      destinations.json, packages.json, attractions.json, users.json
js/        common.js (shared helpers), planner.js, planner-worker.js, validate.js, one file per page
tests/     Jest tests (planner, validation, shared helpers, data consistency)
scripts/   build.js (copies the site into dist/)
.github/   workflows/ci.yml (lint, test, build, deploy to GitHub Pages)
```

## Tests, lint and build
```
npm install
npm run lint
npm test
npm run build      # creates dist/
```

## Deploy (free)
GitHub repo -> Settings -> Pages -> Source: **GitHub Actions**.
After that every push to `main` lints, tests, builds and deploys automatically.

## Known limits (by design for a 3rd-year project)
- localStorage is per browser: data is not shared between devices or users.
- The login and payment are simulated.
- Distances are straight-line, not road distances. Sample data (prices, coordinates) is approximate.
- Built with plain JavaScript instead of React.
