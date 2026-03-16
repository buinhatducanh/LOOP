import type { Metadata } from "next";
import { MemberPage } from "./member-page";
import { getTeamMemberBySlug, getTeamMembers } from "@/lib/db/queries";
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

  try {
    member = await getTeamMemberBySlug(slug);
    if (member) {
      const allMembers = await getTeamMembers();
      otherMembers = allMembers.filter((m) => m.id !== member!.id).slice(0, 4);
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

  return <MemberPage member={member as any} otherMembers={otherMembers as any} />;
}
