# AL-BUSHRA Community Backend

This module powers shared reader comments, good-news submissions, and secure administrator moderation for AL-BUSHRA.

## Current live status
The public Worker URL currently still serves the original `Hello World!` starter Worker. The code in this folder is the finished replacement and must be deployed once before comments and moderation become live.

## What deployment now provisions automatically
The deployment configuration declares a Cloudflare D1 binding named `DB` with database name `al-bushra-community-db`. With current Wrangler/Cloudflare automatic provisioning, Cloudflare can create and bind the D1 database when the project is deployed.

`package.json` runs `schema.sql` against the remote `DB` before deploying the Worker, creating the required tables and indexes.

## One-click deployment
Open:

`https://deploy.workers.cloudflare.com/?url=https://github.com/suyuuutiiii-del/fatihah-reading-corrector/tree/main/al-bushra-backend`

During setup, keep the Worker name `albushra-community` and provide the requested private secret:

`ADMIN_TOKEN`

Choose a long private value known only to the AL-BUSHRA administrator. Never place that value in GitHub or in the public webpage.

## Public endpoints
- `GET /api/health`
- `GET /api/comments?story_id=...`
- `POST /api/comments`
- `POST /api/submissions`

Public readers see only comments whose status is `approved`. New comments and new story/achiever submissions enter the database as `pending` and wait for admin review.

## Private admin endpoints
All `/api/admin/*` routes require `ADMIN_TOKEN`.

Send it as:
- `Authorization: Bearer <token>` (preferred), or
- `X-Admin-Token: <token>`

Available routes:
- `GET /api/admin/health`
- `GET /api/admin/comments?status=all|approved|hidden|pending`
- `PATCH /api/admin/comments/:id` with `{ "status": "approved" | "hidden" | "pending" }`
- `DELETE /api/admin/comments/:id`
- `GET /api/admin/submissions?status=all|pending|approved|hidden|rejected`
- `PATCH /api/admin/submissions/:id` with `{ "status": "pending" | "approved" | "hidden" | "rejected" }`
- `DELETE /api/admin/submissions/:id`

## Database
`schema.sql` creates:
- `comments`: `pending`, `approved`, `hidden`
- `submissions`: `pending`, `approved`, `hidden`, `rejected`

The default for new comments is `pending`.

## Admin page
Open `al-bushra-admin.html` after deployment. Enter the same private `ADMIN_TOKEN`. The token is kept only in that browser session.

The admin page can:
- show pending comments first
- approve a comment so it becomes public
- hide a comment
- permanently delete a comment
- approve, hide, reject, or delete reader submissions

## Security principle
The admin token must remain a Cloudflare secret. The public repository contains only an example placeholder and code that checks the secret; the real token must never be committed.
