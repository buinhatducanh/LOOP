// Auto-generated from Prisma schema — do not edit
// Regenerate: python gen_types.py

import type { LoginHistory, Session, UserRole, AuditLog, Notification } from "./auth";
import type { Course, Enrollment, Instructor } from "./education";
import type { TeamMember } from "./team";

export type User = {
  id: string;
  email: string;
  name: string;
  passwordHash: string | null;
  avatar: string | null;
  role: string;
  googleId: string | null;
  isActive: boolean;
  accountType: string;
  createdAt: Date;
  updatedAt: Date;
  teamMemberId: string | null;
  teamMember: TeamMember | null;
  courseEnrollments: Enrollment[];
  instructorsAsUser: Instructor[];
  eduInstructedCourses: Course[];
  userRoles: UserRole[];
  sessions: Session[];
  loginHistory: LoginHistory[];
  auditLogs: AuditLog[];
  notifications: Notification[];
};
