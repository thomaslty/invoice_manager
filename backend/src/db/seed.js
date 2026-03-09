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
