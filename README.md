
# ReachInbox — Email Scheduler

A full-stack email scheduling system built with **Next.js, React, TypeScript, Express, PostgreSQL, Redis, and BullMQ**.

The application allows authenticated users to create email campaigns, upload recipient lists, schedule email delivery, enforce sender-level rate limits, process emails asynchronously through workers, and track scheduled and sent emails.

---

## Features

- Google OAuth authentication
- Secure HTTP-only session cookies
- Email campaign scheduling
- CSV recipient upload
- Email validation
- Duplicate recipient detection
- Sender management
- Sender-level hourly sending limits
- Minimum delay between consecutive sends
- Redis-backed rate limiting
- BullMQ delayed jobs
- Concurrent email workers
- Idempotent email processing
- Retry handling for transient failures
- PostgreSQL-backed email state
- Worker restart recovery
- Scheduled email dashboard
- Sent email dashboard
- Dashboard statistics
- SMTP delivery using Nodemailer
- Ethereal SMTP support for development and testing

---

# Architecture

```text
                         ┌──────────────────────┐
                         │      Next.js UI      │
                         │                      │
                         │  Dashboard           │
                         │  Compose             │
                         │  Scheduled           │
                         │  Sent                │
                         └──────────┬───────────┘
                                    │
                                    │ HTTP
                                    ▼
                         ┌──────────────────────┐
                         │     Express API      │
                         │                      │
                         │  Authentication      │
                         │  Sender Management   │
                         │  Scheduling API      │
                         │  Dashboard API       │
                         └──────────┬───────────┘
                                    │
                     ┌──────────────┴──────────────┐
                     │                             │
                     ▼                             ▼
             ┌──────────────┐              ┌──────────────┐
             │  PostgreSQL  │              │    Redis     │
             │              │              │              │
             │ Users        │              │ Rate Limits  │
             │ Senders      │              │ BullMQ       │
             │ EmailJobs    │              │ Delayed Jobs │
             └──────────────┘              └──────┬───────┘
                                                  │
                                                  ▼
                                         ┌─────────────────┐
                                         │  Email Worker   │
                                         │                 │
                                         │ Rate limiting   │
                                         │ Idempotency     │
                                         │ Retries         │
                                         │ SMTP delivery   │
                                         └────────┬────────┘
                                                  │
                                                  ▼
                                         ┌─────────────────┐
                                         │      SMTP       │
                                         │    Nodemailer   │
                                         │    Ethereal     │
                                         └─────────────────┘
````

---

# Application Flow

```text
Google Login
     │
     ▼
Authenticated Session
     │
     ▼
Dashboard
     │
     ├───────────────┐
     │               │
     ▼               ▼
 Compose          Scheduled
     │               │
     │               ▼
     │            Scheduled Jobs
     │
     ▼
Recipient CSV / Manual Input
     │
     ▼
Validation
     │
     ▼
Schedule Request
     │
     ▼
PostgreSQL EmailJob
     │
     ▼
BullMQ / Redis
     │
     ▼
Email Worker
     │
     ├── Rate Limiting
     ├── Send Spacing
     ├── Idempotency
     └── Retry Handling
     │
     ▼
SMTP / Ethereal
     │
     ▼
SENT
     │
     ▼
Sent Emails
```

---

# Technology Stack

## Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* Axios

## Backend

* Node.js
* Express
* TypeScript
* Prisma ORM
* Zod

## Infrastructure

* PostgreSQL
* Redis
* BullMQ

## Authentication

* Google OAuth
* JSON Web Tokens
* HTTP-only cookies

## Email

* Nodemailer
* SMTP
* Ethereal Email

---

# Project Structure

```text
ReachInbox-Assignment/
│
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   │
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── middleware/
│       ├── queue/
│       ├── repositories/
│       ├── routes/
│       ├── services/
│       ├── utils/
│       ├── validators/
│       ├── workers/
│       ├── app.ts
│       └── server.ts
│
├── frontend/
│   └── src/
│       ├── app/
│       │   └── dashboard/
│       │       ├── compose/
│       │       ├── scheduled/
│       │       └── sent/
│       ├── components/
│       ├── lib/
│       └── services/
│
├── docker/
│   └── docker-compose.yml
│
├── README.md
└── .gitignore
```

---

# Core Workflow

## 1. Authentication

Users authenticate using Google OAuth.

The authentication flow is:

```text
Google
   ↓
