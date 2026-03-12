/**
 * One-time script to import airport data from OurAirports into Postgres.
 * Only imports airports that have an IATA code.
 *
 * Run with:
 *   npx tsx scripts/import-airports.ts
 */

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const connectionString = (
  process.env.NEONDB_DATABASE_URL ??
  process.env.DATABASE_URL ??
  ''
).replace('sslmode=require', 'sslmode=verify-full');
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const CSV_URL = 'https://davidmegginson.github.io/ourairports-data/airports.csv';

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split('\n').filter((l) => l.trim());
  const headers = lines[0].split(',').map((h) => h.replace(/"/g, '').trim());
  return lines.slice(1).map((line) => {
    const values = line.match(/(".*?"|[^,]+|(?<=,)(?=,)|(?<=,)$|^(?=,))/g) ?? [];
    const record: Record<string, string> = {};
    headers.forEach((header, i) => {
      record[header] = (values[i] ?? '').replace(/"/g, '').trim();
    });
    return record;
  });
}

async function main() {
  console.log('Downloading airports.csv...');
  const res = await fetch(CSV_URL);
  if (!res.ok) throw new Error(`Failed to fetch CSV: ${res.status}`);
  const text = await res.text();

  console.log('Parsing CSV...');
  const rows = parseCSV(text);

  const airports = rows
    .filter((r) => r.iata_code && r.latitude_deg && r.longitude_deg)
    .map((r) => ({
      iata: r.iata_code,
      icao: r.ident || null,
      name: r.name,
      latitude: parseFloat(r.latitude_deg),
      longitude: parseFloat(r.longitude_deg),
      type: r.type || null,
      municipality: r.municipality || null,
      country: r.iso_country || null,
    }))
    .filter((a) => !isNaN(a.latitude) && !isNaN(a.longitude));

  console.log(`Importing ${airports.length} airports with IATA codes...`);

  const BATCH = 500;
  for (let i = 0; i < airports.length; i += BATCH) {
    const batch = airports.slice(i, i + BATCH);
    await prisma.airport.createMany({ data: batch, skipDuplicates: true });
    process.stdout.write(`\r  ${Math.min(i + BATCH, airports.length)} / ${airports.length}`);
  }

  console.log('\nDone.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
