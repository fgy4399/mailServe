# Repository Guidelines

- 永远使用中文回答

## Project Structure & Module Organization

- `backend/`: Node.js (ESM) service providing the HTTP API (`/api/*`), SMTP receiver, and WebSocket notifications.
  - Entry: `backend/src/index.js`
  - API routes: `backend/src/api/`
  - SMTP server: `backend/src/smtp/`
  - Redis + helpers: `backend/src/utils/`
- `frontend/`: Vite + React UI (Tailwind) in `frontend/src/`; production build output in `frontend/dist/`.
- `docker/`: Nginx + Supervisor configs used by the root `Dockerfile` (proxies `/api` → `:3000`, `/ws` → `:3001`).
- Root: `docker-compose.yml` (Redis + all-in-one app), `docker-deploy.sh` (interactive deploy), `DOCKER.md` (deployment notes).

## Build, Test, and Development Commands

- Backend (requires Redis):
  - `cd backend && npm ci`
  - `cp .env.example .env`
  - `npm run dev` (dev) or `npm run start` (prod-like)
- Frontend:
  - `cd frontend && npm ci`
  - `cp .env.example .env` (set `VITE_API_URL` / `VITE_WS_URL` when running split frontend+backend)
  - `npm run dev` (http://localhost:5173), `npm run build`, `npm run preview`
- Docker (full stack): `docker compose up -d --build` then open `http://localhost`.

## Coding Style & Naming Conventions

- JavaScript/JSX uses ES modules (`import`/`export`) and semicolons.
- Indentation is 4 spaces in most files; match existing formatting within the file you edit.
- React components use `PascalCase` filenames (e.g. `MailboxCreator.jsx`); hooks use `useX`; variables/functions use `camelCase`.
- No repo-wide formatter/linter is configured; keep diffs minimal and run `npm run build` for frontend changes.

## Testing Guidelines

- No test runner is configured yet (no `npm test` script). If you introduce tests, keep them fast and document the command in the relevant `package.json`.

## Commit & Pull Request Guidelines

- This workspace does not include Git history; use a clear convention (e.g. `feat: …`, `fix: …`, `chore: …`).
- PRs should include: what changed, why, how to verify (commands + URLs), and screenshots for UI changes.

## Security & Configuration Tips

- Don’t commit real secrets in `.env`; update `.env.example` when adding new config.
- Port 25 may require elevated privileges; for local dev prefer `SMTP_PORT=2525` (Docker uses 25).
