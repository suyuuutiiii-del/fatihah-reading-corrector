# AL-BUSHRA Community Backend

This module is intentionally separate from the working AL-BUSHRA news page.

## Purpose
- Shared reader comments across phones and browsers
- Shared good-news / achiever submissions
- Basic Islamic-adab moderation gate
- Safe separation from the main news site

## Endpoints
- GET /api/health
- GET /api/comments?story_id=...
- POST /api/comments
- POST /api/submissions

## Database
Use a Cloudflare D1 database bound as `DB`, then run `schema.sql` once.

## Frontend connection
After the backend receives a public Worker URL, update `al-bushra.html` so comments are loaded from `/api/comments` and submissions are posted to `/api/submissions` instead of localStorage.

## Design principle
Do not remove the local working AL-BUSHRA page while connecting the backend. Add this module independently, test it, then switch the frontend to it only after the health check and comment test succeed.
