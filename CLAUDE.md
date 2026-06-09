# World Cup 2026

PWA web app for FIFA World Cup 2026 — games, standings, and bracket.

## Stack

- **Backend:** `src/WorldCup.Api` — ASP.NET .NET 10 minimal API, no database, data served from JSON files
- **Frontend:** `src/WorldCup.Web` — React 19 + Vite + Tailwind v4 + vite-plugin-pwa

## Running locally

```bash
# API (port 5240)
cd src/WorldCup.Api
dotnet run

# Frontend (port 5173, proxies /api to :5240)
cd src/WorldCup.Web
npm run dev
```

## Project structure

```
src/WorldCup.Api/
  Data/             ← games.json, groups.json, bracket.json (source of truth)
  Endpoints/        ← GameEndpoints, GroupEndpoints, BracketEndpoints
  Program.cs        ← CORS, static files, SPA fallback

src/WorldCup.Web/src/
  components/       ← GamesTab, StandingsTab, BracketTab
  api.ts            ← typed fetch wrapper
  types.ts          ← Game, Group, Bracket interfaces
  App.tsx           ← bottom tab nav layout
```

## Deployment

Docker → ghcr.io → Coolify webhook.

Push to `main` triggers `.github/workflows/deploy.yml` which builds the image and calls `COOLIFY_WEBHOOK_URL`.

Required GitHub secret: `COOLIFY_WEBHOOK_URL`

## Data

All data lives in `src/WorldCup.Api/Data/`. To update scores or standings, edit the JSON files directly — no database involved.

- `games.json` — 60 group stage matches (all with `homeScore: null, awayScore: null` until played)
- `groups.json` — 12 groups (A–L), 48 teams, standings initially all zeros
- `bracket.json` — knockout rounds R32 → R16 → QF → SF → 3rd place → Final
