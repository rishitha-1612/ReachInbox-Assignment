# Deploy to Railway

Create one Railway project with five services:

1. PostgreSQL
2. Redis
3. API (this repository's `backend` directory)
4. Worker (this repository's `backend` directory)
5. Frontend (this repository's `frontend` directory)

## API service

Set **Root Directory** to `/backend` and set **Config as Code** to
`/backend/railway.toml`. The included config builds the API, runs Prisma
migrations before deployment, starts the server, and uses `/health` as the
health check.

Set these variables:

```text
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
NODE_ENV=production
JWT_SECRET=<a long random value>
AUTH_COOKIE_NAME=reachinbox_session
GOOGLE_CLIENT_ID=<Google OAuth client ID>
GOOGLE_CLIENT_SECRET=<Google OAuth client secret>
GOOGLE_CALLBACK_URL=https://<API_PUBLIC_DOMAIN>/api/v1/auth/google/callback
SMTP_HOST=<SMTP hostname>
SMTP_PORT=<SMTP port>
SMTP_USER=<SMTP username>
SMTP_PASS=<SMTP password>
SMTP_FROM=<verified sender address>
SMTP_ENCRYPTION_KEY=<base64-encoded 32-byte key>
FRONTEND_URL=https://<FRONTEND_PUBLIC_DOMAIN>
COOKIE_SAME_SITE=none
```

Generate a public domain for this service and substitute it into
`GOOGLE_CALLBACK_URL`. Do not set `REDIS_HOST` or `REDIS_PORT` when using
`REDIS_URL`.

## Worker service

Create a second service from the same repository. Set **Root Directory** to
`/backend`, then set:

```text
Build Command: pnpm build
Start Command: pnpm worker
```

Copy the API service variables to this service, including `DATABASE_URL`,
`REDIS_URL`, SMTP credentials, and `SMTP_ENCRYPTION_KEY`. Do not configure a
public domain or health check for the worker. The worker must use the same
PostgreSQL database and Redis instance as the API.

## Frontend service

Create a third service from the same repository. Set **Root Directory** to
`/frontend` and **Config as Code** to `/frontend/railway.toml`.

Before the first deployment, set:

```text
NEXT_PUBLIC_API_URL=https://<API_PUBLIC_DOMAIN>/api/v1
```

Generate a public domain for the frontend, then copy it back to the API's
`FRONTEND_URL` variable and redeploy the API. `NEXT_PUBLIC_API_URL` is embedded
into the frontend during its build, so redeploy the frontend whenever it changes.

## Google OAuth

In Google Cloud Console, add this exact Authorized redirect URI:

```text
https://<API_PUBLIC_DOMAIN>/api/v1/auth/google/callback
```

Use the real Railway public domain without a trailing slash. Also add the
frontend public domain to the OAuth consent screen's authorized JavaScript
origins if Google requests it.

## Before going live

Visit `https://<API_PUBLIC_DOMAIN>/health` and confirm it returns a successful
JSON response. Then open the frontend, use **Continue with Google**, and
schedule a test email. Ethereal SMTP only accepts test mail; use a transactional
SMTP provider for real delivery.
