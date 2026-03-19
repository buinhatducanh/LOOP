import type { Metadata } from "next";
import { MemberPage } from "../member-page";
import { getTeamMemberBySlug, getTeamMembers, getProjects } from "@/lib/db/queries";
import { notFound } from "next/navigation";

// Placeholder for missing data
const PENDING = "(đang cập nhật)";

// Transform member data from database - show placeholder for missing fields
function transformMember(dbMember: any) {
  return {
    ...dbMember,
    name: dbMember.name || PENDING,
    role: dbMember.role || PENDING,
    bio: dbMember.bio || PENDING,
    shortBio: dbMember.shortBio || PENDING,
    image: dbMember.image || null,
    coverImage: dbMember.coverImage || null,
    expertise: dbMember.expertise || [],
    skills: dbMember.skills || [],
    achievements: dbMember.achievements || [],
    linkedin: dbMember.linkedin || null,
    twitter: dbMember.twitter || null,
    github: dbMember.github || null,
    email: dbMember.email || null,
    phone: dbMember.phone || null,
    quote: dbMember.quote || null,
    experience: dbMember.experience || null,
    roleLevel: dbMember.roleLevel ?? 4,
    roleCategory: dbMember.roleCategory || null,
    isFeatured: dbMember.isFeatured ?? false,
    // HR Fields
    birthDate: dbMember.birthDate || null,
    address: dbMember.address || null,
    cccd: dbMember.cccd || null,
    contractStart: dbMember.contractStart || null,
    experienceFrom: dbMember.experienceFrom || null,
    facebook: dbMember.facebook || null,
    tiktok: dbMember.tiktok || null,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  let member;
  try {
    member = await getTeamMemberBySlug(slug);
    if (member) {
      member = transformMember(member);
    }
  } catch {
    // Ignore error
  }

  if (!member) return { title: "Not Found" };

  return {
    title: `${member.name} — ${member.role} | LOOP`,
    description: member.shortBio,
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;

  let member;
  let otherMembers: any[] = [];
  let projects: any[] = [];

  try {
    member = await getTeamMemberBySlug(slug);
    if (member) {
      member = transformMember(member);

      const allMembers = await getTeamMembers();
      otherMembers = allMembers
        .filter((m) => m.id !== member!.id)
        .slice(0, 4)
        .map((m) => transformMember(m));

      // Get projects for this team member
      const allProjects = await getProjects();
      projects = allProjects.filter((p: any) => p.teamMemberId === member!.id);
    }
  } catch {
    // Ignore error
  }

  // Apply transform even if no member found - will show placeholder
  if (!member) {
    notFound();
  }

  return <MemberPage member={member as any} projects={projects as any} otherMembers={otherMembers as any} />;
}
