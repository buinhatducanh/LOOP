/**
 * LOOP Solutions — Auth Service
 * Login / logout / me với BE endpoints
 *
 * BE contract:
 * POST /api/admin/auth/login  → { user: { userId, email, name, avatar, role, roles, permissions, roleLevel } }
 * GET  /api/admin/auth/me    → { user: { userId, email, name, avatar, role, roles, permissions, roleLevel } }
 * POST /api/admin/auth/logout → {}
 */
import { api } from './client';
import type { AuthUser } from '../store/authStore';

// ── BE response shape ─────────────────────────────────────────────────────────
interface BeLoginUser {
  userId: string;
  email: string;
  name: string | null;
  avatar: string | null;
  role: string;
  roles: string[];
  permissions: { resource: string; action: string; scope: string }[];
  roleLevel: number;
}

interface LoginResponse {
  user: BeLoginUser;
  /** JWT token — store in localStorage for client-side auth */
  token: string;
}

interface MeResponse {
  user: BeLoginUser;
}

// ── Mapping: BE → FE AuthUser ─────────────────────────────────────────────────
function mapBeUser(be: BeLoginUser): AuthUser {
  const name = be.name ?? be.email ?? 'User';
  const avatar = be.avatar ?? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;

  // Derive shortName from full name (first word)
  const shortName = name.split(' ')[0] ?? name;

  // Map role string to UserRole (fallback to 'staff')
  const role = (['admin', 'manager', 'staff', 'client'] as const).includes(be.role as typeof be.role)
    ? (be.role as AuthUser['role'])
    : 'staff' as AuthUser['role'];

  // department: infer from roles if manager
  let department: string | undefined;
  if (role === 'manager' && be.roles && be.roles.length > 0) {
    // BE stores role names like 'manager_media', 'manager_marketing'
    const deptRole = be.roles.find(r => r.startsWith('manager_'));
    department = deptRole ? deptRole.replace('manager_', '') : undefined;
  }

  return {
    id: be.userId,
    name,
    shortName,
    email: be.email,
    avatar,
    role,
    department,
    // rank/lpBalance/level: fetched separately after auth
    rank: undefined,
    rankColor: undefined,
    lpBalance: 0,
    level: be.roleLevel ?? 1,
  };
}

// ── Auth service ──────────────────────────────────────────────────────────────
export const authService = {
  /**
   * POST /api/admin/auth/login
   * BE sets HttpOnly cookie + returns user object.
   * FE stores token in localStorage for client-side checks.
   */
  login: async (email: string, password: string): Promise<AuthUser> => {
    const res = await api.post<LoginResponse>('/admin/auth/login', { email, password });

    // Store JWT in localStorage for client-side auth checks
    if (res.token) {
      setToken(res.token);
    }

    const user = mapBeUser(res.user);

    // Also try to enrich with LP balance + rank (non-blocking)
    fetchLpBalanceAndRank(user.id).then(enriched => {
      if (enriched) {
        const updated: AuthUser = { ...user, ...enriched };
        try {
          localStorage.setItem('loop_user', JSON.stringify(updated));
          // Update Navbar LP badge immediately
          import('../app/store/authStore').then(({ useAuthStore }) => {
            useAuthStore.getState().updateUserLpBalance(enriched.lpBalance, enriched.rank, enriched.rankColor);
          }).catch(() => { /* ignore */ });
        } catch { /* ignore */ }
      }
    }).catch(() => { /* not critical */ });

    return user;
  },

  /**
   * GET /api/admin/auth/me
   * Validates session from HttpOnly cookie.
   * Returns enriched user with LP balance + rank if available.
   */
  me: async (): Promise<AuthUser> => {
    const res = await api.get<MeResponse>('/admin/auth/me');
    const user = mapBeUser(res.user);

    // Enrich with LP balance + rank asynchronously (non-blocking)
    fetchLpBalanceAndRank(user.id).then(enriched => {
      if (enriched) {
        const updated: AuthUser = { ...user, ...enriched };
        try {
          localStorage.setItem('loop_user', JSON.stringify(updated));
          import('../app/store/authStore').then(({ useAuthStore }) => {
            useAuthStore.getState().updateUserLpBalance(enriched.lpBalance, enriched.rank, enriched.rankColor);
          }).catch(() => { /* ignore */ });
        } catch { /* ignore */ }
      }
    }).catch(() => { /* not critical */ });

    return user;
  },

  /**
   * POST /api/admin/auth/logout
   * Clears session.
   */
  logout: async (): Promise<void> => {
    await api.post('/admin/auth/logout', {});
  },
};

// ── LP balance helper ─────────────────────────────────────────────────────────
// Fetch LP balance + rank for a user. Returns null if unavailable.
async function fetchLpBalanceAndRank(
  userId: string
): Promise<{ lpBalance: number; rank?: string; rankColor?: string } | null> {
  try {
    // Fetch LP balance from customer points endpoint
    const [pointsRes, rankRes] = await Promise.allSettled([
      api.get<{ balance: number }>(`/customer/points?userId=${userId}`),
      // Rank endpoint if available
      api.get<{ rank?: string; rankColor?: string }>(`/admin/team/${userId}`).catch(() => null),
    ]);

    const lpBalance = pointsRes.status === 'fulfilled' ? (pointsRes.value.balance ?? 0) : 0;
    const rank = rankRes.status === 'fulfilled' ? rankRes.value?.rank : undefined;
    const rankColor = rankRes.status === 'fulfilled' ? rankRes.value?.rankColor : undefined;

    return lpBalance > 0 || rank ? { lpBalance, rank, rankColor } : null;
  } catch {
    return null;
  }
}

// ── Re-export types ───────────────────────────────────────────────────────────
export type { LoginResponse, MeResponse };
