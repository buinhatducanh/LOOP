import type { Metadata } from "next";
import { MemberPage } from "./member-page";
import { getTeamMemberBySlug, getTeamMembers, getProjects } from "@/lib/db/queries";
import { mockTeamMembers } from "@/data/teamMockData";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  let member;
  try {
    member = await getTeamMemberBySlug(slug);
  } catch {
    member = mockTeamMembers.find((m) => m.slug === slug);
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
      const allMembers = await getTeamMembers();
      otherMembers = allMembers.filter((m) => m.id !== member!.id).slice(0, 4);

      // Get projects for this team member
      const allProjects = await getProjects();
      projects = allProjects.filter((p: any) => p.teamMemberId === member!.id);
    }
  } catch {
    member = mockTeamMembers.find((m) => m.slug === slug);
    otherMembers = mockTeamMembers.filter((m) => m.slug !== slug).slice(0, 4);
  }

  if (!member) {
    member = mockTeamMembers.find((m) => m.slug === slug);
    otherMembers = mockTeamMembers.filter((m) => m.slug !== slug).slice(0, 4);
  }

  if (!member) notFound();

  return <MemberPage member={member as any} projects={projects as any} otherMembers={otherMembers as any} />;
}
