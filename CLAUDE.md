# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## Project overview

GameConnect is an LFG (looking-for-group) platform: users create `GameProfile`s per game (roles, server, rank), post or join `Search`es to form a team, and rate each other afterward via a `Review` system designed to resist troll/revenge reviews. It's a solo portfolio project (backend + frontend in this one repo) with public demo deploys on Render (API) and Vercel (frontend) — see README.md for the live URLs, stack rationale and full roadmap.

## Commands

### Backend (`app/`, Python 3.12, FastAPI)

```bash
python -m venv venv && venv\Scripts\activate     # Windows; source venv/bin/activate on Linux/Mac
pip install -r requirements.txt
copy .env.example .env                           # then fill SECRET_KEY

alembic upgrade head                             # apply migrations (run after every pull that touches models/)
python -m app.seed.load_games                    # seed the games table (idempotent-ish; needed once per fresh DB)
uvicorn app.main:app --reload                    # dev server: http://localhost:8000/docs

alembic revision --autogenerate -m "message"     # new migration after changing a model (model must be in app/models/__init__.py)
```

Tests (pytest, SQLite in-memory, no network):

```bash
pytest                                  # full suite
pytest tests/test_reviews.py            # one file
pytest tests/test_reviews.py::test_name -v   # one test
```

### Frontend (`frontend/`, React 19 + Vite)

```bash
cd frontend
npm install
# create frontend/.env.local with VITE_API_URL=http://localhost:8000
npm run dev        # http://localhost:5173
npm run build
npm run lint
```

## Architecture

### Backend layering (`app/`)

- `main.py` — creates the FastAPI app and includes every router. CORS is wide open (`*`) when `ENVIRONMENT=development`, otherwise restricted to `settings.cors_origins_list` (parsed from the `CORS_ORIGINS` env var).
- `config.py` — Pydantic `Settings` loaded from `.env`/env vars. A validator hard-fails startup if `ENVIRONMENT=production` and `SECRET_KEY` is still the default — this is the only thing standing between a misconfigured deploy and a forgeable JWT.
- `database.py` — one SQLAlchemy engine/session setup serves both SQLite (dev) and Postgres (prod); only `DATABASE_URL` changes between them, no code branches by DB type except the SQLite-only `check_same_thread` connect arg.
- `models/` — SQLAlchemy 2.0 models (`Mapped`/`mapped_column`). Every model must be imported in `models/__init__.py` or Alembic's autogenerate won't see it when diffing.
- `schemas/` — Pydantic request/response shapes, kept separate from the ORM models.
- `routers/` — one file per resource (`auth`, `users`, `game_profiles`, `games`, `searches`, `reviews`, `friends`). Routers stay thin; business math lives in `core/`.
- `core/` — `security.py` (bcrypt hashing + JWT encode/decode), `dependencies.py` (`get_current_user`, the Bearer-token dependency used on every protected route), `reputation.py` (trust-score/reputation math, deliberately separated from routers so it's unit-testable without HTTP).

### Domain flow

`User` → `GameProfile` (per-game roles/server/rank) → `Search` (an LFG post tied to one game+server, `join_mode` manual|auto) → `Participation` (a user's join request/membership, with `role`) → `Review` (post-game rating).

The anti-troll gate is `Participation.creator_confirmed` AND `Participation.participant_confirmed` (`Participation.both_confirmed`) — reviews check this flag, not `Search.status`. Both sides must independently confirm the match happened before either can rate the other.

### Reputation system (`app/core/reputation.py`)

- `reputation_score` (on the rated `User`) is a weighted average of `Review.average_score`, weighted by each review's `weight`. `weight` is a *snapshot* of the author's `reviewer_trust_score` taken at review-creation time — it does not change retroactively if the author's trust later changes.
- `reviewer_trust_score` (on the rating `User`) starts at 1.0, drops 0.1 per flagged review they authored (floor 0.3), gains +0.05 per 10 non-flagged reviews (cap 1.0).
- A new review is flagged as an outlier if the rated user already has ≥5 reviews and the new score deviates >2.0 from their current average; flagged reviews get `weight *= 0.5`.
- `recalculate_user_reputation` and `recalculate_reviewer_trust` must both run after any `Review` create/update/delete — check `routers/reviews.py` for the call sites when touching review logic.

### Auth

Stateless JWT (HS256, `python-jose`), `sub` = user id, no session store. `get_current_user` (`core/dependencies.py`) decodes the token and re-fetches the `User` from the DB on every protected request, so a deleted user's token stops working immediately even though the JWT itself would still verify.

### Frontend (`frontend/src/`)

- One custom hook per backend resource under `lib/` (`useGames`, `useSearches`, `useFriends`, etc.) wrapping axios + loading/error state; `pages/` consume these hooks, `components/` are presentational.
- `AuthContext` (`lib/AuthContext.jsx`) is the only global state. The JWT lives in `localStorage`; the axios instance in `lib/api.js` attaches it via a request interceptor, so individual hooks never touch the token directly.
- `ProtectedRoute` gates routes that require `currentUser` (see `App.jsx` for the route table).
- `/searches` filters live in the URL query string rather than React state, so filtered views are shareable and survive a reload.

### Environments

- **Dev**: SQLite file (`gameconnect.db`), CORS `*`, default `SECRET_KEY` allowed.
- **Prod** (`render.yaml`): Postgres (`DATABASE_URL` injected by Render via `fromDatabase`), `CORS_ORIGINS` must explicitly list the Vercel domain, `SECRET_KEY` must be set (enforced, see `config.py`), served via `gunicorn` with `uvicorn.workers.UvicornWorker`. Render's build step runs `alembic upgrade head` and re-seeds games on every deploy.
- Both backend (Render) and frontend (Vercel) auto-deploy on push to `main`.

### Tests

`tests/conftest.py` overrides `get_db` with a SQLite in-memory session per test and exposes composable fixtures (`client`, `auth_headers`, `second_user_headers`, `user_with_lol_profile`, `loaded_games`) for building multi-user scenarios — check there before writing new fixtures from scratch.
