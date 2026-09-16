# AL-BUSHRA Community Backend

This module is intentionally separate from the working AL-BUSHRA news page.

## Purpose
- Shared reader comments across phones and browsers
- Shared good-news / achiever submissions
- Basic Islamic-adab moderation gate
- Safe separation from the main news site

## One-click Cloudflare deployment

Use Cloudflare's Deploy to Cloudflare flow for this folder. The Worker config declares a D1 database binding named `DB`, and the deploy script applies `schema.sql` to the remote database before deploying the Worker.

Deploy URL:
https://deploy.workers.cloudflare.com/?url=https://github.com/suyuuutiiii-del/fatihah-reading-corrector/tree/main/al-bushra-backend

Expected Worker name: `al-bushra-community`
Expected D1 database name: `al-bushra-community-db`

## Endpoints
- GET /api/health
- GET /api/comments?story_id=...
- POST /api/comments
- POST /api/submissions

## Database
Cloudflare D1 is bound to the Worker as `DB`. The schema creates `comments` and `submissions` tables plus their indexes.

## Frontend connection
After the backend receives a public Worker URL and `/api/health` succeeds, update `al-bushra.html` so comments are loaded from `/api/comments` and submissions are posted to `/api/submissions` instead of localStorage.

## Design principle
Do not remove the local working AL-BUSHRA page while connecting the backend. Add this module independently, test it, then switch the frontend to it only after the health check and comment test succeed.
