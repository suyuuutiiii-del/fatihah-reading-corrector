# AL-BUSHRA Community Backend

This module is intentionally separate from the working AL-BUSHRA news page.

## Purpose
- Shared reader comments across phones and browsers
- Shared good-news / achiever submissions
- Basic Islamic-adab moderation gate
- Authenticated admin moderation
- Safe separation from the main news site

## Public endpoints
- `GET /api/health`
- `GET /api/comments?story_id=...`
- `POST /api/comments`
- `POST /api/submissions`

Public readers see only comments whose status is `approved`. New story / achiever submissions enter the database as `pending`.

## Private admin endpoints
All `/api/admin/*` routes require a Cloudflare Worker secret named `ADMIN_TOKEN`.

Send the token as either:
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

## Required private secret
In the Cloudflare dashboard for Worker `albushra-community`, create an encrypted secret:

`ADMIN_TOKEN`

Use a long private value. Never put this value into GitHub, `worker.js`, `wrangler.jsonc`, or the public HTML page.

The admin page `al-bushra-admin.html` asks for the token and keeps it only in the current browser session (`sessionStorage`).

## Cloudflare deployment
Expected Worker name: `albushra-community`
Expected D1 database name: `al-bushra-community-db`
Expected D1 binding name: `DB`

Existing deployment helper:
`https://deploy.workers.cloudflare.com/?url=https://github.com/suyuuutiiii-del/fatihah-reading-corrector/tree/main/al-bushra-backend`

IMPORTANT: preserve the existing D1 binding named `DB` when redeploying. The live Worker already contains reader comments/submissions, so do not replace or delete its database.

## Database
The schema creates:
- `comments` with statuses such as `approved`, `hidden`, `pending`
- `submissions` with statuses such as `pending`, `approved`, `hidden`, `rejected`

No schema migration is required for the new moderation controls because the existing tables already have a `status` column.

## Admin page
Open:
`al-bushra-admin.html`

After the updated Worker is deployed and `ADMIN_TOKEN` is configured, the page can genuinely:
- approve a comment
- hide a comment from the public page
- permanently delete a comment
- approve / hide / reject reader submissions
- permanently delete a submission

## Security principle
The admin token must remain a Cloudflare secret. The public GitHub repository contains only the code that checks the secret; it never contains the secret itself.
