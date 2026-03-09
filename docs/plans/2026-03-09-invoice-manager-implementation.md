# Invoice Manager Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an invoice manager with template-based creation, split-screen editor with live PDF preview, snapshot cloning, and font management.

**Architecture:** JSON-blob storage in Postgres (indexed columns for search/sort/filter). Shared HTML template function for both live preview and Puppeteer PDF generation. React frontend with React Router, shadcn UI components.

**Tech Stack:** React 19, Vite 7, Tailwind CSS 4, shadcn, Express 5, Drizzle ORM, PostgreSQL 18, Puppeteer

---

## Phase 1: Database Foundation

### Task 1: Define Drizzle Schema

**Files:**
- Modify: `backend/src/db/schema.js`

**Step 1: Write the schema**

Replace the placeholder in `backend/src/db/schema.js` with all four tables:

```js
import { pgTable, serial, varchar, text, timestamp, integer, numeric, date, jsonb } from 'drizzle-orm/pg-core';

export const fonts = pgTable('fonts', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  family: varchar('family', { length: 255 }).notNull(),
  source: varchar('source', { length: 20 }).notNull(), // 'system' | 'remote' | 'local'
  filePath: text('file_path'),
  url: text('url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const templates = pgTable('templates', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  fontId: integer('font_id').references(() => fonts.id),
  jsonData: jsonb('json_data').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const invoices = pgTable('invoices', {
  id: serial('id').primaryKey(),
  templateId: integer('template_id').references(() => templates.id),
  fontId: integer('font_id').references(() => fonts.id),
  refNo: varchar('ref_no', { length: 100 }),
  clientName: varchar('client_name', { length: 255 }),
  date: date('date'),
  totalAmount: numeric('total_amount', { precision: 12, scale: 2 }),
  jsonData: jsonb('json_data').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const invoiceSnapshots = pgTable('invoice_snapshots', {
  id: serial('id').primaryKey(),
  invoiceId: integer('invoice_id').references(() => invoices.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  fontId: integer('font_id').references(() => fonts.id),
  jsonData: jsonb('json_data').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

**Step 2: Generate and run migration**

```bash
cd backend
npm run db:generate
npm run db:migrate
```

**Step 3: Verify tables exist**

Use psql or the Postgres MCP to confirm all four tables were created with correct columns.

**Step 4: Commit**

```bash
git add backend/src/db/schema.js backend/drizzle/
git commit -m "feat: define Drizzle schema for fonts, templates, invoices, snapshots"
```

---

### Task 2: Seed Default Fonts

**Files:**
- Create: `backend/src/db/seed.js`
- Modify: `backend/package.json` (add seed script)

**Step 1: Create seed script**

Create `backend/src/db/seed.js`:

```js
import 'dotenv/config';
import { db } from './index.js';
import { fonts } from './schema.js';

const defaultFonts = [
  { name: 'Geist', family: "'Geist Variable', sans-serif", source: 'system' },
  { name: 'Arial', family: 'Arial, Helvetica, sans-serif', source: 'system' },
  { name: 'Times New Roman', family: "'Times New Roman', Times, serif", source: 'system' },
  { name: 'Georgia', family: 'Georgia, serif', source: 'system' },
  { name: 'Courier New', family: "'Courier New', Courier, monospace", source: 'system' },
];

