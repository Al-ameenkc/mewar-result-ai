import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { generateCourseCatalog, getCatalogStats } from '../src/data/course-catalog';

function sqlString(value: string) {
  return `'${value.replaceAll("'", "''")}'`;
}

function main() {
  const courses = generateCourseCatalog();
  const stats = getCatalogStats();
  const outputPath = resolve(__dirname, '../supabase/migrations/002_seed_courses.sql');

  const values = courses
    .map((course) => {
      return `(${[
        sqlString(course.faculty),
        sqlString(course.department),
        sqlString(course.level),
        sqlString(course.semester),
        sqlString(course.code),
        sqlString(course.title),
        course.units,
        course.max_exam,
        course.max_ca,
        course.max_attendance,
      ].join(', ')})`;
    })
    .join(',\n');

  const sql = `-- Mewar Result AI — seed course catalog (${stats.totalCourses} courses)
-- Run in Supabase SQL Editor AFTER:
--   1) 000_courses_schema.sql
--   2) 001_rls_policies.sql
-- Safe to re-run: clears generated catalog rows first.

alter table public.courses add column if not exists max_exam integer not null default 60;
alter table public.courses add column if not exists max_ca integer not null default 30;
alter table public.courses add column if not exists max_attendance integer not null default 10;

delete from public.courses
where code ~ '^[A-Z]{3}[1-4][0-9]{2}$';

insert into public.courses (
  faculty,
  department,
  level,
  semester,
  code,
  title,
  units,
  max_exam,
  max_ca,
  max_attendance
) values
${values};
`;

  writeFileSync(outputPath, sql, 'utf8');

  console.log(`Wrote ${stats.totalCourses} courses to ${outputPath}`);
}

main();
