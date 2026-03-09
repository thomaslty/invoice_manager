# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Database (must be running first)
docker compose -f docker-compose.postgres.yml up -d

# Backend (port 3000)
cd backend && npm run dev

# Frontend (port 5173, proxies /api to backend)
cd frontend && npm run dev

# Database migrations (NEVER write SQL by hand)
cd backend && npm run db:generate   # generate migration from schema changes
cd backend && npm run db:migrate    # apply migrations
cd backend && npm run db:seed       # seed default fonts

# Frontend
cd frontend && npm run build        # production build
cd frontend && npm run lint         # ESLint
```

## Git Rules

- Never add `Co-Authored-By` lines to commit messages
- Use `/commit-clean` for commits

## Package Rules

- **Frontend**: Use shadcn for all UI components. Do NOT install any third-party UI library. If a package is truly needed, ask the user for approval first — never install without explicit permission.
- **Backend**: Same rule — ask before adding new dependencies.
- shadcn config: style `radix-nova`, JSX (not TSX), lucide icons, `@/` path alias

## Architecture

**Monorepo** with independent `frontend/` and `backend/` packages (no npm workspaces, no root package.json).

### Backend: Express 5 + Drizzle ORM + PostgreSQL 18

Layered architecture: **Routes → Controllers → Services → DB**

- `backend/src/db/schema.js` — Drizzle schema (single source of truth for DB structure)
- `backend/src/templates/invoice-html.js` — shared HTML template for both preview and PDF generation
- `backend/src/services/pdfService.js` — Puppeteer (singleton browser instance, new page per PDF)
- File storage: signatures in `backend/uploads/`, local fonts in `backend/fonts/`

**Database migration rules**: Always modify `schema.js` and run `drizzle-kit generate` + `drizzle-kit migrate`. Never write raw SQL migration files. Drizzle Kit generates them from schema diffs.

**Extracted columns pattern**: When saving/updating invoices, `ref_no`, `client_name`, `date`, `total_amount` are extracted from `json_data` into indexed columns for search/sort/filter. The full invoice data lives in a `jsonb` column.

### Frontend: React 19 + Vite 7 + Tailwind CSS 4 + shadcn

- JavaScript only (no TypeScript)
- `frontend/src/lib/api.js` — API client for all backend endpoints
- `frontend/src/hooks/useInvoiceForm.js` — state management for the invoice editor
- Vite proxy: `/api`, `/uploads`, `/fonts` → `http://localhost:3000`

### Core Data Flow: Preview & PDF

Single source of truth: `backend/src/templates/invoice-html.js` renders a self-contained HTML string.

- **Live preview**: Frontend debounces edits (300ms), POSTs to `/api/preview`, gets HTML, sets iframe `srcdoc`
- **PDF download**: Backend loads invoice, renders same HTML, Puppeteer prints to PDF (A4, zero margins)

Both use the identical HTML template function — this guarantees preview matches PDF output.

### Data Model

Three core concepts sharing the same JSON schema (`json_data` column):
- **Template** — reusable skeleton (layout + defaults, no real data)
- **Invoice** — real invoice with actual data
- **Invoice Snapshot** — full copy of an invoice for cloning/renewal

The JSON shape has 7 toggleable sections: `header`, `metadata`, `items`, `paymentMethod`, `terms`, `signature`, `footer`. See `docs/plans/2026-03-09-invoice-manager-design.md` for the full schema.

FK ON DELETE policies: snapshots cascade on invoice delete, template_id and font_id set null on delete.
