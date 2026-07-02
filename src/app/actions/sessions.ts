'use server';

import { createClient } from '@/utils/supabase/server';
import type { AIAnalysis, AnalysisSessionInput } from '@/types/academic';
import { normalizeScoredCourses, validateAnalysisInput } from '@/utils/validation/scores';

type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

export async function saveAnalysisSession(
  input: AnalysisSessionInput,
  aiAnalysis: AIAnalysis | null
): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Authentication required.' };
  }

  const validation = validateAnalysisInput(input);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const courses = normalizeScoredCourses(input.courses);

  const payload = {
    user_id: user.id,
    faculty: input.faculty,
    department: input.department,
    level: input.level,
    semester: input.semester,
    assessment_type: 'Combined',
    scores: input.scores,
    courses,
    ai_analysis: aiAnalysis,
  };

  let { data, error } = await supabase
    .from('analysis_sessions')
    .insert(payload)
    .select('id')
    .single();

  if (error?.message?.includes("Could not find the 'ai_analysis' column")) {
    const legacyPayload = {
      user_id: user.id,
      faculty: input.faculty,
      department: input.department,
      level: input.level,
      semester: input.semester,
      assessment_type: 'Combined',
      scores: input.scores,
      courses,
    };
    const fallback = await supabase
      .from('analysis_sessions')
      .insert(legacyPayload)
      .select('id')
      .single();
    data = fallback.data;
    error = fallback.error;
  }

  if (error || !data) {
    return { success: false, error: error?.message ?? 'Could not save analysis session.' };
  }

  return { success: true, data: { id: data.id } };
}

export async function deleteAnalysisSession(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Authentication required.' };
  }

  const { error } = await supabase
    .from('analysis_sessions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
