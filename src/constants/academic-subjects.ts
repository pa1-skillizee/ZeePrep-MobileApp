/**
 * ZeePrep Academic Curriculum Taxonomy (CBSE 2026 Edition)
 * Provides standardized grades, streams, and specific subjects per grade.
 */

export interface GradeSubjectMap {
  grade: string;
  name: string;
  streams?: {
    stream: string;
    subjects: string[];
  }[];
  generalSubjects?: string[];
}

export const ACADEMIC_TAXONOMY: GradeSubjectMap[] = [
  {
    grade: "6",
    name: "Class 6",
    generalSubjects: [
      "Mathematics",
      "Science",
      "Social Science",
      "English",
      "Hindi",
      "Computer Science",
    ],
  },
  {
    grade: "7",
    name: "Class 7",
    generalSubjects: [
      "Mathematics",
      "Science",
      "Social Science",
      "English",
      "Hindi",
      "Computer Science",
    ],
  },
  {
    grade: "8",
    name: "Class 8",
    generalSubjects: [
      "Mathematics",
      "Science",
      "Social Science",
      "English",
      "Hindi",
      "Computer Science",
    ],
  },
  {
    grade: "9",
    name: "Class 9",
    generalSubjects: [
      "Mathematics",
      "Science",
      "Physics",
      "Chemistry",
      "Biology",
      "Social Science",
      "English Language & Literature",
      "Hindi Course A/B",
      "Information Technology",
    ],
  },
  {
    grade: "10",
    name: "Class 10",
    generalSubjects: [
      "Mathematics (Standard/Basic)",
      "Science",
      "Physics",
      "Chemistry",
      "Biology",
      "Social Science",
      "English Language & Literature",
      "Hindi Course A/B",
      "Information Technology",
      "Artificial Intelligence",
    ],
  },
  {
    grade: "11",
    name: "Class 11",
    streams: [
      {
        stream: "Science",
        subjects: [
          "Mathematics",
          "Physics",
          "Chemistry",
          "Biology",
          "Computer Science",
          "Informatics Practices",
          "English Core",
          "Physical Education",
        ],
      },
      {
        stream: "Commerce",
        subjects: [
          "Accountancy",
          "Business Studies",
          "Economics",
          "Applied Mathematics",
          "Mathematics",
          "Informatics Practices",
          "English Core",
          "Physical Education",
        ],
      },
      {
        stream: "Arts",
        subjects: [
          "History",
          "Political Science",
          "Geography",
          "Economics",
          "Psychology",
          "Sociology",
          "English Core",
          "Physical Education",
        ],
      },
    ],
    generalSubjects: [
      "Mathematics",
      "Physics",
      "Chemistry",
      "Biology",
      "Computer Science",
      "Accountancy",
      "Business Studies",
      "Economics",
      "English Core",
    ],
  },
  {
    grade: "12",
    name: "Class 12",
    streams: [
      {
        stream: "Science",
        subjects: [
          "Mathematics",
          "Physics",
          "Chemistry",
          "Biology",
          "Computer Science",
          "Informatics Practices",
          "English Core",
          "Physical Education",
        ],
      },
      {
        stream: "Commerce",
        subjects: [
          "Accountancy",
          "Business Studies",
          "Economics",
          "Applied Mathematics",
          "Mathematics",
          "Informatics Practices",
          "English Core",
          "Physical Education",
        ],
      },
      {
        stream: "Arts",
        subjects: [
          "History",
          "Political Science",
          "Geography",
          "Economics",
          "Psychology",
          "Sociology",
          "English Core",
          "Physical Education",
        ],
      },
    ],
    generalSubjects: [
      "Mathematics",
      "Physics",
      "Chemistry",
      "Biology",
      "Computer Science",
      "Accountancy",
      "Business Studies",
      "Economics",
      "English Core",
    ],
  },
];

export const ALL_GRADES = ["6", "7", "8", "9", "10", "11", "12"];
export const ALL_STREAMS = ["Science", "Commerce", "Arts"];

/**
 * Returns subjects applicable for a given grade and optional stream.
 */
export function getSubjectsForGrade(grade?: string, stream?: string): string[] {
  const cleanGrade = (grade || "11").trim();
  const found = ACADEMIC_TAXONOMY.find((t) => t.grade === cleanGrade);
  if (!found) {
    return [
      "Mathematics",
      "Physics",
      "Chemistry",
      "Biology",
      "Science",
      "English",
      "Social Science",
      "Accountancy",
      "Business Studies",
      "Economics",
      "Computer Science",
    ];
  }

  if (found.streams && stream) {
    const streamObj = found.streams.find(
      (s) => s.stream.toLowerCase() === stream.trim().toLowerCase()
    );
    if (streamObj && streamObj.subjects.length > 0) {
      return streamObj.subjects;
    }
  }

  if (found.streams) {
    const allStreamSubs = new Set<string>();
    found.streams.forEach((s) => s.subjects.forEach((sub) => allStreamSubs.add(sub)));
    return Array.from(allStreamSubs);
  }

  return found.generalSubjects || [];
}

export interface ExamTypeOption {
  id: string;
  label: string;
  shortLabel: string;
  category: "formative" | "summative" | "board" | "competitive";
  allowedGrades?: string[]; // If undefined, available for all grades
}

export const ALL_EXAM_TYPES: ExamTypeOption[] = [
  { id: "class_test", label: "Class Test / Weekly Quiz", shortLabel: "Class Test", category: "formative" },
  { id: "unit_test", label: "Unit Test", shortLabel: "Unit Test", category: "formative" },
  { id: "quarterly", label: "Quarterly Exam (Term 1)", shortLabel: "Quarterly", category: "summative" },
  { id: "half_yearly", label: "Half-Yearly Exam (Mid-Term)", shortLabel: "Half-Yearly", category: "summative" },
  { id: "annual", label: "Annual / Final Exam", shortLabel: "Annual Exam", category: "summative" },
  {
    id: "pre_board",
    label: "Pre-Board Examination",
    shortLabel: "Pre-Board",
    category: "board",
    allowedGrades: ["8", "10", "12"], // Smart filter: Only for 8th, 10th & 12th
  },
  {
    id: "board",
    label: "Board Examination",
    shortLabel: "Board Exam",
    category: "board",
    allowedGrades: ["8", "10", "12"], // Smart filter: Only for 8th, 10th & 12th
  },
  {
    id: "competitive_mock",
    label: "Competitive Mock (JEE / NEET / Foundation)",
    shortLabel: "Competitive Mock",
    category: "competitive",
    allowedGrades: ["8", "9", "10", "11", "12"],
  },
];

export function getExamTypesForGrade(grade: string): ExamTypeOption[] {
  const normGrade = grade.replace(/\D/g, "") || "10";
  return ALL_EXAM_TYPES.filter(
    (t) => !t.allowedGrades || t.allowedGrades.includes(normGrade)
  );
}
