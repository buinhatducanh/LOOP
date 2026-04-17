import { ReactNode } from "react";
import { CheckCircle2, UserMinus, Clock, AlertTriangle } from "lucide-react";
import { DS } from "@/lib/design-tokens";

export interface TeamMemberBE {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  rank?: string;
  level?: number;
  currentXp?: number;
  maxXp?: number;
  totalApprovedLp?: number;
  availableLp?: number;
  lockedLp?: number;
  role?: string;
  systemRole?: string | null;
  roles?: string[];
  department?: string;
  tabPermissions?: string[];
  phone?: string | null;
  bio?: string | null;
  createdAt: string;
  joinedDate?: string;
  bankName?: string | null;
  bankAccount?: string | null;
  bankAccountName?: string | null;
  missionsCompleted?: number;
  memberExpertise?: { name: string }[];
  lpTransactions?: Array<{
    id: string;
    source: string;
    amount: number;
    status: string;
    description: string | null;
    createdAt: string;
  }>;
  isActive?: boolean;
  imagePublicId?: string | null;
}

export type MemberStatus = "active" | "inactive" | "on-leave" | "probation";
export type ViewMode = "table" | "grid";
export type SortKey = "name" | "level" | "lpBalance" | "missions" | "rank" | "role" | "team" | "status";
export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem { id: number; msg: string; type: ToastType; }

export interface MemberExt extends TeamMemberBE {
  status: MemberStatus;
  team: string;
  joinedDate: string;
  missionsCompleted: number;
  topSkill: string;
  rankHistory: { date: string; from: string; to: string; reason: string }[];
  missionLogs: { date: string; task: string; lpEarned: number }[];
  lpEarned: number;
  lpSpent: number;
}

export const STATUS_CFG: Record<MemberStatus, { label: string; color: string; icon: React.ReactNode }> = {
  active:    { label: "Đang hoạt động", color: DS.green, icon: <CheckCircle2 size={11} /> },
  inactive:  { label: "Không hoạt động", color: "#64748B", icon: <UserMinus size={11} /> },
  "on-leave":{ label: "Tạm nghỉ", color: DS.amber, icon: <Clock size={11} /> },
  probation: { label: "Thử việc", color: DS.purple, icon: <AlertTriangle size={11} /> },
};
