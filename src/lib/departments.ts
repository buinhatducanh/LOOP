/**
 * Department utilities — loads from DB with in-memory cache.
 *
 * Static config lives in roles.ts (DEPARTMENTS array) for
 * initial load / edge cases. This utility provides live DB data
 * with 60-second TTL cache, ideal for admin pages.
 *
 * Usage:
 *   import { getDepartments } from "@/lib/departments";
 *   const depts = await getDepartments(); // cached
 */
import { prisma } from "@/lib/prisma";

// In-memory cache: refreshed every 60 seconds
let _cache: Array<{
  id: string;
  key: string;
  name: string;
  shortName: string;
  color: string;
  description: string | null;
  mission: string | null;
  headId: string | null;
  memberCount: number;
}> | null = null;
let _cacheAt = 0;
const TTL_MS = 60_000; // 60 seconds

export interface DepartmentRecord {
  id: string;
  key: string;
  name: string;
  shortName: string;
  color: string;
  description: string | null;
  mission: string | null;
  headId: string | null;
  memberCount: number;
}

/** Get all departments from DB with in-memory cache. */
export async function getDepartments(): Promise<DepartmentRecord[]> {
  const now = Date.now();
  if (_cache && now - _cacheAt < TTL_MS) {
    return _cache;
  }

  const departments = await prisma.department.findMany({
    include: {
      _count: { select: { members: true } },
      memberDepartments: {
        where: { isDeptHead: true },
        select: { memberId: true },
      },
    },
    orderBy: { key: "asc" },
  });

  _cache = departments.map((d: typeof departments[number]) => ({
    id: d.id,
    key: d.key ?? "",
    name: d.name ?? "",
    shortName: d.shortName ?? "",
    color: d.color ?? "#3B82F6",
    description: d.description ?? null,
    mission: d.mission ?? null,
    headId: d.memberDepartments[0]?.memberId ?? null,
    memberCount: d._count.members,
  }));
  _cacheAt = now;
  return _cache!;
}

/** Invalidate the in-memory cache (call after department mutations). */
export function invalidateDepartmentCache(): void {
  _cache = null;
  _cacheAt = 0;
}

/**
 * Get a single department by key or id.
 * Uses the cached list when available.
 */
export async function getDepartment(
  keyOrId: string
): Promise<DepartmentRecord | null> {
  const depts = await getDepartments();
  return depts.find((d: DepartmentRecord) => d.key === keyOrId || d.id === keyOrId) ?? null;
}

/**
 * Get department members for a given department id.
 * Returns array of member records with rank/level info.
 */
export async function getDepartmentMembers(deptId: string): Promise<
  Array<{
    id: string;
    name: string;
    image: string | null;
    rank: string;
    level: number;
    role: string;
    departmentId: string | null;
    isDeptHead: boolean;
    tabPermissions: string[];
  }>
> {
  const members = await prisma.teamMember.findMany({
    where: { departmentId: deptId },
    select: {
      id: true,
      name: true,
      image: true,
      rank: true,
      level: true,
      role: true,
      departmentId: true,
      tabPermissions: true,
      memberDepartments: {
        where: { departmentId: deptId },
        select: { isDeptHead: true },
      },
    },
    orderBy: { sortOrder: "asc" },
  });
  return members.map((m: {
    id: string;
    name: string;
    image: string | null;
    rank: string;
    level: number;
    role: string;
    departmentId: string | null;
    tabPermissions: string[];
    memberDepartments: { isDeptHead: boolean }[];
  }) => ({
    id: m.id,
    name: m.name,
    image: m.image,
    rank: m.rank,
    level: m.level,
    role: m.role,
    departmentId: m.departmentId,
    isDeptHead: m.memberDepartments.some((md: { isDeptHead: boolean }) => md.isDeptHead),
    tabPermissions: m.tabPermissions,
  }));
}