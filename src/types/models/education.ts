// Auto-generated from Prisma schema — do not edit
// Regenerate: python gen_types.py

import type { TeamMember } from "./team";
import type { User } from "./users";

export type Instructor = {
  id: string;
  memberId: string | null;
  userId: string | null;
  name: string;
  bio: string | null;
  email: string | null;
  phone: string | null;
  specialties: string[];
  rating: number;
  totalStudents: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  member: TeamMember | null;
  user: User | null;
  courses: Course[];
};

export type Course = {
  id: string;
  title: string;
  titleVi: string;
  description: string | null;
  descriptionVi: string | null;
  type: string;
  instructorId: string;
  instructorType: string;
  instructorMemberId: string | null;
  instructorUserId: string | null;
  price: number;
  lpReward: number;
  maxStudents: number;
  durationWeeks: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  instructor: Instructor;
  instructorMember: TeamMember | null;
  instructorUser: User | null;
  lessons: Lesson[];
  enrollments: Enrollment[];
};

export type Lesson = {
  id: string;
  courseId: string;
  title: string;
  titleVi: string;
  orderIndex: number;
  content: string | null;
  durationMinutes: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  course: Course;
  attendances: Attendance[];
  feedbacks: Feedback[];
  progresses: StudentProgress[];
};

export type Enrollment = {
  id: string;
  courseId: string;
  userId: string | null;
  memberId: string | null;
  assigneeLpPercent: number;
  paidAmount: number;
  enrolledAt: Date;
  status: string;
  completedLessons: Record<string, unknown> | null;
  progressPercent: number;
  createdAt: Date;
  updatedAt: Date;
  course: Course;
  user: User | null;
  member: TeamMember | null;
  attendances: Attendance[];
  feedbacks: Feedback[];
  progresses: StudentProgress[];
  payments: EduPayment[];
};

export type EduPayment = {
  id: string;
  enrollmentId: string;
  amount: number;
  method: string | null;
  note: string | null;
  status: string;
  confirmedBy: string | null;
  confirmedAt: Date;
  lpAwarded: number;
  instructorLp: number;
  createdAt: Date;
  updatedAt: Date;
  enrollment: Enrollment;
};

export type Attendance = {
  id: string;
  enrollmentId: string;
  lessonId: string;
  status: string;
  checkedInAt: Date | null;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
  enrollment: Enrollment;
  lesson: Lesson;
};

export type Feedback = {
  id: string;
  enrollmentId: string;
  lessonId: string | null;
  rating: number;
  comment: string | null;
  createdAt: Date;
  updatedAt: Date;
  enrollment: Enrollment;
  lesson: Lesson | null;
};

export type StudentProgress = {
  id: string;
  enrollmentId: string;
  lessonId: string;
  completedAt: Date | null;
  quizScore: number | null;
  createdAt: Date;
  updatedAt: Date;
  enrollment: Enrollment;
  lesson: Lesson;
};
