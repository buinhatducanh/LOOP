// Auto-generated from Prisma schema — do not edit
// Regenerate: python gen_types.py

import type { Order } from "./commerce";
import type { Task } from "./project";
import type { AddonService } from "./services";
import type { TeamMember } from "./team";

export type LpAward = {
  id: string;
  taskId: string | null;
  projectId: string;
  memberId: string;
  lpAmount: number;
  expAmount: number;
  source: string;
  status: string;
  approvedBy: string | null;
  approvedAt: Date | null;
  rejectedReason: string | null;
  createdAt: Date;
  task: Task | null;
  project: Order;
  member: TeamMember;
  approver: TeamMember | null;
};

export type LpRedemption = {
  id: string;
  memberId: string;
  addonId: string;
  lpCost: number;
  quantity: number;
  expiresAt: Date | null;
  status: string;
  redeemedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  member: TeamMember;
  addon: AddonService;
};

export type LpTransaction = {
  id: string;
  memberId: string;
  amount: number;
  balanceAfter: number;
  type: string;
  status: string;
  description: string | null;
  source: string;
  referenceId: string | null;
  referenceType: string | null;
  counterpartyId: string | null;
  fee: number;
  createdBy: string | null;
  createdAt: Date;
  member: TeamMember;
  counterparty: TeamMember | null;
  creator: TeamMember | null;
};
