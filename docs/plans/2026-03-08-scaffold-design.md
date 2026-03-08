# Invoice Manager — Scaffold Design

## Overview

Invoice management app: create, edit, download PDF, and history of previous invoices.

## Stack

- **Frontend**: Vite + React + JavaScript (no TS) + Tailwind CSS + React Router
- **Backend**: Express.js + JavaScript (no TS)
- **Database**: PostgreSQL 18 in Docker
- **ORM/Migrations**: Drizzle ORM + Drizzle Kit (generated migrations only, no hand-written SQL)
- **PDF**: Puppeteer (HTML to PDF)
- **Package manager**: npm with workspaces

## Project Structure

```
invoice_manager/
├── package.json                  # root, npm workspaces
├── docker-compose.postgres.yml   # Postgres only
├── docker-compose.yml            # full stack (placeholder)
├── .gitignore
├── frontend/                     # Vite + React + Tailwind (existing)
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   └── ...
│   ├── vite.config.js
│   └── package.json
├── backend/
│   ├── package.json
│   ├── src/
│   │   ├── index.js              # Express entry point
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   └── db/
│   │       ├── index.js          # Drizzle client
│   │       └── schema.js         # Drizzle schema (placeholder)
│   ├── drizzle.config.js
│   └── .env.example
└── template/                     # real invoice PDFs (gitignored)
```

## Key Decisions

- Monorepo with single root package.json and npm workspaces
- Drizzle Kit for migrations: `drizzle-kit generate` + `drizzle-kit migrate` only
- docker-compose.postgres.yml for DB, docker-compose.yml stub for full stack later
- Scaffold only — no actual features, just skeleton
