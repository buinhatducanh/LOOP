// Auto-generated from Prisma schema — do not edit
// Regenerate: python gen_types.py

import type { Order } from "./commerce";
import type { LpAward } from "./gamification";
import type { TeamMember } from "./team";

export type Epic = {
  id: string;
  projectId: string;
  title: string;
  color: string;
  isActive: boolean;
  createdAt: Date;
  project: Order;
  backlogs: Backlog[];
};

export type Backlog = {
  id: string;
  projectId: string;
  epicId: string | null;
  name: string;
  title: string;
  description: string | null;
  totalLp: number;
  usedLp: number;
  sortOrder: number;
  isActive: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  project: Order;
  epic: Epic | null;
  tasks: Task[];
};

export type Task = {
  id: string;
  backlogId: string;
  title: string;
  description: string | null;
  lp: number;
  status: string;
  priority: string;
  assigneeId: string | null;
  branchName: string | null;
  mergeCommit: string | null;
  mergedAt: Date | null;
  completedAt: Date | null;
  sortOrder: number;
  isActive: boolean;
  violated: boolean;
  slaDeadline: Date | null;
  externalId: string | null;
  estimatedHours: number | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  backlog: Backlog;
  assignee: TeamMember | null;
  tags: TaskTag[];
  bugNotes: BugNote[];
  commits: GitCommit[];
  lpAwards: LpAward[];
  violations: TaskViolation[];
};

export type TaskViolation = {
  id: string;
  taskId: string;
  type: string;
  revokedLp: number;
  note: string | null;
  createdAt: Date;
  task: Task;
};

export type TaskTag = {
  id: string;
  taskId: string;
  name: string;
  task: Task;
};

export type BugNote = {
  id: string;
  taskId: string;
  authorId: string;
  content: string;
  severity: string;
  status: string;
  resolvedAt: Date | null;
  createdAt: Date;
  task: Task;
  author: TeamMember;
};

export type GitCommit = {
  id: string;
  projectId: string;
  taskId: string | null;
  sha: string;
  message: string;
  authorName: string;
  authorEmail: string;
  branch: string;
  eventType: string;
  mergedToMain: boolean;
  lpAwarded: boolean;
  expAwarded: boolean;
  committedAt: Date;
  receivedAt: Date;
  project: Order;
  task: Task | null;
};

export type Deployment = {
  id: string;
  projectId: string;
  environment: string;
  platform: string;
  deployUrl: string | null;
  deployHookUrl: string | null;
  commitSha: string | null;
  status: string;
  deployedAt: Date | null;
  deployedBy: string | null;
  gscVerified: boolean;
  createdAt: Date;
  project: Order;
};

export type FigmaDemo = {
  id: string;
  projectId: string;
  title: string;
  figmaUrl: string;
  versionHash: string | null;
  status: string;
  clientEmail: string | null;
  clientToken: string | null;
  approvedBy: string | null;
  approvedAt: Date | null;
  rejectionNote: string | null;
  sentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  project: Order;
};

export type EnvFile = {
  id: string;
  projectId: string;
  environment: string;
  fileKey: string;
  content: string;
  version: number;
  editedBy: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  project: Order;
  editor: TeamMember | null;
  history: EnvFileHistory[];
};

export type EnvFileHistory = {
  id: string;
  envFileId: string;
  version: number;
  content: string;
  diffFromPrev: Record<string, unknown> | null;
  editedBy: string | null;
  createdAt: Date;
  envFile: EnvFile;
};

export type HandoverPackage = {
  id: string;
  projectId: string;
  status: string;
  handoverDate: Date | null;
  items: Record<string, unknown>;
  notes: string | null;
  deliveredBy: string | null;
  createdAt: Date;
  project: Order;
};

export type SocialPost = {
  id: string;
  projectId: string;
  platform: string;
  content: string | null;
  mediaUrls: Record<string, unknown>;
  scheduledAt: Date | null;
  publishedAt: Date | null;
  status: string;
  postUrl: string | null;
  publishedBy: string | null;
  createdAt: Date;
  project: Order;
};

export type BlogPost = {
  id: string;
  projectId: string;
  title: string;
  slug: string;
  content: string | null;
  excerpt: string | null;
  coverImage: string | null;
  seoTitle: string | null;
  seoDesc: string | null;
  authorId: string;
  status: string;
  publishedAt: Date | null;
  lpEarned: boolean;
  lpAwardedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  project: Order;
  author: TeamMember;
};

export type ProjectPortalToken = {
  id: string;
  projectId: string;
  token: string;
  label: string;
  expiresAt: Date | null;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  project: Order;
};

export type GscMetric = {
  id: string;
  projectId: string;
  pageUrl: string;
  keyword: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
  dataDate: Date;
  createdAt: Date;
  updatedAt: Date;
  project: Order;
};

export type SlaRule = {
  id: string;
  projectId: string;
  priority: string;
  maxHours: number;
  createdAt: Date;
  project: Order;
};

export type MaintenanceContract = {
  id: string;
  projectId: string;
  title: string;
  price: number;
  billingCycle: string;
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  status: string;
  renewalReminderSent: boolean;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
  project: Order;
};

export type DailyStandup = {
  id: string;
  projectId: string;
  memberId: string;
  date: Date;
  yesterdayDone: string | null;
  todayPlan: string | null;
  blockers: string | null;
  createdAt: Date;
  project: Order;
  member: TeamMember;
};

export type ProjectMember = {
  id: string;
  projectId: string;
  memberId: string;
  projectRole: string;
  assignedLp: number;
  earnedLp: number;
  exp: number;
  joinedAt: Date;
  project: Order;
  member: TeamMember;
};
