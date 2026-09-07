/**
 * Bulk-imports RV parks from a CSV export into the `parks` table.
 *
 * Usage:
 *   npm run import-csv                  (reads ./parks.csv)
 *   npm run import-csv -- path/to/file.csv
 *
 * Expects the exact header row (confirmed against the user's real export):
 *   Company Name,Address,City,State,Zip,County,Phone,Contact First,Contact Last,
 *   Title,Direct Phone,Email,Website,Employee Range,Annual Sales,SIC Code,Industry
 *
 * The source data has one row per *contact*, so multiple rows can share the same
 * company/address (e.g. an Executive Director and a General Manager at the same
 * park). This script groups rows by (Company Name, Address) into a single park
 * record: the first contact becomes the primary owner_name/phone/email, and every
 * contact plus the extra business-data columns (County, Title, Website, Employee
 * Range, Annual Sales, SIC Code, Industry) are folded into `notes` so nothing is
 * lost. Re-running the script is safe — it skips any (name, address) pair that
 * already exists in the table.
 */

import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';
import { config as loadEnv } from 'dotenv';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

loadEnv({ path: resolve(process.cwd(), '.env.local') });

const EXPECTED_HEADERS = [
  'Company Name',
  'Address',
  'City',
  'State',
  'Zip',
  'County',
  'Phone',
  'Contact First',
  'Contact Last',
  'Title',
  'Direct Phone',
  'Email',
  'Website',
  'Employee Range',
  'Annual Sales',
  'SIC Code',
  'Industry',
];

type CsvRow = Record<string, string>;

interface GroupedPark {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  ownerName: string;
  phone: string;
  email: string;
  notesLines: string[];
}

function fail(message: string): never {
  console.error(`\nError: ${message}\n`);
  process.exit(1);
}

function main() {
  const csvPath = resolve(process.cwd(), process.argv[2] || 'parks.csv');

  if (!existsSync(csvPath)) {
    fail(`CSV file not found at ${csvPath}`);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    fail(
      'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local'
    );
  }

  const raw = readFileSync(csvPath, 'utf-8');
  const records: CsvRow[] = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  if (records.length === 0) {
    fail('CSV file has no data rows.');
  }

  const actualHeaders = Object.keys(records[0]);
  const missing = EXPECTED_HEADERS.filter((h) => !actualHeaders.includes(h));
  if (missing.length > 0) {
    fail(
      `CSV headers don't match what this script expects.\n` +
        `  Expected: ${EXPECTED_HEADERS.join(', ')}\n` +
        `  Found:    ${actualHeaders.join(', ')}\n` +
        `  Missing:  ${missing.join(', ')}\n\n` +
        `This script's mapping was written for a specific header layout — update ` +
        `EXPECTED_HEADERS and the grouping logic in scripts/import-csv.ts if your ` +
        `export format changed.`
    );
  }

  const groups = new Map<string, GroupedPark>();

  for (const row of records) {
    const name = row['Company Name']?.trim();
    const address = row['Address']?.trim();

    if (!name) continue; // skip rows with no company name — nothing to key on

    const key = `${name.toLowerCase()}|${address.toLowerCase()}`;
    const contactName = [row['Contact First'], row['Contact Last']]
      .filter(Boolean)
      .join(' ')
      .trim();
    const phone = row['Direct Phone']?.trim() || row['Phone']?.trim() || '';
    const email = row['Email']?.trim() || '';

    let group = groups.get(key);
    if (!group) {
      group = {
        name,
        address,
        city: row['City']?.trim() || '',
        state: row['State']?.trim() || '',
        zip: row['Zip']?.trim() || '',
        ownerName: contactName,
        phone,
        email,
        notesLines: [],
      };
      groups.set(key, group);

      const extras: string[] = [];
      if (row['County']) extras.push(`County: ${row['County']}`);
      if (row['Website']) extras.push(`Website: ${row['Website']}`);
      if (row['Employee Range']) extras.push(`Employees: ${row['Employee Range']}`);
      if (row['Annual Sales']) extras.push(`Annual sales: ${row['Annual Sales']}`);
      if (row['Industry']) extras.push(`Industry: ${row['Industry']}`);
      if (row['SIC Code']) extras.push(`SIC code: ${row['SIC Code']}`);
      if (extras.length > 0) group.notesLines.push(extras.join(' | '));
    }

    if (contactName || row['Title'] || phone || email) {
      const contactBits = [
        contactName || null,
        row['Title'] || null,
        phone || null,
        email || null,
      ].filter(Boolean);
      group.notesLines.push(`Contact: ${contactBits.join(' — ')}`);
    }
  }

  const parks = Array.from(groups.values()).map((g) => ({
    name: g.name,
    address: g.address || null,
    city: g.city || null,
    state: g.state || null,
    zip: g.zip || null,
    owner_name: g.ownerName || null,
    phone: g.phone || null,
    email: g.email || null,
    status: 'lead' as const,
    notes: g.notesLines.length > 0 ? g.notesLines.join('\n') : null,
  }));

  console.log(
    `Parsed ${records.length} CSV row(s) into ${parks.length} unique park(s) ` +
      `(grouped by company + address).`
  );

  importParks(supabaseUrl!, serviceRoleKey!, parks);
}

async function importParks(
  url: string,
  key: string,
  parks: {
    name: string;
    address: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
    owner_name: string | null;
    phone: string | null;
    email: string | null;
    status: 'lead';
    notes: string | null;
  }[]
) {
  const supabase = createClient(url, key);

  const { data: existing, error: fetchError } = await supabase
    .from('parks')
    .select('name, address');

  if (fetchError) {
    fail(`Could not check for existing parks: ${fetchError.message}`);
  }

  const existingKeys = new Set(
    (existing ?? []).map(
      (p: { name: string; address: string | null }) =>
        `${p.name.toLowerCase()}|${(p.address ?? '').toLowerCase()}`
    )
  );

  const toInsert = parks.filter(
    (p) => !existingKeys.has(`${p.name.toLowerCase()}|${(p.address ?? '').toLowerCase()}`)
  );
  const skipped = parks.length - toInsert.length;

  if (toInsert.length === 0) {
    console.log(`Nothing to insert — all ${parks.length} park(s) already exist.`);
    return;
  }

  const BATCH_SIZE = 500;
  let inserted = 0;
  const errors: { range: string; message: string }[] = [];

  for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
    const batch = toInsert.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('parks').insert(batch);
    if (error) {
      errors.push({ range: `rows ${i + 1}-${i + batch.length}`, message: error.message });
    } else {
      inserted += batch.length;
    }
    console.log(`  ...${Math.min(i + BATCH_SIZE, toInsert.length)} / ${toInsert.length}`);
  }

  console.log(`\nDone.`);
  console.log(`  Inserted: ${inserted}`);
  console.log(`  Skipped (already existed): ${skipped}`);
  if (errors.length > 0) {
    console.log(`  Failed batches: ${errors.length}`);
    errors.forEach((e) => console.log(`    - ${e.range}: ${e.message}`));
  }
}

main();
