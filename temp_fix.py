import sys
with open('D:/LOOP_COMPANY/LOOP/src/app/api/academy/lessons/[id]/complete/route.ts', 'r', encoding='utf-8') as f:
 content = f.read()

old = ''' await prisma.$transaction(async (tx) => {
 await tx.enrollment.update({
 where: { id: enrollment.id },
 data: { status: "completed" },
 });

 if (memberId) {'''

new = ''' await prisma.$transaction(async (tx) => {
 await tx.enrollment.update({
 where: { id: enrollment.id },
 data: { status: "completed" },
 });

 // Credit sales commission for enrollment completion
 await creditSalesCommissionForEnrollmentTx(enrollment.id, tx);

 if (memberId) {'''

if old in content:
 content = content.replace(old, new, 1)
 with open('D:/LOOP_COMPANY/LOOP/src/app/api/academy/lessons/[id]/complete/route.ts', 'w', encoding='utf-8') as f:
 f.write(content)
 print('SUCCESS')
else:
 print('NOT FOUND')
 idx = content.find('if (memberId)')
 print('Context around if(m):')
 print(repr(content[idx-300:idx+50]))
