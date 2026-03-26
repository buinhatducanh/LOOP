// Auto-generated from Prisma schema — do not edit
// Regenerate: python gen_types.py

export type AuditLog = {
  id: string;
  userId: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
};

export type Notification = {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  link: string | null;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
};

export type Role = {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  color: string;
  level: number;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type Permission = {
  id: string;
  resource: string;
  action: string;
  scope: string;
  description: string | null;
  roleId: string;
};

export type UserRole = {
  id: string;
  userId: string;
  roleId: string;
  assignedBy: string | null;
  expiresAt: Date | null;
  isActive: boolean;
  createdAt: Date;
};

export type Session = {
  id: string;
  userId: string;
  token: string;
  ipAddress: string | null;
  userAgent: string | null;
  lastActiveAt: Date;
  expiresAt: Date;
  createdAt: Date;
};

export type LoginHistory = {
  id: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  location: string | null;
  status: string;
  createdAt: Date;
};
