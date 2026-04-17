import { prisma } from "../src/lib/prisma";

async function main() {
 const courses = await prisma.course.findMany({
 where: { status: "published" },
 select: { id: true, title: true, instructorId: true, instructorMemberId: true },
 });
 console.log("Published courses:", courses.length);
 courses.forEach((c) => console.log(" -", c.id, "|", c.title, "| instr:", c.instructorId, "| mem:", c.instructorMemberId));

 const instructors = await prisma.instructor.findMany({
 select: { id: true, name: true, memberId: true, userId: true },
 });
 console.log("Instructors:", instructors.length);
 instructors.forEach((i) => console.log(" -", i.id, "|", i.name, "| member:", i.memberId, "| user:", i.userId));
}

main().catch(console.error);
