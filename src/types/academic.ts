export type Course = {
  id: string;
  faculty: string;
  department: string;
  level: string;
  semester: string;
  code: string;
  title: string;
  units: number;
  max_exam: number;
  max_ca: number;
  max_attendance: number;
};

export type ScoreEntry = { ca: number | null; exam: number | null };

export type ScoredCourse = {
  code: string;
  title: string;
  units: number;
  caScore: number;
  examScore: number;
  max_ca: number;
  max_exam: number;
  totalScore: number;
  totalMax: number;
  caPercentage: number;
  examPercentage: number;
  totalPercentage: number;
};

export type AIAnalysis = {
  caAnalysis: {
    average: string;
    diagnosticSummary: string;
    improvementCourses: string[];
    strengthCourses: string[];
  };
  examAnalysis: {
    average: string;
    diagnosticSummary: string;
    improvementCourses: string[];
    strengthCourses: string[];
  };
  totalAnalysis: {
    currentGpa: string;
    standing: string;
    diagnosticSummary: string;
    improvementCourses: string[];
    strengthCourses: string[];
    studyTips: string[];
    nextSemesterPrediction: string;
  };
};

export type SessionData = {
  id: string;
  date: string;
  faculty: string;
  department: string;
  level: string;
  semester: string;
  scores: Record<string, ScoreEntry>;
  courses: ScoredCourse[];
  aiAnalysis?: AIAnalysis | null;
};

export type AnalysisSessionInput = {
  faculty: string;
  department: string;
  level: string;
  semester: string;
  scores: Record<string, ScoreEntry>;
  courses: ScoredCourse[];
};

export type CoursePayload = {
  faculty: string;
  department: string;
  level: string;
  semester: string;
  code: string;
  title: string;
  units: number;
  max_exam: number;
  max_ca: number;
  max_attendance: number;
};