OAuth callback
   ↓
Verify Google ID token
   ↓
Create / update user
   ↓
Generate JWT session
   ↓
HTTP-only session cookie
```

The session cookie is used by authenticated API requests.

---

## 2. Sender Management

Each authenticated user can have one or more sender accounts.

A sender contains:

* Email address
* Display name
* SMTP host
* SMTP port
* SMTP username
* Protected SMTP credential
* Default sender status

Sender access is restricted to the authenticated user's own accounts.

---

## 3. Campaign Creation

The Compose page allows users to configure:

* Sender
* Recipient list
* Subject
* Email body
* Schedule time
* Minimum delay between emails
* Hourly sending limit

Recipients can be entered manually or imported from a CSV file.

---

## 4. CSV Processing

Recipient addresses are normalized and classified into:

```text
Valid
Invalid
Duplicate
```

Example:

```text
alice@example.com
bob@example.com
invalid-email
alice@example.com
```

Result:

```text
Valid       → 2
Invalid     → 1
Duplicates  → 1
```

Only unique valid addresses are scheduled.

---

# Email Scheduling

Each recipient becomes an individual `EmailJob`.

Example:

```text
Batch
 ├── EmailJob → alice@example.com
 ├── EmailJob → bob@example.com
 └── EmailJob → charlie@example.com
```

All jobs created from the same scheduling request share a `batchId`.

This allows campaign-level grouping while keeping delivery state independent for every recipient.

---

# Persistence

PostgreSQL is used as the durable source of truth.

The database stores:

* Users
* Senders
* Email jobs
* Scheduling information
* Delivery status
* Attempt count
* Failure reasons
* Message IDs
* Timestamps

Email jobs are persisted before asynchronous processing begins.

---

# Queue Architecture

After the EmailJob is persisted, the system creates a BullMQ job.

```text
PostgreSQL
    │
    │ EmailJob
    ▼
BullMQ
    │
    ▼
Redis
    │
    ▼
Worker
```

The API does not wait for SMTP delivery to complete.

This keeps request processing fast while email delivery happens asynchronously.

---

# Rate Limiting

The system implements sender-level rate limiting using Redis.

Two controls are enforced.

## Hourly Sending Limit

Each sender can have a configurable hourly quota.

Example:

```text
Hourly limit = 200
```

Redis maintains a sender-specific hourly counter.

Conceptually:

```text
email:hourly:{senderId}:{YYYYMMDDHH}
```

The counter is incremented atomically.

When the hourly limit is reached, the job is delayed instead of being permanently failed.

---

## Minimum Send Spacing

Each sender can also have a minimum delay between sends.

Example:

```text
Minimum delay = 2000 ms
```

Redis stores the most recent permitted send time.

Conceptually:

```text
email:last-send:{senderId}
```

This prevents multiple workers from sending messages from the same sender too quickly.

---

## Combined Rate-Limiting Flow

```text
Email Job
    │
    ▼
Hourly quota check
    │
    ▼
Minimum spacing check
    │
    ├───────────────────┐
    │                   │
    ▼                   ▼
 Allowed             Throttled
    │                   │
    ▼                   ▼
 Send email          Reschedule
