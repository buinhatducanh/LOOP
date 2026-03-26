// Auto-generated from Prisma schema — do not edit
// Regenerate: python gen_types.py

import type { Project } from "./content";
import type { Course, Enrollment, Instructor } from "./education";
import type { LpAward, LpRedemption, LpTransaction } from "./gamification";
import type { BlogPost, BugNote, DailyStandup, EnvFile, ProjectMember, Task } from "./project";
import type { ReferralCode } from "./referral";
import type { User } from "./users";

export type TeamMember = {
  id: string;
  slug: string;
  name: string;
  role: string;
  bio: string | null;
  shortBio: string | null;
  image: string | null;
  achievements: string[];
  linkedin: string | null;
  twitter: string | null;
  github: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  roleLevel: number;
  coverImage: string | null;
  quote: string | null;
  email: string | null;
  phone: string | null;
  skills: string[];
  experience: string | null;
  social: Record<string, unknown> | null;
  isWorking: boolean;
  isFeatured: boolean;
  birthDate: Date | null;
  address: string | null;
  cccd: string | null;
  contractStart: Date | null;
  experienceFrom: number | null;
  facebook: string | null;
  tiktok: string | null;
  projects: Project[];
  memberExpertise: MemberExpertise[];
  user: User | null;
  level: number;
  currentXp: number;
  maxXp: number;
  rank: string;
  lockedLp: number;
  availableLp: number;
  projectMemberships: ProjectMember[];
  bugNotesAuthored: BugNote[];
  assignedTasks: Task[];
  lpAwardsReceived: LpAward[];
  lpAwardsApproved: LpAward[];
  lpTransactions: LpTransaction[];
  lpTransactionsReceived: LpTransaction[];
  lpTransactionsCreated: LpTransaction[];
  lpRedemptions: LpRedemption[];
  referralCodes: ReferralCode[];
  instructorProfile: Instructor | null;
  enrollments: Enrollment[];
  eduCourses: Course[];
  blogPostsAuthored: BlogPost[];
  envFileEdits: EnvFile[];
  dailyStandups: DailyStandup[];
};

export type Expertise = {
  id: string;
  name: string;
  nameVi: string;
  category: string;
  categoryVi: string;
  icon: string | null;
  logo: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  memberExpertise: MemberExpertise[];
};

export type MemberExpertise = {
  id: string;
  memberId: string;
  expertiseId: string;
  level: number;
  createdAt: Date;
  member: TeamMember;
  expertise: Expertise;
};
