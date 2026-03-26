# Data Models — Prisma Schema Reference

> **Source:** `prisma/schema.prisma` | **Updated:** 2026-03-26
> **ORM:** Prisma 7 | **Database:** PostgreSQL (Neon)

---

## Naming Conventions

- Model name: PascalCase singular (`TeamMember`, not `TeamMembers`)
- Table name (via `@map`): snake_case plural
- Fields: camelCase (Prisma default)
- DB columns: snake_case (via `@map`)

---

## Auth & RBAC

### User
```typescript
{
  id: string;              // cuid
  email: string;           // unique
  name: string;
  passwordHash: string | null;  // null for OAuth-only users
  avatar: string | null;
  role: string;            // "user" | "admin" | "ceo" | etc.
  googleId: string | null; // unique, for OAuth linking
  isActive: boolean;
  accountType: "staff" | "customer";
  teamMemberId: string | null;  // linked staff profile

  // Relations
  userRoles: UserRole[];    // many-to-many via junction
  sessions: Session[];
  loginHistory: LoginHistory[];
  auditLogs: AuditLog[];
  notifications: Notification[];
  courseEnrollments: Enrollment[];
  instructorsAsUser: Instructor[];
  eduInstructedCourses: Course[];
}
```

### Role
```typescript
{
  id: string;
  name: string;            // unique, e.g. "admin", "project_manager"
  displayName: string;     // e.g. "Quản trị viên"
  description: string | null;
  color: string;            // badge color, e.g. "indigo"
  level: number;            // hierarchy level (CEO=-1, super_admin=0, admin=1, ...)
  isSystem: boolean;        // system roles cannot be deleted
  permissions: Permission[];
  users: UserRole[];
}
```

### Permission
```typescript
{
  id: string;
  resource: string;        // e.g. "orders", "tasks", "users"
  action: string;          // "create" | "read" | "update" | "delete" | "export" | "approve"
  scope: string;           // "all" | "own" | comma-separated IDs
  description: string | null;
  roleId: string;
  role: Role;
}
```

### UserRole (junction)
```typescript
{
  id: string;
  userId: string;
  roleId: string;
  assignedBy: string | null;  // Admin user who assigned this role
  expiresAt: DateTime | null;  // Optional expiration
  isActive: boolean;
}
```

### Session
```typescript
{
  id: string;
  userId: string;
  token: string;           // unique
  ipAddress: string | null;
  userAgent: string | null;
  lastActiveAt: DateTime;
  expiresAt: DateTime;
}
```

### LoginHistory
```typescript
{
  id: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  location: string | null;
  status: string;          // "success" | "failed"
}
```

---

## Core Content

### Service
```typescript
{
  id: string;
  slug: string;            // unique, URL-safe
  icon: string;            // icon name or URL
  title: string;
  shortDescription: string;
  longDescription: string;
  features: string[];       // array of feature strings
  technologies: string[];  // tech stack
  startingPrice: number;   // VND
  deliveryTime: string;
  category: string;
  isActive: boolean;
  sortOrder: number;
  projects: Project[];
}
```

### Project
```typescript
{
  id: string;
  slug: string;            // unique
  title: string;
  description: string;
  thumbnail: string;
  category: string;
  client: string;
  year: number;
  url: string | null;
  tags: string[];
  isFeatured: boolean;
  serviceId: string | null;
  service: Service | null;
}
```

### Testimonial
```typescript
{
  id: string;
  customerName: string;
  customerRole: string;
  customerAvatar: string | null;
  content: string;
  rating: number;          // 1-5
  isFeatured: boolean;
  isActive: boolean;
  sortOrder: number;
}
```

### ContactMessage
```typescript
{
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  isRead: boolean;
  readAt: DateTime | null;
  createdAt: DateTime;
}
```

### HomeSlider
```typescript
{
  id: string;
  title: string;
  subtitle: string | null;
  image: string;
  link: string | null;
  linkText: string | null;
  isActive: boolean;
  sortOrder: number;
}
```

### HomeVideo
```typescript
{
  id: string;
  title: string;
  url: string;             // video URL
  thumbnail: string | null;
  isActive: boolean;
}
```

### LandingPage
```typescript
{
  id: string;
  slug: string;            // unique
  title: string;
  description: string | null;
  isPublished: boolean;
  sections: LandingSection[];
}
```

### LandingSection
```typescript
{
  id: string;
  landingPageId: string;
  type: string;            // "hero" | "features" | "pricing" | "cta" | etc.
  order: number;
  data: Json;              // flexible section content
}
```