async function seed() {
  console.log('Seeding default fonts...');
  for (const font of defaultFonts) {
    await db.insert(fonts).values(font).onConflictDoNothing();
  }
  console.log('Done.');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

**Step 2: Add seed script to package.json**

Add to `backend/package.json` scripts:
```json
"db:seed": "node src/db/seed.js"
```

**Step 3: Run seed**

```bash
cd backend
npm run db:seed
```

**Step 4: Verify fonts exist in DB**

Query the fonts table to confirm 5 rows.

**Step 5: Commit**

```bash
git add backend/src/db/seed.js backend/package.json
git commit -m "feat: add seed script with default system fonts"
```

---

### Task 3: Backend Route Mounting + CORS + Static Files

**Files:**
- Modify: `backend/src/index.js`
- Modify: `backend/src/routes/index.js`
- Modify: `backend/package.json` (add cors, multer)

**Step 1: Install cors and multer**

```bash
cd backend
npm install cors multer
```

`cors` is needed for frontend-to-backend requests. `multer` is needed for file uploads (fonts, signatures).

**Step 2: Update Express entry point**

Modify `backend/src/index.js`:

```js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import router from './routes/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/fonts', express.static(path.join(__dirname, '../fonts')));

// API routes
app.use('/api', router);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

**Step 3: Create directories**

```bash
mkdir -p backend/uploads backend/fonts
touch backend/uploads/.gitkeep backend/fonts/.gitkeep
```

**Step 4: Add uploads and fonts to .gitignore**

Add to root `.gitignore`:
```
backend/uploads/*
!backend/uploads/.gitkeep
backend/fonts/*
!backend/fonts/.gitkeep
```

**Step 5: Verify server starts**

```bash
cd backend && npm run dev
# In another terminal:
curl http://localhost:3000/api
# Should return 404 or empty (no routes yet)
```

**Step 6: Commit**

```bash
git add backend/ .gitignore
git commit -m "feat: configure CORS, static file serving, route mounting"
```

---

## Phase 2: Backend APIs

### Task 4: Font CRUD + Upload API

**Files:**
- Create: `backend/src/routes/fonts.js`
- Create: `backend/src/controllers/fontsController.js`
- Create: `backend/src/services/fontService.js`
- Modify: `backend/src/routes/index.js`

**Step 1: Create font service**

Create `backend/src/services/fontService.js`:

```js
import { db } from '../db/index.js';
import { fonts } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONTS_DIR = path.join(__dirname, '../../fonts');

export async function listFonts() {
  return db.select().from(fonts).orderBy(fonts.name);
}

export async function getFontById(id) {
  const [font] = await db.select().from(fonts).where(eq(fonts.id, id));
  return font;
}

export async function createFont(data) {
  const [font] = await db.insert(fonts).values(data).returning();
  return font;
}

export async function createFontWithFile(file, name, family) {
  const filename = `${Date.now()}-${file.originalname}`;
  const filePath = path.join(FONTS_DIR, filename);
  await fs.writeFile(filePath, file.buffer);

  const [font] = await db.insert(fonts).values({
    name,
    family,
    source: 'local',
    filePath: `/fonts/${filename}`,
  }).returning();
  return font;
}

export async function deleteFont(id) {
  const font = await getFontById(id);
  if (!font) return null;

  // Delete local file if exists
  if (font.source === 'local' && font.filePath) {
    const fullPath = path.join(__dirname, '../..', font.filePath);
    await fs.unlink(fullPath).catch(() => {});
  }

  await db.delete(fonts).where(eq(fonts.id, id));
  return font;
}
```

**Step 2: Create font controller**

Create `backend/src/controllers/fontsController.js`:

```js
import * as fontService from '../services/fontService.js';

export async function list(req, res) {
  const fonts = await fontService.listFonts();
  res.json(fonts);
}

export async function getById(req, res) {
  const font = await fontService.getFontById(Number(req.params.id));
  if (!font) return res.status(404).json({ error: 'Font not found' });
  res.json(font);
}

export async function create(req, res) {
  const { name, family, source, url } = req.body;
  if (!name || !family || !source) {
    return res.status(400).json({ error: 'name, family, and source are required' });
  }
  const font = await fontService.createFont({ name, family, source, url });
  res.status(201).json(font);
}

export async function upload(req, res) {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const { name, family } = req.body;
  if (!name || !family) {
    return res.status(400).json({ error: 'name and family are required' });
  }
  const font = await fontService.createFontWithFile(req.file, name, family);
  res.status(201).json(font);
}

export async function remove(req, res) {
  const font = await fontService.deleteFont(Number(req.params.id));
  if (!font) return res.status(404).json({ error: 'Font not found' });
  res.json({ success: true });
}
```

**Step 3: Create font routes**

Create `backend/src/routes/fonts.js`:

```js
import { Router } from 'express';
import multer from 'multer';
import * as fontsController from '../controllers/fontsController.js';

const router = Router();
const uploadMiddleware = multer({ storage: multer.memoryStorage() });

router.get('/', fontsController.list);
router.get('/:id', fontsController.getById);
router.post('/', fontsController.create);
router.post('/upload', uploadMiddleware.single('file'), fontsController.upload);
router.delete('/:id', fontsController.remove);

export default router;
```

**Step 4: Mount in routes/index.js**

Update `backend/src/routes/index.js`:

```js
import { Router } from 'express';
import fontsRouter from './fonts.js';

const router = Router();

router.use('/fonts', fontsRouter);

export default router;
```

**Step 5: Verify with curl**

```bash
curl http://localhost:3000/api/fonts
# Should return array of seeded fonts
```

**Step 6: Commit**

```bash
git add backend/src/
git commit -m "feat: add font CRUD and upload API"
```

---

### Task 5: Template CRUD API

**Files:**
- Create: `backend/src/routes/templates.js`
- Create: `backend/src/controllers/templatesController.js`
- Create: `backend/src/services/templateService.js`
- Modify: `backend/src/routes/index.js`

**Step 1: Create template service**

Create `backend/src/services/templateService.js`:

```js
import { db } from '../db/index.js';
import { templates } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export async function listTemplates() {
  return db.select().from(templates).orderBy(templates.updatedAt);
}

export async function getTemplateById(id) {
  const [template] = await db.select().from(templates).where(eq(templates.id, id));
  return template;
}

export async function createTemplate(data) {
  const [template] = await db.insert(templates).values({
    name: data.name,
    fontId: data.fontId,
    jsonData: data.jsonData,
  }).returning();
  return template;
}

export async function updateTemplate(id, data) {
  const [template] = await db.update(templates)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(templates.id, id))
    .returning();
  return template;
}

export async function deleteTemplate(id) {
  const [template] = await db.delete(templates).where(eq(templates.id, id)).returning();
  return template;
}
```

**Step 2: Create template controller**

Create `backend/src/controllers/templatesController.js`:

```js
import * as templateService from '../services/templateService.js';

export async function list(req, res) {
  const templates = await templateService.listTemplates();
  res.json(templates);
}

export async function getById(req, res) {
  const template = await templateService.getTemplateById(Number(req.params.id));
  if (!template) return res.status(404).json({ error: 'Template not found' });
  res.json(template);
}

export async function create(req, res) {
  const { name, fontId, jsonData } = req.body;
  if (!name || !jsonData) {
    return res.status(400).json({ error: 'name and jsonData are required' });
  }
  const template = await templateService.createTemplate({ name, fontId, jsonData });
  res.status(201).json(template);
}

export async function update(req, res) {
  const template = await templateService.updateTemplate(Number(req.params.id), req.body);
  if (!template) return res.status(404).json({ error: 'Template not found' });
  res.json(template);
}

export async function remove(req, res) {
  const template = await templateService.deleteTemplate(Number(req.params.id));
  if (!template) return res.status(404).json({ error: 'Template not found' });
  res.json({ success: true });
}
```

**Step 3: Create template routes**

Create `backend/src/routes/templates.js`:

```js
import { Router } from 'express';
import * as templatesController from '../controllers/templatesController.js';

const router = Router();

router.get('/', templatesController.list);
router.get('/:id', templatesController.getById);
router.post('/', templatesController.create);
router.put('/:id', templatesController.update);
router.delete('/:id', templatesController.remove);

export default router;
```

**Step 4: Mount in routes/index.js**

Add to `backend/src/routes/index.js`:
```js
import templatesRouter from './templates.js';
router.use('/templates', templatesRouter);
```

**Step 5: Verify with curl**

```bash
# Create a template
curl -X POST http://localhost:3000/api/templates \
  -H 'Content-Type: application/json' \
  -d '{"name":"Default Invoice","fontId":1,"jsonData":{"sections":{"header":{"visible":true,"title":"INVOICE"}}}}'

# List templates
curl http://localhost:3000/api/templates
```

**Step 6: Commit**

```bash
git add backend/src/
git commit -m "feat: add template CRUD API"
```

---

### Task 6: Invoice CRUD API with Search/Sort/Filter

**Files:**
- Create: `backend/src/routes/invoices.js`
- Create: `backend/src/controllers/invoicesController.js`
- Create: `backend/src/services/invoiceService.js`
- Modify: `backend/src/routes/index.js`

**Step 1: Create invoice service**

Create `backend/src/services/invoiceService.js`:

The service must:
- Extract `refNo`, `clientName`, `date`, `totalAmount` from jsonData on create/update
- Support search across `refNo` and `clientName`
- Support sort by any indexed column
- Support date range filtering

```js
import { db } from '../db/index.js';
import { invoices } from '../db/schema.js';
import { eq, ilike, or, and, gte, lte, desc, asc } from 'drizzle-orm';

function extractFields(jsonData) {
  const meta = jsonData?.sections?.metadata?.fields || {};
  const categories = jsonData?.sections?.items?.categories || [];
  let grandTotal = 0;
  for (const cat of categories) {
    for (const item of cat.items || []) {
      grandTotal += Number(item.total) || 0;
    }
  }
  return {
    refNo: meta.refNo || null,
    clientName: meta.client || null,
    date: meta.date || null,
    totalAmount: String(grandTotal),
  };
}

export async function listInvoices({ search, sortBy, sortOrder, dateFrom, dateTo } = {}) {
  const conditions = [];

  if (search) {
    const pattern = `%${search}%`;
    conditions.push(or(
      ilike(invoices.refNo, pattern),
      ilike(invoices.clientName, pattern)
    ));
  }
  if (dateFrom) conditions.push(gte(invoices.date, dateFrom));
  if (dateTo) conditions.push(lte(invoices.date, dateTo));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const sortColumn = {
    date: invoices.date,
    client_name: invoices.clientName,
    total_amount: invoices.totalAmount,
    ref_no: invoices.refNo,
    created_at: invoices.createdAt,
  }[sortBy] || invoices.createdAt;

  const orderFn = sortOrder === 'asc' ? asc : desc;

  return db.select().from(invoices).where(where).orderBy(orderFn(sortColumn));
}

export async function getInvoiceById(id) {
  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
  return invoice;
}

export async function createInvoice(data) {
  const extracted = extractFields(data.jsonData);
  const [invoice] = await db.insert(invoices).values({
    templateId: data.templateId || null,
    fontId: data.fontId,
    jsonData: data.jsonData,
    ...extracted,
  }).returning();
  return invoice;
}

export async function updateInvoice(id, data) {
  const updates = { ...data, updatedAt: new Date() };
  if (data.jsonData) {
    Object.assign(updates, extractFields(data.jsonData));
  }
  const [invoice] = await db.update(invoices)
    .set(updates)
    .where(eq(invoices.id, id))
    .returning();
  return invoice;
}

export async function deleteInvoice(id) {
  const [invoice] = await db.delete(invoices).where(eq(invoices.id, id)).returning();
  return invoice;
}
```

**Step 2: Create invoice controller**

Create `backend/src/controllers/invoicesController.js`:

```js
import * as invoiceService from '../services/invoiceService.js';

export async function list(req, res) {
  const { search, sort_by, sort_order, date_from, date_to } = req.query;
  const invoices = await invoiceService.listInvoices({
    search,
    sortBy: sort_by,
    sortOrder: sort_order,
    dateFrom: date_from,
    dateTo: date_to,
  });
  res.json(invoices);
}

export async function getById(req, res) {
  const invoice = await invoiceService.getInvoiceById(Number(req.params.id));
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
  res.json(invoice);
}

export async function create(req, res) {
  const { templateId, fontId, jsonData } = req.body;
  if (!jsonData) return res.status(400).json({ error: 'jsonData is required' });
  const invoice = await invoiceService.createInvoice({ templateId, fontId, jsonData });
  res.status(201).json(invoice);
}

export async function update(req, res) {
  const invoice = await invoiceService.updateInvoice(Number(req.params.id), req.body);
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
  res.json(invoice);
}

export async function remove(req, res) {
  const invoice = await invoiceService.deleteInvoice(Number(req.params.id));
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
  res.json({ success: true });
}
```

**Step 3: Create invoice routes**

Create `backend/src/routes/invoices.js`:

```js
import { Router } from 'express';
import * as invoicesController from '../controllers/invoicesController.js';

const router = Router();

router.get('/', invoicesController.list);
router.get('/:id', invoicesController.getById);
router.post('/', invoicesController.create);
router.put('/:id', invoicesController.update);
router.delete('/:id', invoicesController.remove);

export default router;
```

**Step 4: Mount in routes/index.js**

Add to `backend/src/routes/index.js`:
```js
import invoicesRouter from './invoices.js';
router.use('/invoices', invoicesRouter);
```

**Step 5: Verify with curl**

```bash
# Create invoice
curl -X POST http://localhost:3000/api/invoices \
  -H 'Content-Type: application/json' \
  -d '{"fontId":1,"jsonData":{"sections":{"header":{"visible":true,"title":"INVOICE"},"metadata":{"visible":true,"fields":{"date":"2022-09-30","refNo":"20220930","client":"Peak Capital","contactPerson":"Ryan","jobTitle":"Web Design"}},"items":{"visible":true,"currency":"HK$","categories":[{"name":"","items":[{"no":1,"description":"Website Design","qty":1,"total":2500}]}]}}}}'

# Search
curl "http://localhost:3000/api/invoices?search=Peak"

# Sort
curl "http://localhost:3000/api/invoices?sort_by=date&sort_order=desc"
```

**Step 6: Commit**

```bash
git add backend/src/
git commit -m "feat: add invoice CRUD API with search, sort, filter"
```

---

### Task 7: Invoice Snapshots API

**Files:**
- Create: `backend/src/routes/snapshots.js`
- Create: `backend/src/controllers/snapshotsController.js`
- Create: `backend/src/services/snapshotService.js`
- Modify: `backend/src/routes/index.js`

**Step 1: Create snapshot service**

Create `backend/src/services/snapshotService.js`:

```js
import { db } from '../db/index.js';
import { invoiceSnapshots, invoices } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export async function listByInvoice(invoiceId) {
  return db.select().from(invoiceSnapshots)
    .where(eq(invoiceSnapshots.invoiceId, invoiceId))
    .orderBy(invoiceSnapshots.createdAt);
}

export async function getSnapshotById(id) {
  const [snapshot] = await db.select().from(invoiceSnapshots).where(eq(invoiceSnapshots.id, id));
  return snapshot;
}

export async function createSnapshot(invoiceId, name) {
  // Load the current invoice
  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, invoiceId));
  if (!invoice) return null;

  const [snapshot] = await db.insert(invoiceSnapshots).values({
    invoiceId,
    name,
    fontId: invoice.fontId,
    jsonData: invoice.jsonData,
  }).returning();
  return snapshot;
}

export async function deleteSnapshot(id) {
  const [snapshot] = await db.delete(invoiceSnapshots).where(eq(invoiceSnapshots.id, id)).returning();
  return snapshot;
}

export async function cloneSnapshot(snapshotId) {
  const snapshot = await getSnapshotById(snapshotId);
  if (!snapshot) return null;

  const [invoice] = await db.insert(invoices).values({
    fontId: snapshot.fontId,
    jsonData: snapshot.jsonData,
    refNo: snapshot.jsonData?.sections?.metadata?.fields?.refNo || null,
    clientName: snapshot.jsonData?.sections?.metadata?.fields?.client || null,
  }).returning();
  return invoice;
}
```

**Step 2: Create snapshot controller**

Create `backend/src/controllers/snapshotsController.js`:

```js
import * as snapshotService from '../services/snapshotService.js';

export async function listByInvoice(req, res) {
  const snapshots = await snapshotService.listByInvoice(Number(req.params.invoiceId));
  res.json(snapshots);
}

export async function getById(req, res) {
  const snapshot = await snapshotService.getSnapshotById(Number(req.params.id));
  if (!snapshot) return res.status(404).json({ error: 'Snapshot not found' });
  res.json(snapshot);
}

export async function create(req, res) {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const snapshot = await snapshotService.createSnapshot(Number(req.params.invoiceId), name);
  if (!snapshot) return res.status(404).json({ error: 'Invoice not found' });
  res.status(201).json(snapshot);
}

export async function remove(req, res) {
  const snapshot = await snapshotService.deleteSnapshot(Number(req.params.id));
  if (!snapshot) return res.status(404).json({ error: 'Snapshot not found' });
  res.json({ success: true });
}

export async function clone(req, res) {
  const invoice = await snapshotService.cloneSnapshot(Number(req.params.id));
  if (!invoice) return res.status(404).json({ error: 'Snapshot not found' });
  res.status(201).json(invoice);
}
```

**Step 3: Create snapshot routes**

Create `backend/src/routes/snapshots.js`:

```js
import { Router } from 'express';
import * as snapshotsController from '../controllers/snapshotsController.js';

const router = Router();

// Nested under /invoices/:invoiceId/snapshots
router.get('/invoices/:invoiceId/snapshots', snapshotsController.listByInvoice);
router.post('/invoices/:invoiceId/snapshots', snapshotsController.create);

// Direct snapshot access
router.get('/snapshots/:id', snapshotsController.getById);
router.delete('/snapshots/:id', snapshotsController.remove);
router.post('/snapshots/:id/clone', snapshotsController.clone);

export default router;
```

**Step 4: Mount in routes/index.js**

Add to `backend/src/routes/index.js`:
```js
import snapshotsRouter from './snapshots.js';
router.use('/', snapshotsRouter);
```

**Step 5: Verify with curl**

```bash
# Create snapshot from invoice 1
curl -X POST http://localhost:3000/api/invoices/1/snapshots \
  -H 'Content-Type: application/json' \
  -d '{"name":"Q3 2022 Backup"}'

# Clone snapshot into new invoice
curl -X POST http://localhost:3000/api/snapshots/1/clone
```

**Step 6: Commit**

```bash
git add backend/src/
git commit -m "feat: add invoice snapshot API with clone support"
```

---

### Task 8: Shared HTML Invoice Template

**Files:**
- Create: `backend/src/templates/invoice-html.js`

This is the single source of truth for both preview and PDF rendering.

**Step 1: Create the HTML template function**

Create `backend/src/templates/invoice-html.js`:

This function takes `{ jsonData, fontInfo, baseUrl }` and returns a complete self-contained HTML string with inline CSS that matches the reference invoice PDF:
- Light gray left sidebar accent
- Teal accent line on header
- Clean typography
- A4 page dimensions (210mm x 297mm)
- Sections only rendered if `visible: true`
- Category groups with subtotals
- Grand total
- Signature with image
- Footer with horizontal rule

The HTML must be fully self-contained (no external dependencies except font loading) so Puppeteer can render it.

Key structure:
```js
export function renderInvoiceHtml({ jsonData, fontInfo, baseUrl = '' }) {
  const s = jsonData?.sections || {};
  // ... build HTML string with inline CSS
  // Font loading: @font-face with fontInfo
  // Each section checks visible flag
  // Items table with category groups and subtotals
  // Return complete <!DOCTYPE html> string
}
```

Reference the PDF sample for exact layout: teal accent `#2d7d7d`, gray sidebar `#f0f0f0`, clean spacing, A4 proportions.

**Step 2: Verify by calling function and inspecting output**

```bash
cd backend
node -e "
import { renderInvoiceHtml } from './src/templates/invoice-html.js';
const html = renderInvoiceHtml({
  jsonData: { sections: { header: { visible: true, title: 'INVOICE' } } },
  fontInfo: { family: 'Arial' }
});
console.log(html.substring(0, 200));
"
```

**Step 3: Commit**

```bash
git add backend/src/templates/
git commit -m "feat: add shared HTML invoice template for preview and PDF"
```

---

### Task 9: Preview Endpoint

**Files:**
- Create: `backend/src/routes/preview.js`
- Create: `backend/src/controllers/previewController.js`
- Create: `backend/src/services/previewService.js`
- Modify: `backend/src/routes/index.js`

**Step 1: Create preview service**

Create `backend/src/services/previewService.js`:

```js
import { renderInvoiceHtml } from '../templates/invoice-html.js';
import { getFontById } from './fontService.js';

export async function generatePreviewHtml(jsonData, fontId, baseUrl) {
  let fontInfo = { family: 'Arial, sans-serif' };
  if (fontId) {
    const font = await getFontById(fontId);
    if (font) {
      fontInfo = {
        family: font.family,
        source: font.source,
        filePath: font.filePath,
        url: font.url,
      };
    }
  }
  return renderInvoiceHtml({ jsonData, fontInfo, baseUrl });
}
```

**Step 2: Create preview controller**

Create `backend/src/controllers/previewController.js`:

```js
import * as previewService from '../services/previewService.js';

export async function preview(req, res) {
  const { jsonData, fontId } = req.body;
  if (!jsonData) return res.status(400).json({ error: 'jsonData is required' });
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const html = await previewService.generatePreviewHtml(jsonData, fontId, baseUrl);
  res.type('html').send(html);
}
```

**Step 3: Create preview route and mount**

Create `backend/src/routes/preview.js`:

```js
import { Router } from 'express';
import * as previewController from '../controllers/previewController.js';

const router = Router();
router.post('/', previewController.preview);
export default router;
```

Mount in `backend/src/routes/index.js`:
```js
import previewRouter from './preview.js';
router.use('/preview', previewRouter);
```

**Step 4: Verify**

```bash
curl -X POST http://localhost:3000/api/preview \
  -H 'Content-Type: application/json' \
  -d '{"fontId":1,"jsonData":{"sections":{"header":{"visible":true,"title":"INVOICE"}}}}' \
  -o preview.html
# Open preview.html in browser to check rendering
```

**Step 5: Commit**

```bash
git add backend/src/
git commit -m "feat: add preview endpoint returning rendered HTML"
```

---

### Task 10: PDF Generation with Puppeteer

**Files:**
- Create: `backend/src/services/pdfService.js`
- Modify: `backend/src/routes/invoices.js`
- Modify: `backend/src/controllers/invoicesController.js`

**Step 1: Create PDF service**

Create `backend/src/services/pdfService.js`:

```js
import puppeteer from 'puppeteer';

let browser = null;

async function getBrowser() {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }
  return browser;
}

export async function generatePdf(html) {
  const b = await getBrowser();
  const page = await b.newPage();
  try {
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
    });
    return pdf;
  } finally {
    await page.close();
  }
}
```

**Step 2: Add PDF download endpoint to invoice controller**

Add to `backend/src/controllers/invoicesController.js`:

```js
import * as pdfService from '../services/pdfService.js';
import * as previewService from '../services/previewService.js';

export async function downloadPdf(req, res) {
  const invoice = await invoiceService.getInvoiceById(Number(req.params.id));
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const html = await previewService.generatePreviewHtml(invoice.jsonData, invoice.fontId, baseUrl);
  const pdfBuffer = await pdfService.generatePdf(html);

  const filename = `invoice-${invoice.refNo || invoice.id}.pdf`;
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${filename}"`,
  });
  res.send(pdfBuffer);
}
```

**Step 3: Add route**

Add to `backend/src/routes/invoices.js`:
```js
router.get('/:id/pdf', invoicesController.downloadPdf);
```

**Step 4: Verify**

```bash
curl http://localhost:3000/api/invoices/1/pdf -o test-invoice.pdf
# Open test-invoice.pdf to verify it matches the preview
```

**Step 5: Commit**

```bash
git add backend/src/
git commit -m "feat: add PDF generation via Puppeteer"
```

---

### Task 11: Signature Upload Endpoint

**Files:**
- Create: `backend/src/routes/uploads.js`
- Create: `backend/src/controllers/uploadsController.js`
- Modify: `backend/src/routes/index.js`

**Step 1: Create uploads controller**

Create `backend/src/controllers/uploadsController.js`:

```js
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, '../../uploads');

export async function uploadSignature(req, res) {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const filename = `sig-${Date.now()}-${req.file.originalname}`;
  const filePath = path.join(UPLOADS_DIR, filename);
  await fs.writeFile(filePath, req.file.buffer);

  res.status(201).json({ url: `/uploads/${filename}` });
}
```

**Step 2: Create uploads route**

Create `backend/src/routes/uploads.js`:

```js
import { Router } from 'express';
import multer from 'multer';
import * as uploadsController from '../controllers/uploadsController.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/signature', upload.single('file'), uploadsController.uploadSignature);

export default router;
```

**Step 3: Mount in routes/index.js**

```js
import uploadsRouter from './uploads.js';
router.use('/uploads', uploadsRouter);
```

**Step 4: Commit**

```bash
git add backend/src/
git commit -m "feat: add signature image upload endpoint"
```

---

## Phase 3: Frontend Foundation

### Task 12: React Router + App Layout + Sidebar

**Files:**
- Modify: `frontend/src/main.jsx` (add BrowserRouter)
- Modify: `frontend/src/App.jsx` (add routing)
- Create: `frontend/src/components/layout/AppLayout.jsx`
- Create: `frontend/src/components/layout/Sidebar.jsx`
- Create: `frontend/src/pages/DashboardPage.jsx` (placeholder)
- Create: `frontend/src/pages/TemplateListPage.jsx` (placeholder)
- Create: `frontend/src/pages/InvoiceEditorPage.jsx` (placeholder)
- Create: `frontend/src/pages/TemplateEditorPage.jsx` (placeholder)
- Create: `frontend/src/pages/FontManagementPage.jsx` (placeholder)

**Step 1: Install required shadcn components**

```bash
cd frontend
npx shadcn@latest add sidebar separator breadcrumb tooltip
```

These are needed for the sidebar layout.

**Step 2: Wrap App with BrowserRouter**

Update `frontend/src/main.jsx`:

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
```

**Step 3: Create placeholder pages**

Create each page file with a minimal component:

```jsx
// frontend/src/pages/DashboardPage.jsx
export default function DashboardPage() {
  return <div><h1>Dashboard</h1></div>
}
```

Same pattern for `TemplateListPage.jsx`, `InvoiceEditorPage.jsx`, `TemplateEditorPage.jsx`, `FontManagementPage.jsx`.

**Step 4: Create Sidebar component**

Create `frontend/src/components/layout/Sidebar.jsx` with links:
- Dashboard (/) — icon: FileText
- Templates (/templates) — icon: LayoutTemplate
- Fonts (/fonts) — icon: Type

Use shadcn Sidebar components and lucide-react icons.

**Step 5: Create AppLayout component**

Create `frontend/src/components/layout/AppLayout.jsx`:

```jsx
import { SidebarProvider } from '@/components/ui/sidebar'
import { Sidebar } from './Sidebar'
import { Outlet } from 'react-router-dom'

export default function AppLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  )
}
```

**Step 6: Update App.jsx with routes**

```jsx
import { Routes, Route } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import DashboardPage from '@/pages/DashboardPage'
import TemplateListPage from '@/pages/TemplateListPage'
import InvoiceEditorPage from '@/pages/InvoiceEditorPage'
import TemplateEditorPage from '@/pages/TemplateEditorPage'
import FontManagementPage from '@/pages/FontManagementPage'

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/templates" element={<TemplateListPage />} />
        <Route path="/templates/new" element={<TemplateEditorPage />} />
        <Route path="/templates/:id/edit" element={<TemplateEditorPage />} />
        <Route path="/invoices/new" element={<InvoiceEditorPage />} />
        <Route path="/invoices/:id/edit" element={<InvoiceEditorPage />} />
        <Route path="/fonts" element={<FontManagementPage />} />
      </Route>
    </Routes>
  )
}
```

**Step 7: Add Vite proxy for API**

Add to `frontend/vite.config.js`:
```js
server: {
  proxy: {
    '/api': 'http://localhost:3000',
    '/uploads': 'http://localhost:3000',
    '/fonts': 'http://localhost:3000',
  }
}
```

**Step 8: Verify**

```bash
cd frontend && npm run dev
# Navigate to http://localhost:5173
# Sidebar visible, clicking links changes pages
```

**Step 9: Commit**

```bash
git add frontend/
git commit -m "feat: add React Router, sidebar layout, and placeholder pages"
```

---

### Task 13: API Client Utility

**Files:**
- Create: `frontend/src/lib/api.js`

**Step 1: Create fetch wrapper**

Create `frontend/src/lib/api.js`:

```js
const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  const contentType = res.headers.get('content-type');
  if (contentType?.includes('application/json')) return res.json();
  if (contentType?.includes('text/html')) return res.text();
  return res;
}

export const api = {
  // Fonts
  getFonts: () => request('/fonts'),
  getFont: (id) => request(`/fonts/${id}`),
  createFont: (data) => request('/fonts', { method: 'POST', body: JSON.stringify(data) }),
  uploadFont: (formData) => request('/fonts/upload', { method: 'POST', body: formData, headers: {} }),
  deleteFont: (id) => request(`/fonts/${id}`, { method: 'DELETE' }),

  // Templates
  getTemplates: () => request('/templates'),
  getTemplate: (id) => request(`/templates/${id}`),
  createTemplate: (data) => request('/templates', { method: 'POST', body: JSON.stringify(data) }),
  updateTemplate: (id, data) => request(`/templates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTemplate: (id) => request(`/templates/${id}`, { method: 'DELETE' }),

  // Invoices
  getInvoices: (params) => request(`/invoices?${new URLSearchParams(params)}`),
  getInvoice: (id) => request(`/invoices/${id}`),
  createInvoice: (data) => request('/invoices', { method: 'POST', body: JSON.stringify(data) }),
  updateInvoice: (id, data) => request(`/invoices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteInvoice: (id) => request(`/invoices/${id}`, { method: 'DELETE' }),
  getInvoicePdfUrl: (id) => `/api/invoices/${id}/pdf`,

  // Snapshots
  getSnapshots: (invoiceId) => request(`/invoices/${invoiceId}/snapshots`),
  createSnapshot: (invoiceId, data) => request(`/invoices/${invoiceId}/snapshots`, { method: 'POST', body: JSON.stringify(data) }),
  getSnapshot: (id) => request(`/snapshots/${id}`),
  deleteSnapshot: (id) => request(`/snapshots/${id}`, { method: 'DELETE' }),
  cloneSnapshot: (id) => request(`/snapshots/${id}/clone`, { method: 'POST' }),

  // Preview
  getPreviewHtml: (data) => request('/preview', { method: 'POST', body: JSON.stringify(data) }),

  // Uploads
  uploadSignature: (formData) => request('/uploads/signature', { method: 'POST', body: formData, headers: {} }),
};
```

**Step 2: Commit**

```bash
git add frontend/src/lib/api.js
git commit -m "feat: add API client utility"
```

---

## Phase 4: Frontend Pages

### Task 14: Font Management Page

**Files:**
- Modify: `frontend/src/pages/FontManagementPage.jsx`
- Create: `frontend/src/components/fonts/FontCard.jsx`
- Create: `frontend/src/components/fonts/FontUploadDialog.jsx`

Install shadcn components needed:
```bash
cd frontend
npx shadcn@latest add card input dialog label select badge
```

**Step 1: Build FontCard component**

- Displays font name, source badge (local/remote/system)
- Renders sample text in that font
- Delete button with confirmation
- For remote/local fonts, injects `@font-face` dynamically

**Step 2: Build FontUploadDialog component**

- Dialog with two tabs/modes: "Upload File" and "Remote URL"
- Upload mode: file input + name + family fields
- Remote mode: URL + name + family fields
- Submit calls appropriate API

**Step 3: Build FontManagementPage**

- Header with "Fonts" title and "Add Font" button (opens dialog)
- Global preview text input at top
- Grid of FontCards
- Each card renders the preview text in its font
- Fetches fonts on mount via `api.getFonts()`

**Step 4: Verify**

Open http://localhost:5173/fonts, see system fonts, type preview text, verify rendering.

**Step 5: Commit**

```bash
git add frontend/src/
git commit -m "feat: add font management page with preview and upload"
```

---

### Task 15: Template List Page

**Files:**
- Modify: `frontend/src/pages/TemplateListPage.jsx`
- Create: `frontend/src/components/templates/TemplateCard.jsx`

Install shadcn components if not already:
```bash
npx shadcn@latest add dropdown-menu
```

**Step 1: Build TemplateCard**

- Card with template name, last updated date
- Dropdown menu: Edit, Duplicate, Delete

**Step 2: Build TemplateListPage**

- Header with "Templates" title and "New Template" button
- Grid of TemplateCards
- "New Template" navigates to `/templates/new`
- Edit navigates to `/templates/:id/edit`
- Duplicate calls API to create a copy, refreshes list
- Delete calls API, refreshes list

**Step 3: Verify and commit**

```bash
git add frontend/src/
git commit -m "feat: add template list page"
```

---

### Task 16: Invoice/Template Editor — Split Screen

This is the core feature. The same editor component is used for both invoices and templates, with a `mode` prop.

**Files:**
- Create: `frontend/src/components/invoice/InvoiceForm.jsx`
- Create: `frontend/src/components/invoice/InvoicePreview.jsx`
- Create: `frontend/src/components/invoice/SectionToggle.jsx`
- Create: `frontend/src/components/invoice/MetadataFields.jsx`
- Create: `frontend/src/components/invoice/ItemsTable.jsx`
- Create: `frontend/src/components/invoice/SignatureUpload.jsx`
- Create: `frontend/src/hooks/useInvoiceForm.js` (state management hook)
- Modify: `frontend/src/pages/InvoiceEditorPage.jsx`
- Modify: `frontend/src/pages/TemplateEditorPage.jsx`

Install shadcn components:
```bash
npx shadcn@latest add textarea switch tabs scroll-area table
```

**Step 1: Create useInvoiceForm hook**

`frontend/src/hooks/useInvoiceForm.js`:

Custom hook managing the full invoice JSON state with:
- `formData` — the current JSON state
- `updateSection(sectionKey, data)` — update a section
- `toggleSection(sectionKey)` — toggle visibility
- `addCategory()` / `removeCategory(index)`
- `addItem(categoryIndex)` / `removeItem(categoryIndex, itemIndex)`
- `updateItem(categoryIndex, itemIndex, field, value)`
- Auto-calculated subtotals and grand total

Default initial state matching the JSON schema from the design doc.

**Step 2: Create SectionToggle**

Simple switch component: label + shadcn Switch. Toggles `visible` on a section.

**Step 3: Create MetadataFields**

Form fields for date, refNo, client, contactPerson, jobTitle. Uses shadcn Input and Label.

**Step 4: Create ItemsTable**

The most complex component:
- Renders category groups
- Each group: optional category name input, table of items (No, Description, Qty, Total), subtotal row
- Add/remove item buttons per group
- Add/remove category group buttons
- Grand total at bottom
- Currency display from `sections.items.currency`

**Step 5: Create SignatureUpload**

- "For and on behalf of" label (editable)
- Image upload area (click to upload, shows preview)
- Name and title text inputs
- Calls `api.uploadSignature()` on file select

**Step 6: Create InvoiceForm**

Left-side container with collapsible sections:
- Each section wrapped in a card/accordion with SectionToggle
- Header section: title input
- Metadata section: MetadataFields
- Items section: ItemsTable
- Payment Method: textarea
- Terms: textarea
- Signature: SignatureUpload
- Footer: text input
- Font selector: dropdown of available fonts
- Currency input

**Step 7: Create InvoicePreview**

Right-side preview panel:
- Scaled iframe showing the invoice HTML
- Calls `POST /api/preview` with debounced form data (300ms)
- Updates iframe `srcdoc` with the returned HTML
- Styled to look like an A4 paper with shadow

```jsx
// Core logic:
useEffect(() => {
  const timer = setTimeout(async () => {
    const html = await api.getPreviewHtml({ jsonData: formData, fontId });
    setPreviewHtml(html);
  }, 300);
  return () => clearTimeout(timer);
}, [formData, fontId]);

return (
  <div className="flex items-start justify-center bg-muted p-4 overflow-auto h-full">
    <iframe
      srcDoc={previewHtml}
      className="w-[595px] h-[842px] bg-white shadow-lg border-0"
      title="Invoice Preview"
    />
  </div>
);
```

**Step 8: Build InvoiceEditorPage**

```jsx
// Split screen layout
<div className="flex h-[calc(100vh-4rem)] gap-0">
  <div className="w-1/2 overflow-auto border-r p-4">
    <InvoiceForm ... />
  </div>
  <div className="w-1/2 overflow-auto">
    <InvoicePreview ... />
  </div>
</div>
```

- On mount: if `:id` param exists, fetch invoice and populate form
- If `?template=:id` query param, load template defaults
- Save button: calls create or update API
- Download PDF button: opens `api.getInvoicePdfUrl(id)` in new tab

**Step 9: Build TemplateEditorPage**

Same split-screen layout but:
- Uses same components with `mode="template"` hints
- Save calls template API instead of invoice API
- No PDF download button

**Step 10: Verify**

- Navigate to `/invoices/new`, see split screen
- Edit fields on left, preview updates on right
- Save, verify data persists
- Navigate to `/templates/new`, same experience

**Step 11: Commit**

```bash
git add frontend/src/
git commit -m "feat: add split-screen invoice/template editor with live preview"
```

---

### Task 17: Dashboard — Invoice List with Search/Sort/Filter

**Files:**
- Modify: `frontend/src/pages/DashboardPage.jsx`
- Create: `frontend/src/components/dashboard/InvoiceTable.jsx`
- Create: `frontend/src/components/dashboard/SnapshotList.jsx`

Install shadcn components:
```bash
npx shadcn@latest add popover calendar
```

**Step 1: Build InvoiceTable component**

- shadcn Table with columns: Ref No, Client, Job Title, Date, Total, Actions
- Search input above table (free-text, updates `?search=` param)
- Clickable column headers for sorting (toggles asc/desc)
- Date range filter (two date pickers: from/to)
- Actions dropdown per row: Edit, Download PDF, Delete, Save as Snapshot
- Uses `api.getInvoices()` with query params

**Step 2: Build SnapshotList component**

- Dialog or slide-over showing snapshots for an invoice
- Each snapshot: name, date, Clone button, Delete button
- Clone navigates to the new invoice editor

**Step 3: Build DashboardPage**

- Header: "Invoices" title + "New Invoice" button
- "New Invoice" opens a dialog to select template (or blank), then navigates to `/invoices/new?template=:id`
- InvoiceTable below
- State management for search, sort, filter params

**Step 4: Verify**

- Open http://localhost:5173/
- See invoice table with test data
- Search, sort columns, filter by date
- Edit navigates to editor
- Download PDF works
- Snapshot creation and cloning works

**Step 5: Commit**

```bash
git add frontend/src/
git commit -m "feat: add dashboard with searchable, sortable, filterable invoice table"
```

---

## Phase 5: Integration & Polish

### Task 18: PDF Download Integration

**Files:**
- Modify: `frontend/src/pages/InvoiceEditorPage.jsx`
- Modify: `frontend/src/components/dashboard/InvoiceTable.jsx`

**Step 1: Add download button to editor**

In InvoiceEditorPage, add a "Download PDF" button in the toolbar that opens `api.getInvoicePdfUrl(id)`. Only enabled after invoice is saved (has an ID).

**Step 2: Wire up download in dashboard table**

InvoiceTable action "Download PDF" triggers:
```js
window.open(api.getInvoicePdfUrl(invoiceId), '_blank');
```

**Step 3: Verify end-to-end**

1. Create invoice via editor
2. Click Download PDF
3. Open PDF — verify it matches the live preview

**Step 4: Commit**

```bash
git add frontend/src/
git commit -m "feat: wire up PDF download in editor and dashboard"
```

---

### Task 19: Snapshot Management UI

**Files:**
- Modify: `frontend/src/components/dashboard/SnapshotList.jsx`
- Modify: `frontend/src/pages/DashboardPage.jsx`

**Step 1: Complete SnapshotList**

- "Save as Snapshot" action in table opens a dialog asking for snapshot name
- Calls `api.createSnapshot(invoiceId, { name })`
- "View Snapshots" shows list of snapshots with Clone and Delete actions
- Clone calls `api.cloneSnapshot(id)` then navigates to `/invoices/:newId/edit`

**Step 2: Verify**

- Save invoice as snapshot
- Clone snapshot
- Verify new invoice has all data from snapshot
- Delete snapshot

**Step 3: Commit**

```bash
git add frontend/src/
git commit -m "feat: add snapshot management UI with clone support"
```

---

### Task 20: Final Polish + Error Handling

**Step 1: Add loading states**

Add loading spinners/skeletons to:
- Dashboard table while fetching
- Preview iframe while generating
- Font cards while loading

**Step 2: Add toast notifications**

```bash
cd frontend
npx shadcn@latest add sonner
```

Add success/error toasts for: save, delete, clone, upload operations.

**Step 3: Add confirmation dialogs**

All delete operations should show a confirmation dialog before proceeding.

**Step 4: Handle edge cases**

- Empty states: "No invoices yet", "No templates yet", "No fonts"
- Error boundaries for preview iframe failures
- Form validation: required fields highlighted

**Step 5: Verify full flow**

1. Create a font (upload or remote)
2. Create a template using that font
3. Create an invoice from template
4. Edit invoice, verify live preview
5. Download PDF, verify match
6. Save as snapshot
7. Clone snapshot into new invoice
8. Search/sort/filter on dashboard

**Step 6: Commit**

```bash
git add frontend/src/
git commit -m "feat: add loading states, toasts, confirmations, and empty states"
```

---

## Task Dependency Graph

```
Task 1 (Schema) → Task 2 (Seed) → Task 3 (Express setup)
Task 3 → Task 4 (Fonts API) → Task 5 (Templates API) → Task 6 (Invoices API) → Task 7 (Snapshots API)
Task 3 → Task 8 (HTML Template) → Task 9 (Preview) → Task 10 (PDF)
Task 3 → Task 11 (Uploads)
Task 3 → Task 12 (Router + Layout) → Task 13 (API Client)
Task 4 + Task 13 → Task 14 (Fonts Page)
Task 5 + Task 13 → Task 15 (Template List)
Task 6 + Task 9 + Task 11 + Task 13 → Task 16 (Editor)
Task 6 + Task 7 + Task 13 → Task 17 (Dashboard)
Task 10 + Task 16 → Task 18 (PDF Integration)
Task 7 + Task 17 → Task 19 (Snapshots UI)
Task 18 + Task 19 → Task 20 (Polish)
```

### Parallelizable groups:
- **Tasks 4, 8, 11** can run in parallel after Task 3
- **Tasks 14, 15** can run in parallel after their deps
- **Tasks 18, 19** can run in parallel after their deps