```

Throttled jobs are not treated as permanent failures.

---

# Worker Design

The worker is responsible for email delivery.

For each job it:

1. Loads the EmailJob from PostgreSQL.
2. Checks the current state.
3. Claims the job atomically.
4. Applies sender-level rate limiting.
5. Sends the email through SMTP.
6. Persists the final result.

The worker supports configurable concurrency.

Example:

```text
WORKER_CONCURRENCY=5
```

This allows multiple independent email jobs to be processed concurrently.

---

# Idempotency

The system protects against duplicate processing.

Before sending an email, the worker checks the persistent database state.

If the job is already:

```text
SENT
```

the worker skips the send.

This prevents duplicate delivery when BullMQ redelivers a job or when a worker is restarted.

The EmailJob ID is also used as the stable identity of the queued operation.

---

# Retry Handling

Transient SMTP and network failures can be retried using BullMQ.

Typical retryable conditions include:

* Network errors
* Connection failures
* SMTP timeouts
* Temporary SMTP response codes

Conceptually:

```text
Attempt 1
   ↓
Temporary failure
   ↓
Exponential backoff
   ↓
Attempt 2
   ↓
Temporary failure
   ↓
Exponential backoff
   ↓
Attempt 3
```

After the configured retry attempts are exhausted, the email is marked as:

```text
FAILED
```

Permanent failures are not retried indefinitely.

---

# Email State Lifecycle

Email jobs follow a controlled state machine.

```text
PENDING
   ↓
QUEUED
   ↓
PROCESSING
   ↓
SENT
```

Failure path:

```text
PROCESSING
     ↓
   FAILED
```

Throttling path:

```text
PROCESSING
     ↓
   QUEUED
     ↓
  DELAYED
```

---

# Worker Restart Recovery

Scheduled jobs are persisted independently of the worker process.

This means stopping a worker does not delete scheduled work.

The recovery model is:

```text
PostgreSQL + Redis/BullMQ
          ↓
      Worker stops
          ↓
     Jobs persist
          ↓
      Worker starts
          ↓
   Pending/queued work
       is recovered
          ↓
     Email processed
```

This allows queued work to survive worker restarts.

---

# Dashboard

The dashboard provides real-time application statistics for the authenticated user.

The dashboard tracks:

```text
Total Emails
Scheduled
Sent
Failed
```

Example:

```text
Total Emails    100
Scheduled        25
Sent             70
Failed            5
```

Statistics are calculated from PostgreSQL.

---

# Scheduled Emails

The Scheduled page displays email jobs that are currently waiting to be processed.

Information includes:

* Recipient
* Subject
* Scheduled time
* Current status

Typical statuses include:

```text
PENDING
QUEUED
PROCESSING
```

Once the email is successfully sent, it moves to the Sent page.

---

# Sent Emails

The Sent page displays successfully delivered emails.

Information includes:

* Recipient
* Subject
* Sent time
* Status

Example:

```text
Recipient           Subject             Status
------------------------------------------------
alice@example.com   Welcome             SENT
bob@example.com     Campaign Update     SENT
```

---

# SMTP Delivery

The project uses Nodemailer for SMTP delivery.

Ethereal Email is used during development and testing.

The delivery process is:

```text
Worker
  ↓
Load sender configuration
  ↓
Decrypt SMTP credential
  ↓
Create SMTP transport
  ↓
Send message
  ↓
Persist message ID
  ↓