---

## Team & HR

### TeamMember
```typescript
{
  id: string;
  slug: string;            // unique, URL-safe
  name: string;
  role: string;            // job title
  department: string | null;
  bio: string | null;
  avatar: string;
  rank: string;            // "founder" | "senior" | "mid" | "junior"
  xp: number;              // experience points
  lp: number;              // loyalty points
  level: number;
  salary: number | null;    // HR data
  hireDate: DateTime | null;
  phone: string | null;
  isActive: boolean;

  expertises: MemberExpertise[];
  orders: Order[];         // PM orders
  assignedTasks: Task[];   // assigned tasks
  standups: DailyStandup[];
}
```

### Expertise
```typescript
{
  id: string;
  name: string;            // e.g. "Frontend", "Backend", "Design"
  icon: string | null;
  color: string | null;
  members: MemberExpertise[];
}
```

### MemberExpertise (junction)
```typescript
{
  id: string;
  teamMemberId: string;
  expertiseId: string;
}
```

---

## Commerce & Orders

### Order
```typescript
{
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string | null;
  status: string;          // "pending" | "confirmed" | "processing" | "completed" | "cancelled"
  totalPrice: number;       // VND
  notes: string | null;
  serviceId: string | null;
  projectId: string | null;
  pmId: string | null;     // assigned PM (team member)
  startedAt: DateTime | null;
  completedAt: DateTime | null;
  createdAt: DateTime;
  updatedAt: DateTime;

  attributes: OrderAttribute[];
  payments: Payment[];
  rewards: OrderReward[];
  statusHistory: OrderStatusHistory[];
}
```

### OrderAttribute
```typescript
{
  id: string;
  orderId: string;
  attributeKey: string;    // e.g. "template", "pages", "seo"
  attributeValue: string;  // selected option
  price: number;
}
```

### ServiceAttribute
```typescript
{
  id: string;
  name: string;            // e.g. "Template Type"
  category: string;       // "basic" | "advanced"
  xp: number;             // XP value for gamification
  options: Json;          // selectable options with prices
  sortOrder: number;
}
```

### Quote
```typescript
{
  id: string;
  title: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  totalPrice: number;
  status: string;          // "draft" | "sent" | "approved" | "rejected"
  validUntil: DateTime;
  content: Json | null;
  createdById: string;
  approvedById: string | null;
}
```

### QuoteRequest
```typescript
{
  id: string;
  name: string;
  email: string;
  phone: string;
  requirements: string;
  status: string;          // "pending" | "reviewed" | "quoted"
  createdAt: DateTime;
}
```

### SalesLead
```typescript
{
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  source: string;          // "website" | "referral" | "social" | etc.
  status: string;          // "new" | "contacted" | "qualified" | "lost"
  assignedToId: string | null;
  notes: string | null;
}
```

### Payment
```typescript
{
  id: string;
  orderId: string;
  amount: number;
  method: string;          // "bank_transfer" | "cash" | "momo" | etc.
  status: string;          // "pending" | "confirmed" | "failed"
  paidAt: DateTime | null;
  notes: string | null;
}
```

### OrderStatusHistory
```typescript
{
  id: string;
  orderId: string;
  fromStatus: string | null;
  toStatus: string;
  changedById: string;
  note: string | null;
}
```

### RewardTier
```typescript
{
  id: string;
  name: string;
  description: string | null;
  minXp: number;
  items: Json;             // reward items array
}
```

### OrderReward
```typescript
{
  id: string;
  orderId: string;
  rewardTierId: string;
  xpAwarded: number;
}
```

### ServicePackage
```typescript
{
  id: string;
  name: string;
  description: string | null;
  price: number;
  features: string[];
  isActive: boolean;
}
```

---

## Pricing Calculator

### InfrastructureTier
```typescript
{
  id: string;
  name: string;            // "Basic" | "Pro" | "Enterprise"
  description: string | null;
  price: number;
  features: string[];
  sortOrder: number;
}
```

### FeatureGroup
```typescript
{
  id: string;
  groupName: string;       // e.g. "Giao diện & Trải nghiệm"
  slug: string;
  sortOrder: number;
  isActive: boolean;
  features: Feature[];
}
```

### Feature
```typescript
{
  id: string;
  groupId: string;
  featureName: string;
  description: string | null;
  logicLevel: string;      // "Low" | "Medium" | "High"
  isRequired: boolean;
  sortOrder: number;
  isActive: boolean;
  variants: FeatureVariant[];
}
```

