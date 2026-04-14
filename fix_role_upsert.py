import re

with open('D:/LOOP_COMPANY/LOOP/src/app/api/admin/team/[id]/route.ts', 'r', encoding='utf-8') as f:
 content = f.read()

old = """const resolvedRoles = await Promise.all(
 roleNames.map(async (rn) => {
 let role = await prisma.role.findFirst({ where: { name: rn } });
 if (!role) {
 // Auto-create role with sensible defaults
 role = await prisma.role.create({
 data: {
 name: rn,
 displayName: rn,
 description: `Auto-created role: ${rn}`,
 color: "slate",
 level: rn === "admin" ? 90 : rn === "hr" ? 50 : rn === "project_manager" ? 60 : 10,
 isSystem: false,
 },
 });
 console.log(`[PUT /api/admin/team/:id] Auto-created missing Role: "${rn}" (id=${role.id})`);
 }
 return role;
 })
 );
 roleIds = resolvedRoles.map((r) => r.id);"""

new_code = """// Phase 1: fetch all existing roles in one query (avoids N+1)
 const existingRoles = await prisma.role.findMany({
 where: { name: { in: roleNames } },
 select: { id: true, name: true },
 });
 const existingByName = new Map(existingRoles.map((r) => [r.name, r.id]));

 // Phase 2: create any missing roles (race-safe: unique constraint catches duplicates)
 const missingNames = roleNames.filter((rn) => !existingByName.has(rn));
 for (const rn of missingNames) {
 try {
 const created = await prisma.role.create({
 data: {
 name: rn,
 displayName: rn,
 description: `Auto-created role: ${rn}`,
 color: "slate",
 level: ROLE_LEVEL[rn] ?? 10,
 isSystem: false,
 },
 });
 existingByName.set(rn, created.id);
 logger.info("Auto-created missing Role", { roleName: rn, roleId: created.id });
 } catch {
 // Unique constraint violation = another request already created it; re-fetch
 const reFetched = await prisma.role.findFirst({ where: { name: rn }, select: { id: true } });
 if (reFetched) existingByName.set(rn, reFetched.id);
 }
 }

 roleIds = roleNames.map((rn) => existingByName.get(rn)).filter((id): id is string => !!id);"""

if old in content:
 content = content.replace(old, new_code)
 out_path = 'D:/LOOP_COMPANY/LOOP/src/app/api/admin/team/[id]/route.ts'
 with open(out_path, 'w', encoding='utf-8') as f:
 f.write(content)
 print('SUCCESS')
else:
 print('NOT FOUND')
 idx = content.find('roleNames = (body')
 if idx >= 0:
 print(repr(content[idx:idx+600]))
