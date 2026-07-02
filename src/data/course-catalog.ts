import {
  COURSES_PER_SEMESTER,
  DEFAULT_MARKS,
  DEFAULT_UNITS_PATTERN,
  DEPARTMENT_CODE_PREFIX,
  MIU_DATA,
  type Faculty,
} from './miu-structure';
import type { CoursePayload } from '@/types/academic';

const LEVEL_TITLES: Record<string, string[]> = {
  '100': [
    'Introduction to {dept}',
    'Foundations of {dept}',
    '{dept} Principles I',
    '{dept} Principles II',
    'Communication Skills',
    'Use of Library and ICT',
    'Nigerian Peoples and Culture',
    'Critical Thinking and Logic',
    'Basic Mathematics for {dept}',
  ],
  '200': [
    'Research Methods in {dept}',
    'Statistics for {dept}',
    '{dept} Theory and Practice I',
    '{dept} Theory and Practice II',
    'Professional Ethics in {dept}',
    'Technical Writing and Reporting',
    'Data Analysis for {dept}',
    'Entrepreneurship and Innovation',
    'Laboratory / Studio Work in {dept}',
  ],
  '300': [
    'Advanced {dept} I',
    'Advanced {dept} II',
    'Seminar in {dept}',
    'Field Work in {dept}',
    'Research Project I',
    'Policy and Governance in {dept}',
    'Specialized Elective I',
    'Specialized Elective II',
    'Contemporary Issues in {dept}',
  ],
  '400': [
    'Final Year Project I',
    'Final Year Project II',
    'Professional Practice in {dept}',
    'Strategic Studies in {dept}',
    'Advanced Seminar in {dept}',
    'Law, Ethics and Society',
    'Capstone Workshop',
    'Industry Collaboration in {dept}',
    'Dissertation Seminar',
  ],
};

const DEPARTMENT_SPECIFIC_TITLES: Record<string, Partial<Record<string, string[]>>> = {
  'Software Engineering': {
    '100': [
      'Introduction to Programming',
      'Computer Fundamentals',
      'Discrete Mathematics',
      'Web Development Basics',
      'Database Concepts',
      'Software Engineering Overview',
      'Communication Skills',
      'Logic and Problem Solving',
      'Introduction to Algorithms',
    ],
    '200': [
      'Object-Oriented Programming',
      'Data Structures and Algorithms',
      'Software Design and Modeling',
      'Operating Systems',
      'Computer Networks',
      'Human-Computer Interaction',
      'Research Methods',
      'Software Testing Fundamentals',
      'Mobile Application Development',
    ],
  },
  'Cyber Security': {
    '100': [
      'Introduction to Cyber Security',
      'Computer Networks Basics',
      'Information Security Fundamentals',
      'Programming for Security',
      'Digital Literacy',
      'Ethics in Computing',
      'Communication Skills',
      'Mathematics for Cyber Security',
      'Introduction to Cryptography',
    ],
    '200': [
      'Network Security',
      'Ethical Hacking Fundamentals',
      'Cryptography and Protocols',
      'Secure Software Development',
      'Digital Forensics Basics',
      'Risk Management',
      'Operating Systems Security',
      'Security Operations',
      'Incident Response',
    ],
  },
  'Computer Science': {
    '100': [
      'Introduction to Computer Science',
      'Programming Fundamentals',
      'Computer Architecture',
      'Calculus for Computing',
      'Digital Systems',
      'Computational Thinking',
      'Communication Skills',
      'Information Systems Basics',
      'Introduction to Data Science',
    ],
  },
  Accounting: {
    '100': [
      'Introduction to Accounting',
      'Financial Accounting I',
      'Business Mathematics',
      'Microeconomics',
      'Business Communication',
      'Principles of Management',
      'Use of ICT in Business',
      'Nigerian Business Environment',
      'Introduction to Taxation',
    ],
  },
  'Commercial Law': {
    '100': [
      'Introduction to Law',
      'Legal Methods',
      'Nigerian Legal System',
      'Constitutional Law I',
      'Contract Law I',
      'Commercial Law I',
      'Legal Research and Writing',
      'Logic and Philosophy of Law',
      'Communication Skills',
    ],
  },
};

function getTitles(department: string, level: string): string[] {
  const specific = DEPARTMENT_SPECIFIC_TITLES[department]?.[level];
  if (specific && specific.length >= COURSES_PER_SEMESTER) {
    return specific.slice(0, COURSES_PER_SEMESTER);
  }

  const templates = LEVEL_TITLES[level] ?? LEVEL_TITLES['100'];
  return templates.map((title) => title.replaceAll('{dept}', department));
}

function buildCourseCode(prefix: string, level: string, semester: string, index: number): string {
  const levelDigit = Number(level) / 100;
  const sequence = semester === '1' ? index + 1 : index + 11;
  return `${prefix}${levelDigit}${String(sequence).padStart(2, '0')}`;
}

export function generateCourseCatalog(): CoursePayload[] {
  const courses: CoursePayload[] = [];

  for (const faculty of MIU_DATA.faculties) {
    const departments = MIU_DATA.departments[faculty as Faculty];

    for (const department of departments) {
      const prefix = DEPARTMENT_CODE_PREFIX[department];
      if (!prefix) continue;

      for (const level of MIU_DATA.levels) {
        const titles = getTitles(department, level);

        for (const semester of MIU_DATA.semesters) {
          titles.forEach((title, index) => {
            courses.push({
              faculty,
              department,
              level,
              semester,
              code: buildCourseCode(prefix, level, semester, index),
              title,
              units: DEFAULT_UNITS_PATTERN[index % DEFAULT_UNITS_PATTERN.length],
              ...DEFAULT_MARKS,
            });
          });
        }
      }
    }
  }

  return courses;
}

export function getCatalogStats() {
  const courses = generateCourseCatalog();
  const departments = new Set(courses.map((course) => course.department)).size;
  const combinations = new Set(
    courses.map((course) => `${course.department}|${course.level}|${course.semester}`)
  ).size;

  return {
    totalCourses: courses.length,
    departments,
    combinations,
    coursesPerCombination: COURSES_PER_SEMESTER,
  };
}