### FeatureVariant
```typescript
{
  id: string;
  featureId: string;
  variantName: string;
  description: string | null;
  price: number;            // VND
  sortOrder: number;
}
```

### PricingWebPackage
```typescript
{
  id: string;
  name: string;
  description: string | null;
  price: number;
  features: string[];
  isPopular: boolean;
  isActive: boolean;
}
```

### PricingComparisonFeature
```typescript
{
  id: string;
  category: string;
  feature: string;
  basic: string | null;    // "✓" | "✗" | text
  pro: string | null;
  enterprise: string | null;
  sortOrder: number;
}
```

### PricingHostingPlan
```typescript
{
  id: string;
  name: string;
  storage: string;
  bandwidth: string;
  price: number;
  isActive: boolean;
}
```

### PricingDomainPrice
```typescript
{
  id: string;
  tld: string;              // ".com", ".vn"
  registrationPrice: number;
  renewalPrice: number;
  transferPrice: number;
  isActive: boolean;
}
```

### PricingDeploymentItem
```typescript
{
  id: string;
  name: string;
  category: string;
  price: number;
  isRequired: boolean;
  sortOrder: number;
}
```

---

## Project Management (JIRA-like)

### Epic
```typescript
{
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: string;          // "active" | "completed" | "archived"
  startDate: DateTime | null;
  endDate: DateTime | null;
  backlogs: Backlog[];
}
```

### Backlog
```typescript
{
  id: string;
  epicId: string | null;
  title: string;
  description: string | null;
  priority: string;        // "low" | "medium" | "high"
  status: string;
  points: number | null;   // story points
}
```

### Task
```typescript
{
  id: string;
  backlogId: string | null;
  title: string;
  description: string | null;
  status: string;          // "todo" | "in_progress" | "in_review" | "done"
  priority: string;        // "low" | "medium" | "high" | "critical"
  assigneeId: string | null;
  reporterId: string | null;
  dueDate: DateTime | null;
  estimatedHours: number | null;
  actualHours: number | null;
  slaDeadline: DateTime | null;
  slaBreached: boolean;
  completedAt: DateTime | null;
  tags: TaskTag[];
  violations: TaskViolation[];
}
```

### TaskTag
```typescript
{ id: string; taskId: string; name: string; color: string; }
```

### TaskViolation
```typescript
{ id: string; taskId: string; type: string; message: string; }
```

### BugNote
```typescript
{
  id: string;
  taskId: string | null;
  title: string;
  description: string | null;
  severity: string;        // "low" | "medium" | "high" | "critical"
  status: string;          // "open" | "in_progress" | "resolved"
  resolvedAt: DateTime | null;
}
```

### Deployment
```typescript
{
  id: string;
  projectId: string;
  environment: string;     // "staging" | "production"
  status: string;          // "pending" | "in_progress" | "success" | "failed"
  version: string | null;
  notes: string | null;
  deployedById: string;
  deployedAt: DateTime | null;
}
```

### FigmaDemo
```typescript
{
  id: string;
  projectId: string;
  title: string;
  url: string;
  status: string;          // "pending" | "approved" | "rejected"
  approvedById: string | null;
  approvedAt: DateTime | null;
  feedback: string | null;
}
```

### EnvFile
```typescript
{
  id: string;
  projectId: string;
  name: string;            // ".env.production"
  content: string;         // encrypted
  version: number;
  updatedById: string;
}
```

### GitCommit
```typescript
{
  id: string;
  projectId: string;
  commitHash: string;
  message: string;
  author: string;
  authorEmail: string;
  committedAt: DateTime;
}
```

### GscMetric
```typescript
{
  id: string;
  projectId: string;
  date: DateTime;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}
```

### SocialPost
```typescript
{
  id: string;
  projectId: string;
  platform: string;       // "facebook" | "instagram" | "twitter"
  content: string;
  status: string;         // "draft" | "scheduled" | "published"
  scheduledAt: DateTime | null;
  publishedAt: DateTime | null;
}
```

### HandoverPackage
```typescript
{
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  files: Json;            // file list
  createdById: string;
  createdAt: DateTime;
}
```

### DailyStandup
```typescript
{
  id: string;
  projectId: string;
  memberId: string;
  date: DateTime;
  yesterday: string;
  today: string;
  blockers: string | null;
}
```