Mark EmailJob as SENT
```

---

# Security

The application uses several security controls:

* Google OAuth
* JWT-based sessions
* HTTP-only cookies
* User-scoped database queries
* Sender ownership validation
* Input validation
* Helmet
* Configured CORS
* Environment-based secrets
* Protected SMTP credentials

Sensitive values should never be committed to Git.

Real credentials should always remain in:

```text
backend/.env
frontend/.env.local
```

and should never be committed.

---

# API

## Health Check

```http
GET /health
```

Example:

```json
{
  "success": true,
  "message": "ReachInbox Scheduler API running"
}
```

---

## Authentication

### Google Login

```http
GET /api/v1/auth/google
```

### Google OAuth Callback

```http
GET /api/v1/auth/google/callback
```

### Current User

```http
GET /api/v1/auth/me
```

### Logout

```http
POST /api/v1/auth/logout
```

---

## Senders

### List Senders

```http
GET /api/v1/senders
```

Returns sender information belonging to the authenticated user.

Sensitive SMTP credentials are not returned.

---

## Email Scheduling

### Schedule Emails

```http
POST /api/v1/emails/schedule
```

Example:

```json
{
  "senderId": "sender-id",
  "recipients": [
    "alice@example.com",
    "bob@example.com"
  ],
  "subject": "ReachInbox Test",
  "body": "<p>Hello from ReachInbox!</p>",
  "scheduledFor": "2026-08-29T08:00:00.000Z",
  "delayBetweenEmailsMs": 2000,
  "hourlyLimit": 200
}
```

---

## Scheduled Emails

```http
GET /api/v1/emails/scheduled
```

Returns pending, queued, and processing emails for the authenticated user.

---

## Sent Emails

```http
GET /api/v1/emails/sent
```

Returns successfully sent emails.

---

## Dashboard Statistics

```http
GET /api/v1/dashboard/stats
```

Example:

```json
{
  "success": true,
  "data": {
    "total": 10,
    "scheduled": 4,
    "sent": 5,
    "failed": 1
  }
}
```

---

# Environment Variables

Create the backend environment file:

```text
backend/.env
```

using:

```text
backend/.env.example
```

Example structure:

```env
NODE_ENV=development
PORT=5000

DATABASE_URL="postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/reachinbox"

REDIS_HOST=127.0.0.1
REDIS_PORT=6379

JWT_SECRET="YOUR_LONG_RANDOM_JWT_SECRET"
AUTH_COOKIE_NAME="reachinbox_session"

GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID"
GOOGLE_CLIENT_SECRET="YOUR_GOOGLE_CLIENT_SECRET"
GOOGLE_CALLBACK_URL="http://localhost:5000/api/v1/auth/google/callback"

SMTP_HOST="smtp.ethereal.email"
SMTP_PORT=587
SMTP_USER="YOUR_ETHEREAL_USERNAME"
SMTP_PASS="YOUR_ETHEREAL_PASSWORD"
SMTP_FROM="YOUR_ETHEREAL_EMAIL"

SMTP_ENCRYPTION_KEY="YOUR_BASE64_32_BYTE_ENCRYPTION_KEY"

WORKER_CONCURRENCY=5
DEFAULT_DELAY_MS=2000
MAX_EMAILS_PER_HOUR=200

FRONTEND_URL="http://localhost:3000"
API_URL="http://localhost:5000"
```

Frontend environment:

```text
frontend/.env.local
```

```env
NEXT_PUBLIC_API_URL="http://localhost:5000/api/v1"
```

Never use real credentials inside `.env.example`.

---

# Local Development

## Prerequisites

Install:

* Node.js 22+
* pnpm
* PostgreSQL
* Docker Desktop

Redis can be run using Docker.

---

## Start Redis

```bash
docker run --name reachinbox-redis \
  -p 6379:6379 \
  -d redis:7-alpine
```

Verify Redis:

```bash
docker exec reachinbox-redis redis-cli ping
```

Expected:

```text
PONG
```

---

## Start PostgreSQL

Create a PostgreSQL database named:

```text
reachinbox
```

Configure its connection string in:

```text
backend/.env
```

Example:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/reachinbox"
```

---

# Backend Setup

```bash
cd backend
pnpm install
pnpm prisma generate
pnpm prisma migrate dev
pnpm dev
```

Backend:

```text
http://localhost:5000
```

Health check:

```text
http://localhost:5000/health
```

---

# Start the Worker

Open a separate terminal:

```bash
cd backend
pnpm worker
```

The worker should report that it has started and connected to Redis.

---

# Frontend Setup

Open another terminal:

```bash
cd frontend
pnpm install
pnpm dev
```

Frontend:

```text
http://localhost:3000
```

---

# User Flow

Once the application is running:

```text
1. Open the frontend
2. Sign in with Google
3. Open Dashboard
4. Open Compose
5. Select a sender
6. Upload a CSV or enter recipients
7. Review valid/invalid/duplicate recipients
8. Enter subject and email body
9. Select a future schedule time
10. Configure delay and hourly limit
11. Click Schedule Emails
12. Open Scheduled
13. Wait for the worker to process the jobs
14. Open Sent
15. Verify the email in Ethereal
```

