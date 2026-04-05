/**
 * API Response Field Mappings
 *
 * Conventions:
 * - Prisma model fields = authoritative (e.g. `image` for TeamMember avatars)
 * - API response fields = FE-friendly (e.g. `avatar`)
 * - Helper functions here ensure every API response maps DB fields → FE fields consistently
 *
 * RULE: Every API route that returns a TeamMember or Instructor MUST expose `avatar`
 *       (not `image`) so FE components can read `m.avatar` without null checks.
 *
 * Usage:
 *   import { addAvatar } from "@/lib/api/mappings";
 *
 *   // Single object
 *   return ok(addAvatar(member));
 *
 *   // List
 *   return list(members.map(addAvatar), pagination);
 *
 *   // With custom fields
 *   return ok({ ...addAvatar(member), extra: value });
 */

/** Add `avatar` field to any object that has `image` (maps Prisma → FE convention) */
export function addAvatar<T extends Record<string, unknown>>(
  obj: T & { image?: string | null }
): T & { avatar: string | null } {
  return { ...obj, avatar: obj.image ?? null };
}

/** Add `avatar` field to an array of objects that each have `image` */
export function addAvatarToList<T extends Record<string, unknown>>(
  list: (T & { image?: string | null })[]
): (T & { avatar: string | null })[] {
  return list.map(addAvatar);
}

/** Add `avatar` field from a nested path (e.g. instructor.avatar = instructor.member?.image) */
export function addAvatarFromField<T extends Record<string, unknown>>(
  obj: T,
  sourceKey: keyof T
): T & { avatar: string | null } {
  const val = obj[sourceKey];
  return { ...obj, avatar: (val == null ? null : (val as string)) };
}

/** Map instructor list: avatar comes from member.image, not instructor.image */
export function addInstructorAvatar(inst: Record<string, unknown>): Record<string, unknown> & { avatar: string | null } {
  const memberImage = (inst.member as Record<string, unknown> | null)?.image as string | null | undefined;
  return { ...inst, avatar: memberImage ?? null };
}

/** Map instructor list: avatar comes from member.image, not instructor.image */
export function addInstructorAvatarToList(
  list: Record<string, unknown>[]
): (Record<string, unknown> & { avatar: string | null })[] {
  return list.map(addInstructorAvatar);
}
