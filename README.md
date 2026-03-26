# Invoice Manager

A self-hosted invoice management app with live preview, PDF export, templates, and custom fonts.

## Quick Start

```bash
git clone <repo-url> && cd invoice_manager
docker compose up -d
```

Open [http://localhost](http://localhost). That's it -- Postgres, backend, and frontend all start automatically.

To seed default fonts:

```bash
docker compose exec backend node src/db/seed.js
```

## Development

### Docker (full stack)

Everything in containers with hot reload:

```bash
docker compose -f docker-compose.dev.yml up -d
```

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend: [http://localhost:3000](http://localhost:3000)
- Source changes in `backend/src/` and `frontend/src/` reload automatically.

### Native (database in Docker)

Postgres in Docker, app runs natively for faster iteration:

```bash
# Start Postgres
docker compose -f docker-compose.dev.yml up -d postgres

# Backend (port 3000)
cd backend
cp .env.example .env
npm install
npm run db:migrate
npm run db:seed
npm run dev

# Frontend (port 5173)
cd frontend
npm install
npm run dev
```

### Fully native (no Docker)

Install PostgreSQL 18 locally and create the database:

```bash
createdb -U postgres invoice_manager
```

Then configure and run:

```bash
cd backend
cp .env.example .env
# Edit .env with your Postgres credentials
npm install && npm run db:migrate && npm run db:seed && npm run dev

# In another terminal
cd frontend && npm install && npm run dev
```

## Tech Stack

- **Frontend**: React 19, Vite 7, Tailwind CSS 4, shadcn
- **Backend**: Express 5, Drizzle ORM, PostgreSQL 18, Puppeteer