---

# Testing

## Type Checking

Backend:

```bash
cd backend
pnpm exec tsc --noEmit
```

Frontend:

```bash
cd frontend
pnpm run build
```

---

## Backend Build

```bash
cd backend
pnpm run build
```

---

## Test Suite

```bash
cd backend
pnpm test
```

---

## SMTP Test

```bash
cd backend
pnpm test:smtp
```

---

# Reliability Test

The worker restart scenario can be tested with:

```text
Schedule email
      ↓
EmailJob persisted
      ↓
BullMQ job created
      ↓
Stop worker
      ↓
Scheduled time passes
      ↓
Restart worker
      ↓
Job is recovered
      ↓
Email is sent
```

This verifies that worker restarts do not discard scheduled work.

---

# Rate Limit Test

To test send spacing:

```text
Minimum delay = 2000 ms
```

Schedule multiple recipients for the same sender.

The worker should enforce the minimum delay between sends.

To test the hourly limit:

```text
Hourly limit = 2
```

Schedule more than two eligible emails for the same sender.

Additional jobs should be throttled until the next available quota window.

---

# Idempotency Test

Process the same EmailJob more than once.

Expected behavior:

```text
First processing
      ↓
SENT

Second processing
      ↓
Already SENT
      ↓
Skip
```

The same email must not be delivered twice by the worker.

---

# Retry Test

Simulate a temporary SMTP/network failure.

Expected behavior:

```text
SMTP failure
     ↓
Retryable error
     ↓
BullMQ backoff
     ↓
Retry
```

If all configured attempts fail:

```text
FAILED
```

---

# Security Checklist

Before pushing the project to GitHub:

```text
[ ] backend/.env is not committed
[ ] frontend/.env.local is not committed
[ ] API secrets are not committed
[ ] Database credentials are not committed
[ ] SMTP credentials are not committed
[ ] Google OAuth secrets are not committed
[ ] SMTP credentials are not returned by the API
[ ] .env.example contains placeholders only
```

Verify Git:

```bash
git status
```

Verify environment files are ignored:

```bash
git check-ignore -v backend/.env
git check-ignore -v frontend/.env.local
```

Verify they are not tracked:

```bash
git ls-files backend/.env frontend/.env.local
```

The last command should return nothing.

---

# Docker

The repository contains Docker configuration for the project.

The application has been verified locally using:

```text
Next.js frontend
Express backend
PostgreSQL
Redis
BullMQ worker
SMTP/Ethereal
```

For the most reliable local development setup, follow the local development instructions above.

---

# Design Decisions

## Why PostgreSQL?

PostgreSQL provides durable relational storage for:

* Users
* Senders
* Email jobs
* Delivery state
* Retry information
* Scheduling metadata

---

## Why Redis?

Redis provides fast atomic operations needed for:

* BullMQ
* Hourly rate limiting
* Send spacing
* Delayed job coordination

---

## Why BullMQ?

BullMQ provides:

* Delayed jobs
* Worker concurrency
* Retry handling
* Redis-backed job persistence
* Job lifecycle management

---

## Why Asynchronous Workers?

Email delivery should not block an HTTP request.

The API persists the work and returns quickly while the worker processes the email independently.

This separation makes the system easier to scale.

---

## Why Sender-Level Rate Limiting?

Sending restrictions are associated with the sending identity.

Different senders can therefore have independent limits and send intervals.

---

## Why PostgreSQL + Redis?

The system separates durable business state from queueing infrastructure.

```text
PostgreSQL
    ↓
Source of truth

Redis / BullMQ
    ↓
Asynchronous execution
```

This allows the worker to restart without losing the persisted application state.

---

# Scalability

The architecture allows the worker layer to scale independently.

For example:

```text
              Redis
                │
       ┌────────┼────────┐
       ▼        ▼        ▼
   Worker 1  Worker 2  Worker 3
```

