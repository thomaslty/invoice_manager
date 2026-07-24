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
  // Idempotent: skip if fonts already exist (fresh boot after seed, or after a
  // data import that already populated fonts).
  const existing = await db.select().from(fonts).limit(1);
  if (existing.length > 0) {
    console.log('Fonts already present; skipping seed.');
    process.exit(0);
  }
  console.log('Seeding default fonts...');
  for (const font of defaultFonts) {
    await db.insert(fonts).values(font);
  }
  console.log('Done.');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