### ProjectMember
```typescript
{ id: string; projectId: string; memberId: string; role: string; }
```

---

## Loyalty Points (LP) & Gamification

### CustomerPoint
```typescript
{
  id: string;
  userId: string;
  balance: number;
  updatedAt: DateTime;
}
```

### PointTransaction
```typescript
{
  id: string;
  accountId: string;
  amount: number;         // positive = credit, negative = debit
  type: string;           // "earn" | "redeem" | "expire" | "adjust"
  description: string | null;
  orderId: string | null;
}
```

### PointActivity
```typescript
{
  id: string;
  name: string;           // "daily_login" | "watch_ad" | "referral"
  description: string | null;
  points: number;
  dailyLimit: number | null;
  isActive: boolean;
}
```

### Advertisement
```typescript
{
  id: string;
  title: string;
  videoUrl: string;
  thumbnail: string;
  duration: number;        // seconds
  rewardPoints: number;
  isActive: boolean;
}
```

### ReferralCode
```typescript
{
  id: string;
  userId: string;          // who created the code
  code: string;            // unique referral code
  rewardPoints: number;
  usedCount: number;
  isActive: boolean;
}
```

### ReferralTracking
```typescript
{
  id: string;
  referralCodeId: string;
  refereeId: string;       // new user who signed up
  rewardGiven: boolean;
  createdAt: DateTime;
}
```

### LpAward
```typescript
{
  id: string;
  projectId: string;
  memberId: string;
  amount: number;
  reason: string;
  status: string;         // "pending" | "approved" | "rejected"
  approvedById: string | null;
  createdAt: DateTime;
}
```

### LpTransfer
```typescript
{
  id: string;
  fromMemberId: string;
  toMemberId: string;
  amount: number;
  reason: string | null;
  status: string;         // "pending" | "completed" | "rejected"
}
```

---

## Education (EDU)

### Course
```typescript
{
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  instructorUserId: string | null;
  price: number;
  isActive: boolean;
  lessons: Lesson[];
  enrollments: Enrollment[];
}
```

### Lesson
```typescript
{
  id: string;
  courseId: string;
  title: string;
  content: string | null;
  videoUrl: string | null;
  duration: number;        // minutes
  order: number;
  isFree: boolean;
}
```

### Instructor
```typescript
{
  id: string;
  name: string;
  bio: string | null;
  avatar: string | null;
  userId: string | null;  // linked User account
}
```

### Enrollment
```typescript
{
  id: string;
  courseId: string;
  userId: string;
  enrolledAt: DateTime;
  status: string;          // "active" | "completed" | "cancelled"
  progress: number;        // percentage
}
```

### Attendance
```typescript
{
  id: string;
  enrollmentId: string;
  lessonId: string;
  attendedAt: DateTime;
}
```

### Feedback
```typescript
{
  id: string;
  courseId: string;
  userId: string;
  rating: number;          // 1-5
  comment: string | null;
  createdAt: DateTime;
}
```

### StudentProgress
```typescript
{
  id: string;
  enrollmentId: string;
  lessonId: string;
  completedAt: DateTime | null;
}
```

### EduPayment
```typescript
{
  id: string;
  enrollmentId: string;
  amount: number;
  method: string;
  status: string;
  paidAt: DateTime | null;
}
```

---

## System & Misc

### AuditLog
```typescript
{
  id: string;
  userId: string | null;
  action: string;         // "create" | "update" | "delete"
  resource: string;       // "orders" | "tasks" | etc.
  resourceId: string | null;
  oldValues: Json | null;
  newValues: Json | null;
  ipAddress: string | null;
  userAgent: string | null;
}
```

### Notification
```typescript
{
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data: Json | null;
  link: string | null;
  isRead: boolean;
  readAt: DateTime | null;
}
```

### SiteSetting
```typescript
{ id: string; key: string; value: string; }
```

### ServerAnalyticsEvent
```typescript
{
  id: string;
  name: string;
  data: Json;
  visitorId: string | null;
  sessionId: string | null;
  createdAt: DateTime;
}
```

### CustomerWebsite
```typescript
{
  id: string;
  userId: string;
  domain: string;
  projectId: string | null;
  status: string;         // "active" | "suspended" | "terminated"
  expiresAt: DateTime | null;
}
```

### WebsiteStats
```typescript
{
  id: string;
  websiteId: string;
  date: DateTime;
  visitors: number;
  pageViews: number;
  bandwidth: number;
}
```
