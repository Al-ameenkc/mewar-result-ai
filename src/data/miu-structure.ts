export const MIU_DATA = {
  faculties: ['Computing', 'Sciences', 'Management', 'Law'],
  departments: {
    Computing: ['Software Engineering', 'Cyber Security', 'Computer Science'],
    Sciences: ['Biotechnology', 'Industrial Chemistry', 'Physics with Electronics'],
    Management: [
      'Accounting',
      'Public Administration',
      'Economics',
      'Entrepreneurship',
      'Banking and Finance',
      'International Relations',
      'Political Science',
      'Sociology',
      'Procurement Management',
    ],
    Law: ['Commercial Law', 'Islamic Law', 'International Law'],
  },
  levels: ['100', '200', '300', '400'],
  semesters: ['1', '2'],
} as const;

export type Faculty = keyof typeof MIU_DATA.departments;

export const DEPARTMENT_CODE_PREFIX: Record<string, string> = {
  'Software Engineering': 'SEN',
  'Cyber Security': 'CYS',
  'Computer Science': 'CSC',
  Biotechnology: 'BIO',
  'Industrial Chemistry': 'ICH',
  'Physics with Electronics': 'PWE',
  Accounting: 'ACC',
  'Public Administration': 'PAD',
  Economics: 'ECO',
  Entrepreneurship: 'ENT',
  'Banking and Finance': 'BFN',
  'International Relations': 'INR',
  'Political Science': 'PSC',
  Sociology: 'SOC',
  'Procurement Management': 'PRC',
  'Commercial Law': 'CLW',
  'Islamic Law': 'ISL',
  'International Law': 'INL',
};

export const COURSES_PER_SEMESTER = 9;

export const DEFAULT_MARKS = {
  max_exam: 60,
  max_ca: 30,
  max_attendance: 10,
};

export const DEFAULT_UNITS_PATTERN = [3, 3, 2, 3, 3, 2, 4, 3, 2];