All workers can consume from the same BullMQ queue while database state transitions and sender-level rate limits prevent duplicate or excessive sends.

---

# Error Handling

The system distinguishes between:

### Validation Errors

Examples:

* Missing sender
* Invalid recipients
* Empty subject
* Empty body
* Invalid schedule time

These are rejected before scheduling.

### Throttling

Examples:

* Hourly limit reached
* Minimum send spacing not satisfied

These are rescheduled rather than marked as failed.

### Delivery Errors

Examples:

* SMTP connection failure
* SMTP timeout
* Permanent SMTP rejection

These are handled using retry and failure logic.

---

# Production Considerations

This project is designed as an assignment/demo system.

For production deployment, additional infrastructure would be recommended:

* HTTPS
* Managed PostgreSQL
* Managed Redis
* Production secret management
* Production Google OAuth configuration
* Production SMTP provider
* Centralized logging
* Monitoring
* Metrics
* Alerting
* Worker autoscaling
* Database backups
* Distributed tracing

---

# Known Development Constraint

Ethereal SMTP is used for development and testing.

Messages sent through Ethereal are intended for testing rather than production delivery.

A production deployment should use a proper transactional email provider.

---

# Submission Checklist

```text
[ ] Google login works
[ ] Dashboard loads
[ ] Sender is available
[ ] Compose page works
[ ] CSV upload works
[ ] Invalid recipients are detected
[ ] Duplicate recipients are detected
[ ] Scheduling works
[ ] Scheduled page displays jobs
[ ] Worker processes jobs
[ ] Redis is connected
[ ] BullMQ jobs are created
[ ] Rate limits are enforced
[ ] SMTP delivery works
[ ] Sent page displays sent emails
[ ] Dashboard statistics update
[ ] Worker restart recovery works
[ ] TypeScript checks pass
[ ] Backend build passes
[ ] Frontend build passes
[ ] Tests pass
[ ] Real credentials are not committed
[ ] .env.example files are present
[ ] README is complete
```

---

# Development Commands

## Backend

```bash
pnpm dev
pnpm worker
pnpm build
pnpm test
pnpm test:smtp
pnpm exec tsc --noEmit
pnpm prisma generate
pnpm prisma migrate dev
pnpm prisma studio
```

## Frontend

```bash
pnpm dev
pnpm build
```

---

# Final Architecture Summary

```text
                    USER
                     │
                     ▼
              ┌─────────────┐
              │   Next.js   │
              │  Frontend   │
              └──────┬──────┘
                     │
                     ▼
              ┌─────────────┐
              │   Express   │
              │     API     │
              └──────┬──────┘
                     │
          ┌──────────┴──────────┐
          │                     │
          ▼                     ▼
   ┌─────────────┐       ┌─────────────┐
   │ PostgreSQL  │       │    Redis    │
   │             │       │             │
   │ Users       │       │ BullMQ      │
   │ Senders     │       │ Rate Limits │
   │ EmailJobs   │       │ Delays      │
   └─────────────┘       └──────┬──────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │ Email Worker    │
                       │                 │
                       │ Concurrency     │
                       │ Rate limiting   │
                       │ Idempotency     │
                       │ Retries         │
                       │ SMTP            │
                       └────────┬────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │ Ethereal / SMTP │
                       └─────────────────┘
```

---

# Project Status

The core ReachInbox email scheduling system is implemented and verified locally.

Implemented functionality includes:

* Google OAuth authentication
* Session management
* Sender management
* CSV recipient handling
* Email scheduling
* PostgreSQL persistence
* Redis-backed rate limiting
* BullMQ delayed jobs
* Concurrent workers
* Idempotent processing
* Retry handling
* SMTP delivery
* Scheduled email tracking
* Sent email tracking
* Dashboard statistics
* Worker restart recovery
* Frontend/backend integration

---

# Author

**Rishitha Rasineni**

Computer Science & Engineering

Bengaluru, India

```