'use server';

import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

type CourseInput = {
  code: string;
  title: string;
  units: number;
  caScore?: number;
  examScore?: number;
  max_ca?: number;
  max_exam?: number;
  totalScore?: number;
  totalMax?: number;
  caPercentage?: number;
  examPercentage?: number;
  totalPercentage?: number;
};

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const standingFromGpa = (gpa: number) => {
  if (gpa >= 4.5) return 'First Class';
  if (gpa >= 3.5) return 'Second Class Upper';
  if (gpa >= 2.4) return 'Second Class Lower';
  if (gpa >= 1.5) return 'Pass';
  return 'Fail';
};

type MetricSet = {
  average: number;
  improvementCourses: string[];
  strengthCourses: string[];
};

const letterGrade = (percent: number) => {
  if (percent >= 70) return 'A';
  if (percent >= 60) return 'B';
  if (percent >= 50) return 'C';
  if (percent >= 45) return 'D';
  if (percent >= 40) return 'E';
  return 'F';
};

const metricFor = (courses: CourseInput[], field: 'caPercentage' | 'examPercentage' | 'totalPercentage'): MetricSet => {
  if (courses.length === 0) return { average: 0, improvementCourses: [], strengthCourses: [] };
  const average = courses.reduce((sum, c) => sum + toNumber(c[field], 0), 0) / courses.length;
  const sorted = [...courses].sort((a, b) => toNumber(a[field], 0) - toNumber(b[field], 0));
  // Improvement is required for grades below B (i.e., C, D, E, F).
  const improvementCourses = sorted.filter((c) => !['A', 'B'].includes(letterGrade(toNumber(c[field], 0)))).map((c) => c.code);
  const strengthCourses = [...sorted].reverse().slice(0, Math.min(3, sorted.length)).map((c) => c.code);
  return { average, improvementCourses, strengthCourses };
};

function buildHeuristicAnalysis(sessionData: any) {
  const courses = Array.isArray(sessionData?.courses) ? (sessionData.courses as CourseInput[]) : [];
  if (courses.length === 0) {
    return {
      caAnalysis: { average: '0.0', diagnosticSummary: 'No CA scores available yet.', improvementCourses: [], strengthCourses: [] },
      examAnalysis: { average: '0.0', diagnosticSummary: 'No exam scores available yet.', improvementCourses: [], strengthCourses: [] },
      totalAnalysis: {
        currentGpa: '0.00',
        standing: 'Pass',
        diagnosticSummary: 'Provide course scores to generate full-term analytics.',
        improvementCourses: [],
        strengthCourses: [],
        studyTips: [
          'Use a weekly revision timetable and keep short daily study blocks.',
          'Practice past questions under time limits for better exam confidence.',
          'Review mistakes after each test and discuss difficult topics early.',
        ],
        nextSemesterPrediction: 'With consistent study habits and early revision, your next semester performance is likely to improve.',
      },
    };
  }

  const ca = metricFor(courses, 'caPercentage');
  const exam = metricFor(courses, 'examPercentage');
  const total = metricFor(courses, 'totalPercentage');
  const totalUnits = courses.reduce((sum, c) => sum + Math.max(1, toNumber(c.units, 1)), 0);
  const weightedPercent =
    courses.reduce((sum, c) => sum + toNumber(c.totalPercentage, 0) * Math.max(1, toNumber(c.units, 1)), 0) /
    Math.max(1, totalUnits);
  const projectedGpa = Math.min(5, Math.max(0, (weightedPercent / 100) * 5));

  return {
    caAnalysis: {
      average: ca.average.toFixed(1),
      diagnosticSummary: `Your CA+Attendance average is ${ca.average.toFixed(1)}%. Keep momentum through weekly class engagement and short revision cycles.`,
      improvementCourses: ca.improvementCourses,
      strengthCourses: ca.strengthCourses,
    },
    examAnalysis: {
      average: exam.average.toFixed(1),
      diagnosticSummary: `Your exam average is ${exam.average.toFixed(1)}%. Improve weak topics using timed practice and focused problem-solving.`,
      improvementCourses: exam.improvementCourses,
      strengthCourses: exam.strengthCourses,
    },
    totalAnalysis: {
      currentGpa: projectedGpa.toFixed(2),
      standing: standingFromGpa(projectedGpa),
      diagnosticSummary: `Your overall weighted average is ${weightedPercent.toFixed(1)}%, which aligns with ${standingFromGpa(projectedGpa)} standing if consistency is maintained.`,
      improvementCourses: total.improvementCourses,
      strengthCourses: total.strengthCourses,
      studyTips: [
        'Break each course into weekly goals and track completion.',
        'Use active recall and past questions instead of passive reading.',
        'Start revision early and keep a fixed exam-practice routine.',
      ],
      nextSemesterPrediction: 'If you keep consistent study routines and close current weak areas early, your next semester result should show a measurable upward trend.',
    },
  };
}

export async function generateAIAnalysis(sessionData: any) {
  const heuristic = buildHeuristicAnalysis(sessionData);

  try {
    if (!process.env.OPENAI_API_KEY) {
      return { success: true, analysis: heuristic };
    }

    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      temperature: 0.2,
      system: `You are an expert academic advisor bot for university students.
      You will receive CA, Exam, and Total performance by course.
      Return three analytics blocks: CA analysis, Exam analysis, and Total analysis.
      For CA and Exam analysis, do not include projected CGPA.
      For Total analysis, include current GPA (named currentGpa), standing, and next semester prediction.
      Grade interpretation: A>=70, B>=60, C>=50, D>=45, E>=40, F<40.
      Any course below grade B should be in improvementCourses.
      Use only the provided numbers.`,
      prompt: `Analyze the following student data:\n\n${JSON.stringify(sessionData, null, 2)}`,
      schema: z.object({
        caAnalysis: z.object({
          average: z.string(),
          diagnosticSummary: z.string(),
          improvementCourses: z.array(z.string()),
          strengthCourses: z.array(z.string()),
        }),
        examAnalysis: z.object({
          average: z.string(),
          diagnosticSummary: z.string(),
          improvementCourses: z.array(z.string()),
          strengthCourses: z.array(z.string()),
        }),
        totalAnalysis: z.object({
          currentGpa: z.string(),
          standing: z.string(),
          diagnosticSummary: z.string(),
          improvementCourses: z.array(z.string()),
          strengthCourses: z.array(z.string()),
          studyTips: z.array(z.string()),
          nextSemesterPrediction: z.string(),
        }),
      })
    });

    return { success: true, analysis: object };
  } catch (error: any) {
    console.error("AI Generation Failed:", error);
    return { success: true, analysis: heuristic };
  }
}
