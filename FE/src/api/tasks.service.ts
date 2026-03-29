/**
 * LOOP Solutions — Tasks API Service (Kanban board)
 *
 * BE endpoints:
 * GET  /api/admin/tasks               → task list with pagination + filters
 * GET  /api/admin/tasks/[id]           → single task with full relations
 * POST /api/admin/tasks               → create task
 * PATCH /api/admin/tasks/[id]        → update task (status transition, assign, edit)
 * DELETE /api/admin/tasks/[id]         → delete task
 *
 * GET /api/admin/epics               → epic list with backlog + task summary
 * POST /api/admin/epics              → create epic
 */
import { api } from './client';

// ── BE response types ──────────────────────────────────────────────────────────
interface BeBacklog { id: string; name: string; title: string; epicId: string }
interface BeProject { id: string; orderNumber: string; customerName: string }
interface BeTag { id: string; name: string }
interface BeLPAward { id: string; lpAmount: number; status: string }
interface BeViolation { id: string; type: string; revokedLp: number }
interface BeAssignee { id: string; name: string }

export interface BeTask {
  id: string;
  title: string;
  description: string | null;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  status: 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done';
  lp: number;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  assigneeId: string | null;
  backlogId: string;
  backlog: { id: string; name: string; title: string; epicId: string; project: { id: string; orderNumber: string; customerName: string } } | null;
  tags: BeTag[];
  lpAwards: BeLPAward[];
  violations: BeViolation[];
  assignee: BeAssignee | null;
  estimatedHours: number | null;
  branchName: string | null;
  externalId: string | null;
  sortOrder: number | null;
  slaDeadline: string | null;
  violated: boolean;
}

// Map BE status → FE colId
const STATUS_TO_COL: Record<string, string> = {
  backlog: 'backlog',
  todo: 'todo',
  in_progress: 'doing',
  in_review: 'review',
  done: 'done',
};

const COL_TO_STATUS: Record<string, string> = {
  backlog: 'backlog',
  todo: 'todo',
  doing: 'in_progress',
  review: 'in_review',
  done: 'done',
};

// ── FE domain types (matches KanbanBoard Task interface) ──────────────────────
export interface KanbanTask {
  id: string;
  title: string;
  description: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  assigneeIds: number[];
  lp: number;
  dueDate: string;
  tags: string[];
  colId: string;
  comments: number;
  attachments: number;
  checklist: { done: number; total: number };
  // Extra fields from BE
  status: string;
  assigneeName: string | null;
  projectName: string | null;
  orderNumber: string | null;
  branchName: string | null;
}

// ── Mapping ────────────────────────────────────────────────────────────────
function mapTask(be: BeTask): KanbanTask {
  return {
    id: be.id,
    title: be.title,
    description: be.description ?? '',
    priority: be.priority,
    assigneeIds: be.assigneeId ? [parseInt(be.assigneeId)] : [],
    lp: be.lp,
    dueDate: be.dueDate ? be.dueDate.split('T')[0] : '',
    tags: be.tags.map(t => t.name),
    colId: STATUS_TO_COL[be.status] ?? be.status,
    comments: 0,
    attachments: 0,
    checklist: { done: 0, total: 0 },
    status: be.status,
    assigneeName: be.assignee?.name ?? null,
    projectName: be.backlog?.project?.customerName ?? null,
    orderNumber: be.backlog?.project?.orderNumber ?? null,
    branchName: be.branchName ?? null,
  };
}

// ── Service ────────────────────────────────────────────────────────────────
export interface TaskListResult {
  tasks: KanbanTask[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export const tasksService = {
  /**
   * GET /api/admin/tasks?projectId=&status=&priority=&search=&page=1&limit=50
   */
  getTasks: async (params?: {
    projectId?: string;
    status?: string;
    priority?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<TaskListResult> => {
    const q = new URLSearchParams();
    if (params?.projectId) q.set('projectId', params.projectId);
    if (params?.status && params.status !== 'all') q.set('status', params.status);
    if (params?.priority && params.priority !== 'all') q.set('priority', params.priority);
    if (params?.search) q.set('search', params.search);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit ?? 50));
    const qs = q.toString();
    const path = `/admin/tasks${qs ? `?${qs}` : ''}`;
    const res = await api.get<{ data: BeTask[]; total: number; page: number; limit: number; totalPages: number }>(path);
    return {
      tasks: res.data.map(mapTask),
      pagination: { page: res.page, limit: res.limit, total: res.total, totalPages: res.totalPages },
    };
  },

  /**
   * PATCH /api/admin/tasks/[id]
   * Move task between columns or update details.
   */
  updateTask: async (
    id: string,
    data: {
      title?: string;
      description?: string;
      priority?: 'urgent' | 'high' | 'medium' | 'low';
      lp?: number;
      status?: string;
      assigneeId?: string | null;
      dueDate?: string | null;
      sortOrder?: number;
    }
  ): Promise<KanbanTask> => {
    // Map FE colId → BE status if needed
    const payload = {
      ...data,
      status: data.status ? (COL_TO_STATUS[data.status] ?? data.status) : undefined,
    };
    const res = await api.patch<{ data: BeTask }>(`/admin/tasks/${id}`, payload);
    return mapTask(res.data);
  },

  /**
   * POST /api/admin/tasks
   */
  createTask: async (data: {
    backlogId: string;
    title: string;
    description?: string;
    priority?: 'urgent' | 'high' | 'medium' | 'low';
    lp?: number;
    assigneeId?: string;
  }): Promise<KanbanTask> => {
    const res = await api.post<{ data: BeTask }>('/admin/tasks', data);
    return mapTask(res.data);
  },

  /**
   * DELETE /api/admin/tasks/[id]
   */
  deleteTask: async (id: string): Promise<void> => {
    await api.delete(`/admin/tasks/${id}`);
  },

  /**
   * GET /api/admin/epics
   */
  getEpics: async (projectId?: string): Promise<unknown[]> => {
    const qs = projectId ? `?projectId=${projectId}` : '';
    const res = await api.get<{ data: unknown[] }>(`/admin/epics${qs}`);
    return res.data;
  },
};
