import type { AnalysisSessionInput, ScoredCourse, ScoreEntry } from '@/types/academic';

const MAX_COURSES = 30;

export function validateAnalysisInput(
  input: AnalysisSessionInput
): { valid: true } | { valid: false; error: string } {
  if (!input.faculty || !input.department || !input.level || !input.semester) {
    return { valid: false, error: 'Academic context is incomplete.' };
  }

  if (!Array.isArray(input.courses) || input.courses.length === 0) {
    return { valid: false, error: 'At least one course is required.' };
  }

  if (input.courses.length > MAX_COURSES) {
    return { valid: false, error: `A maximum of ${MAX_COURSES} courses is allowed per analysis.` };
  }

  for (const course of input.courses) {
    const scoreEntry = input.scores[course.code] as ScoreEntry | undefined;
    if (!scoreEntry || scoreEntry.ca === null || scoreEntry.ca === undefined) {
      return { valid: false, error: `Missing CA score for ${course.code}.` };
    }
    if (scoreEntry.exam === null || scoreEntry.exam === undefined) {
      return { valid: false, error: `Missing exam score for ${course.code}.` };
    }

    const caMax = Number(course.max_ca ?? 40);
    const examMax = Number(course.max_exam ?? 60);

    if (!Number.isFinite(scoreEntry.ca) || scoreEntry.ca < 0 || scoreEntry.ca > caMax) {
      return { valid: false, error: `Invalid CA score for ${course.code}.` };
    }
    if (!Number.isFinite(scoreEntry.exam) || scoreEntry.exam < 0 || scoreEntry.exam > examMax) {
      return { valid: false, error: `Invalid exam score for ${course.code}.` };
    }
  }

  return { valid: true };
}

export function normalizeScoredCourses(courses: ScoredCourse[]): ScoredCourse[] {
  return courses.map((course) => ({
    code: String(course.code),
    title: String(course.title),
    units: Number(course.units),
    caScore: Number(course.caScore),
    examScore: Number(course.examScore),
    max_ca: Number(course.max_ca),
    max_exam: Number(course.max_exam),
    totalScore: Number(course.totalScore),
    totalMax: Number(course.totalMax),
    caPercentage: Number(course.caPercentage),
    examPercentage: Number(course.examPercentage),
    totalPercentage: Number(course.totalPercentage),
  }));
}
