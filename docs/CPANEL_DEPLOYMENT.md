# cPanel Passenger deployment

This project deploys as two independent Passenger applications. Do not use a
gateway that spawns child Node.js processes, fixed internal ports, or installs
packages while serving a request.

## Build the artifacts

Set the API URL before the Next.js build because `NEXT_PUBLIC_*` values are
compiled into browser JavaScript.

```powershell
$env:NEXT_PUBLIC_API_URL = 'https://api.sadaqahbd.com/api/v1'
pnpm cpanel:build
```

The resulting folders are `deploy/web` and `deploy/api`.
They contain no `.env` files or credentials.

## Web application

Create a Node.js application for `https://sadaqahbd.com/`.

- Application root: the uploaded `web` folder outside `public_html`
- Startup file: `server.js`
- Application mode: Production
- Environment: `NODE_ENV=production`
- Run `npm install --omit=dev` once from the cPanel application interface.

The standalone server is kept small, while this install materializes exactly
the production runtime dependencies required by the hosting platform.

## API application

Create a second Node.js application for `https://api.sadaqahbd.com/`.

- Application root: the uploaded `api` folder outside `public_html`
- Startup file: `server.js`
- Application mode: Production
- Run `npm install --omit=dev` once from the cPanel application interface

Set these environment variables in the API application's cPanel environment
editor. Never upload an `.env` file or commit a secret.

```text
NODE_ENV=production
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=your_cpanel_database_user
DATABASE_PASSWORD=your_database_password
DATABASE_NAME=your_cpanel_database_name
FIREBASE_SERVICE_ACCOUNT_KEY=base64_or_json_service_account_value
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
CORS_ORIGINS=https://sadaqahbd.com,https://www.sadaqahbd.com
DB_POOL_SIZE=5
DB_POOL_MAX_IDLE=2
DB_POOL_QUEUE_LIMIT=20
MAX_CONCURRENT_REQUESTS=30
```

Use `NODE_OPTIONS=--max-old-space-size=192` only if the hosting panel supports
it and the account has at least 1 GB RAM. Keep this value at `128` on a 512 MB
plan. Passenger supplies `PORT`; do not set it manually.

## Database and verification

Create the MySQL database with `utf8mb4` and `utf8mb4_unicode_ci`, then apply
the Drizzle migrations before starting the API. Verify the API after restart:

```text
https://api.sadaqahbd.com/api/v1/health
```

It must return `{"status":"ok"}`. Confirm a public page, Firebase login, and
one authenticated API request afterwards.

## Traffic protection

The API uses a five-connection MySQL pool, a global per-IP throttle, bounded
request concurrency, connection/request timeouts, and `Retry-After` on 503.
Cloudflare should cache static assets and challenge abusive traffic before it
reaches cPanel. Do not enable multiple Passenger instances on a small plan;
use one instance per app unless the host raises the LVE memory allocation.
