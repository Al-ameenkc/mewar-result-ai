import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { generateCourseCatalog, getCatalogStats } from '../src/data/course-catalog';

const ROOT = resolve(__dirname, '..');

function loadEnvFile(filename: string) {
  const filePath = resolve(ROOT, filename);
  if (!existsSync(filePath)) return;

  const content = readFileSync(filePath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separator = trimmed.indexOf('=');
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile('.env.local');
loadEnvFile('.env');

async function main() {
  const shouldReset = process.argv.includes('--reset');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }

  const courses = generateCourseCatalog();
  const stats = getCatalogStats();

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  if (shouldReset) {
    const { error } = await supabase.from('courses').delete().neq('code', '');
    if (error) {
      console.error('Failed to clear existing courses:', error.message);
      process.exit(1);
    }
    console.log('Cleared existing courses.');
  }

  const batchSize = 100;
  let inserted = 0;

  for (let i = 0; i < courses.length; i += batchSize) {
    const batch = courses.slice(i, i + batchSize);
    const { error } = await supabase.from('courses').insert(batch);

    if (error) {
      console.error(`Insert failed at batch ${i / batchSize + 1}:`, error.message);
      process.exit(1);
    }

    inserted += batch.length;
    console.log(`Inserted ${inserted}/${courses.length} courses...`);
  }

  console.log('\nSeed complete.');
  console.log(`- Total courses: ${stats.totalCourses}`);
  console.log(`- Departments covered: ${stats.departments}`);
  console.log(`- Department/level/semester combinations: ${stats.combinations}`);
  console.log(`- Courses per combination: ${stats.coursesPerCombination}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
