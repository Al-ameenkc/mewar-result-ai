'use server';

import { requireAdminAccess } from '@/utils/auth/admin';
import { createAdminClient } from '@/utils/supabase/admin';
import type { CoursePayload } from '@/types/academic';

type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

function validateCoursePayload(payload: CoursePayload): string | null {
  const totalMarks = payload.max_exam + payload.max_ca + payload.max_attendance;
  if (totalMarks !== 100) {
    return `Course max marks must sum to 100 (currently ${totalMarks}).`;
  }
  if (!payload.faculty || !payload.department || !payload.level || !payload.semester) {
    return 'Faculty, department, level, and semester are required.';
  }
  if (!payload.code.trim() || !payload.title.trim()) {
    return 'Course code and title are required.';
  }
  if (payload.units < 1 || payload.units > 6) {
    return 'Units must be between 1 and 6.';
  }
  return null;
}

function isMissingColumnError(message?: string) {
  return message?.includes('Could not find the') ?? false;
}

export async function createCourse(payload: CoursePayload): Promise<ActionResult<{ id: string }>> {
  const auth = await requireAdminAccess();
  if (!auth.ok) return { success: false, error: auth.error };

  const validationError = validateCoursePayload(payload);
  if (validationError) return { success: false, error: validationError };

  try {
    const supabase = createAdminClient();
    let { data, error } = await supabase.from('courses').insert([payload]).select('id').single();

    if (isMissingColumnError(error?.message)) {
      const legacyPayload = {
        faculty: payload.faculty,
        department: payload.department,
        level: payload.level,
        semester: payload.semester,
        code: payload.code,
        title: payload.title,
        units: payload.units,
      };
      const fallback = await supabase.from('courses').insert([legacyPayload]).select('id').single();
      data = fallback.data;
      error = fallback.error;
    }

    if (error || !data) {
      return { success: false, error: error?.message ?? 'Failed to create course.' };
    }

    return { success: true, data: { id: data.id } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create course.',
    };
  }
}

export async function updateCourse(id: string, payload: CoursePayload): Promise<ActionResult> {
  const auth = await requireAdminAccess();
  if (!auth.ok) return { success: false, error: auth.error };

  const validationError = validateCoursePayload(payload);
  if (validationError) return { success: false, error: validationError };

  try {
    const supabase = createAdminClient();
    let { error } = await supabase.from('courses').update(payload).eq('id', id);

    if (isMissingColumnError(error?.message)) {
      const legacyPayload = {
        faculty: payload.faculty,
        department: payload.department,
        level: payload.level,
        semester: payload.semester,
        code: payload.code,
        title: payload.title,
        units: payload.units,
      };
      const fallback = await supabase.from('courses').update(legacyPayload).eq('id', id);
      error = fallback.error;
    }

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update course.',
    };
  }
}

export async function deleteCourse(id: string): Promise<ActionResult> {
  const auth = await requireAdminAccess();
  if (!auth.ok) return { success: false, error: auth.error };

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('courses').delete().eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete course.',
    };
  }
}
