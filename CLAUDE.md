# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BilimHub is a server-side rendered LMS (Learning Management System) for programming courses. It uses a classic MVC pattern with Express.js + EJS templates on the backend and Vanilla JS on the frontend.

## Commands

```bash
npm start                    # Start dev server with nodemon (port 5000)
npm run db:migrate           # Run pending migrations
npm run db:migrate:undo      # Rollback last migration
npm run db:migrate:undo:all  # Rollback all migrations
npm run db:seed              # Run all seeders
npm run db:seed:undo         # Undo all seeders
npm run db:reset             # Full reset: rollback all → migrate → seed
node scripts/setupOylanAssistant.js  # Create the Oylan AI assistant and get OYLAN_ASSISTANT_ID
```

No linting or test scripts are configured. `npm test` exits with an error.

## Architecture

**Stack:** Node.js / Express.js 5 / PostgreSQL / Sequelize 6 / EJS

**Request flow:** `routes/` → `controllers/` → `models/` → DB. Views are rendered server-side via EJS from `controllers/`, except page-rendering routes which live directly in `server.js`.

**Two route categories:**
- **Page routes** (in `server.js`): render EJS pages, use `isAuthenticated`/`isAdmin`
- **API routes** (in `routes/`): return JSON, use `isAuthenticatedAPI`/`isAdminAPI`

**Authentication:** Dual-layer — JWT in HTTP-only cookies + `express-session`. `middleware/auth.js` exports 5 functions:
- `isAuthenticated` — page guard; sets `req.user` (Sequelize instance) and `req.session.user` (plain object: `{id, name, email}`)
- `isGuest` — redirects logged-in users away from login/register pages
- `isAuthenticatedAPI` — API guard; sets `req.user` only; also accepts `Authorization: Bearer` header
- `isAdmin` — page guard for admin role; sets `req.session.user` with `role`
- `isAdminAPI` — API guard for admin role

`res.locals.user` is populated from `req.session.user` for all templates. Note: `testController.submitTest` reads `req.session.user?.id` rather than `req.user.id`.

**Data model hierarchy:**
```
Theme → Lecture → Test → Question → Answer
User → UserProgress (per-lecture progress, test scores, completion)
User → UserRating (aggregated totalScore, completedLectures, completedTests, level, rank)
```

**Course flow:** Themes contain ordered Lectures. Each Lecture has up to 2 Tests (`testNumber: 1|2`, both default `passingScore: 70`). Test 1 is always accessible. Test 2 is accessible only when `test1Score < passingScore`. Passing either test marks the lecture complete and calls `updateUserRating`. The `unlockNextLecture` helper only logs — there is no DB-level lock on lectures.

**Rank system** (in `testController.updateUserRating`):
- `totalScore >= 1000` → Эксперт
- `totalScore >= 500` → Продвинутый
- `totalScore >= 200` → Средний
- otherwise → Новичок

**AI assistant:** `POST /api/ai/ask` proxies questions to the Oylan AI API (`oylan.nu.edu.kz`). Rate limit is in-memory (10 requests/hour per user; resets on server restart). The assistant ID is configured via `OYLAN_ASSISTANT_ID` env var.

## Key Files

- `server.js` — App entry, all page routes, middleware setup, mounts API routers
- `config/db.js` — Sequelize instance (PostgreSQL, pooling, logging off)
- `config/upload.js` — Multer config for video/image uploads to `public/uploads/`
- `models/index.js` — All Sequelize associations defined here
- `middleware/auth.js` — JWT verification and role-based access
- `services/oylanService.js` — HTTP client for Oylan AI API (no SDK, raw `https`)
- `routes/aiRoutes.js` — AI chat endpoint with in-memory rate limiter
- `.sequelizerc` — Points Sequelize CLI to `migrations/`, `seeders/`, `models/`
- `endPoints.md` — API endpoint reference

## Environment

Requires a `.env` file with:
```
DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT, DB_DIALECT
PORT, NODE_ENV, SESSION_SECRET, JWT_SECRET
OYLAN_API_KEY, OYLAN_ASSISTANT_ID
```

PostgreSQL must be running on localhost:5432. Run `node scripts/setupOylanAssistant.js` once to create the Oylan assistant and obtain `OYLAN_ASSISTANT_ID`.

## Route Organization

- Auth (`/register`, `/login`, `/logout`) — `routes/authRoutes.js`
- Learning API (`/api/themes`, `/api/lectures`, `/api/tests`, `/api/ratings`) — `routes/learningRoutes.js`
- User API (`/api/user/*`) — `routes/userRoutes.js`
- File uploads — `routes/uploadRoutes.js`
- AI chat (`/api/ai/ask`) — `routes/aiRoutes.js`
- Page rendering and admin panel — `server.js`

## Views Structure

```
views/
  layouts/main.ejs        # Root layout
  partials/               # head, header, footer, aiChat
  pages/                  # One file per route (login, register, profile, themes,
                          #   theme-detail, lecture, test, rating, admin, contacts, error)
```
