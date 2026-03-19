"use client";

import { useState } from "react";
import { Link } from "@/i18n/routing";
import {
  ArrowLeft,
  ArrowRight,
  Linkedin,
  Twitter,
  Github,
  Mail,
  Phone,
  Quote,
  Award,
  Briefcase,
  Calendar,
  Users,
  Layers,
  CheckCircle2,
  FolderKanban,
  MapPin,
  CalendarDays,
  Facebook,
  Video,
  ExternalLink,
  Sparkles,
} from "lucide-react";

interface MemberData {
  id: string;
  slug: string;
  name: string;
  role: string;
  bio: string;
  shortBio: string;
  image: string;
  expertise: string[];
  achievements: string[];
  linkedin: string | null;
  twitter: string | null;
  github: string | null;
  roleLevel: number;
  roleCategory: string | null;
  coverImage: string | null;
  quote: string | null;
  email: string | null;
  phone: string | null;
  skills: string[];
  experience: string | null;
  isFeatured: boolean;
  birthDate?: string | null;
  address?: string | null;
  experienceFrom?: number | null;
  facebook?: string | null;
  tiktok?: string | null;
}

interface ProjectData {
  id: string;
  slug: string;
  title: string;
  category: string;
  client: string;
  year: string;
  image: string;
  description: string;
  techStack: string[];
}

interface MemberPageProps {
  member: MemberData;
  projects?: ProjectData[];
  otherMembers: MemberData[];
}

// Role Badge với màu đặc biệt
function RoleBadge({ role, roleLevel }: { role: string; roleLevel: number }) {
  const roleLower = role.toLowerCase();
  const isCEO = roleLower.includes("ceo") || roleLower.includes("giám đốc");
  const isPO = roleLower.includes("po") || roleLower.includes("product owner");
  const isPM = roleLower.includes("pm") || roleLower.includes("project manager");

  const getRoleStyle = () => {
    if (isCEO) return "bg-gradient-to-r from-amber-500 to-yellow-600 text-white border-amber-400";
    if (isPO) return "bg-gradient-to-r from-red-500 to-rose-600 text-white border-red-400";
    if (isPM) return "bg-gradient-to-r from-violet-500 to-purple-600 text-white border-violet-400";
    return "bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-indigo-400";
  };

  const getIcon = () => {
    if (isCEO) return "👑";
    if (isPO) return "🎯";
    if (isPM) return "📊";
    return "💼";
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border ${getRoleStyle()}`}>
      <span>{getIcon()}</span>
      <span>{role}</span>
    </span>
  );
}

// Avatar với khung theo role
function AvatarFrame({ member }: { member: MemberData }) {
  const roleLower = member.role.toLowerCase();
  const isCEO = roleLower.includes("ceo") || roleLower.includes("giám đốc");
  const isPO = roleLower.includes("po") || roleLower.includes("product owner");
  const isPM = roleLower.includes("pm") || roleLower.includes("project manager");

  const getRing = () => {
    if (isCEO) return "ring-4 ring-amber-400 shadow-lg shadow-amber-400/30";
    if (isPO) return "ring-4 ring-red-500 shadow-lg shadow-red-500/30";
    if (isPM) return "ring-4 ring-violet-500 shadow-lg shadow-violet-500/30";
    return "ring-4 ring-indigo-500 shadow-lg shadow-indigo-500/30";
  };

  return (
    <div className="relative">
      <div className={`w-32 h-32 rounded-full overflow-hidden ${getRing()}`}>
        {member.image ? (
          <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-slate-800 flex items-center justify-center">
            <Users size={40} className="text-slate-600" />
          </div>
        )}
      </div>
    </div>
  );
}

// Info Item nhỏ gọn
function InfoItem({ icon: Icon, value }: { icon: typeof Mail; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2 text-slate-400">
      <Icon size={14} />
      <span className="text-sm truncate">{value}</span>
    </div>
  );
}

// Skill Tag nhỏ
function SkillTag({ skill }: { skill: string }) {
  return (
    <span className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-xs">
      {skill}
    </span>
  );
}

// Project Card nhỏ gọn
function ProjectCard({ project }: { project: ProjectData }) {
  return (
    <Link href={`/portfolio/${project.slug}`} className="group block">
      <div className="flex gap-4 p-3 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-indigo-500/50 transition-all">
        {/* Ảnh nhỏ */}
        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
          <img src={project.image} alt={project.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
        </div>

        {/* Thông tin */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-white text-sm truncate group-hover:text-indigo-400 transition-colors">
            {project.title}
          </h4>
          <p className="text-slate-500 text-xs mt-0.5">{project.category} • {project.year}</p>
          <div className="flex gap-1 mt-1.5">
            {project.techStack.slice(0, 2).map((tech) => (
              <span key={tech} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-500">
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}

// Achievement Item nhỏ
function AchievementItem({ achievement }: { achievement: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Award size={14} className="text-amber-400 flex-shrink-0" />
      <span className="text-slate-300">{achievement}</span>
    </div>
  );
}

export function MemberPage({ member, projects = [], otherMembers }: MemberPageProps) {
  const roleLower = member.role.toLowerCase();
  const isSpecialRole = roleLower.includes("ceo") || roleLower.includes("giám đốc") ||
    roleLower.includes("po") || roleLower.includes("product owner") ||
    roleLower.includes("pm") || roleLower.includes("project manager");

  const memberProjects = projects.length > 0 ? projects : getMockProjects();

  // Format ngày sinh
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString("vi-VN", { day: "numeric", month: "numeric", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header với back button */}
      <div className="border-b border-slate-800/50 bg-slate-900/30 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/team-list" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">Đội ngũ</span>
          </Link>

          {/* Social links nhỏ */}
          <div className="flex items-center gap-2">
            {member.linkedin && (
              <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all">
                <Linkedin size={16} />
              </a>
            )}
            {member.email && (
              <a href={`mailto:${member.email}`} className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all">
                <Mail size={16} />
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* LEFT SIDEBAR - Avatar & Info */}
          <div className="lg:col-span-4">
            <div className="sticky top-24">
              {/* Avatar Section */}
              <div className="text-center mb-6">
                <AvatarFrame member={member} />
              </div>

              {/* Contact Info */}
              <div className="space-y-3 mb-6">
                <InfoItem icon={Mail} value={member.email} />
                <InfoItem icon={Phone} value={member.phone} />
                <InfoItem icon={MapPin} value={member.address} />
                {member.birthDate && <InfoItem icon={CalendarDays} value={formatDate(member.birthDate)} />}
                {member.experienceFrom && <InfoItem icon={Briefcase} value={`${member.experienceFrom} năm kinh nghiệm`} />}
              </div>

              {/* Social Links */}
              <div className="flex flex-wrap gap-2 mb-6">
                {member.linkedin && (
                  <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 text-xs transition-all">
                    <Linkedin size={14} /> LinkedIn
                  </a>
                )}
                {member.github && (
                  <a href={member.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 text-xs transition-all">
                    <Github size={14} /> GitHub
                  </a>
                )}
                {member.facebook && (
                  <a href={member.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 text-xs transition-all">
                    <Facebook size={14} /> Facebook
                  </a>
                )}
              </div>

              {/* Skills */}
              {(member.skills || []).length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-300 mb-3">Kỹ năng</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {(member.skills || []).map((skill) => (
                      <SkillTag key={skill} skill={skill} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT MAIN CONTENT */}
          <div className="lg:col-span-8 space-y-8">

            {/* Header Section */}
            <div>
              <RoleBadge role={member.role} roleLevel={member.roleLevel} />
              <h1 className="text-3xl lg:text-4xl font-bold mt-3">{member.name}</h1>
              <p className="text-indigo-400 mt-1">{member.shortBio}</p>

              {/* Quote */}
              {member.quote && (
                <div className="mt-4 p-4 rounded-xl bg-slate-900/50 border-l-4 border-indigo-500">
                  <p className="text-slate-300 italic text-sm">"{member.quote}"</p>
                </div>
              )}
            </div>

            {/* Bio - Ngắn gọn */}
            {member.bio && (
              <div>
                <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <Briefcase size={18} className="text-indigo-400" />
                  Giới thiệu
                </h2>
                <div className="text-slate-400 text-sm leading-relaxed prose prose-invert prose-sm">
                  {member.bio.split('\n\n').map((para, i) => (
                    <p key={i} className="mb-2">{para}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Expertise - Ngắn gọn dạng tag */}
            {member.expertise.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Sparkles size={18} className="text-indigo-400" />
                  Chuyên môn
                </h2>
                <div className="flex flex-wrap gap-2">
                  {member.expertise.map((skill) => (
                    <span key={skill} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm">
                      <CheckCircle2 size={14} />
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Dự án tiêu biểu - Nhỏ gọn */}
            {memberProjects.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FolderKanban size={18} className="text-emerald-400" />
                  Dự án tiêu biểu
                  <span className="text-slate-500 text-sm font-normal">({memberProjects.length})</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {memberProjects.slice(0, 4).map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
                {memberProjects.length > 4 && (
                  <Link href="/portfolio" className="inline-flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300 mt-3">
                    Xem thêm dự án <ArrowRight size={14} />
                  </Link>
                )}
              </div>
            )}

            {/* Thành tựu - Nhỏ gọn */}
            {member.achievements.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Award size={18} className="text-amber-400" />
                  Thành tựu
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {member.achievements.map((achievement) => (
                    <AchievementItem key={achievement} achievement={achievement} />
                  ))}
                </div>
              </div>
            )}

            {/* Other Members - Nhỏ gọn */}
            {otherMembers.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Users size={18} className="text-blue-400" />
                  Đồng nghiệp
                </h2>
                <div className="flex flex-wrap gap-3">
                  {otherMembers.slice(0, 4).map((m) => (
                    <Link key={m.id} href={`/team/${m.slug}`} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all">
                      <img src={m.image} alt={m.name} className="w-8 h-8 rounded-full object-cover" />
                      <div>
                        <p className="text-sm font-medium text-white">{m.name}</p>
                        <p className="text-xs text-slate-500">{m.role}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="pt-4 border-t border-slate-800">
              <Link href="/contact" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-colors">
                Liên hệ hợp tác <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getMockProjects(): ProjectData[] {
  return [
    {
      id: "1",
      slug: "ecommerce-platform",
      title: "E-commerce Platform",
      category: "Web App",
      client: "RetailCorp",
      year: "2024",
      image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?fit=crop&w=200&h=200",
      description: "Nền tảng thương mại điện tử",
      techStack: ["Next.js", "React", "Node.js"],
    },
    {
      id: "2",
      slug: "healthcare-app",
      title: "Healthcare App",
      category: "Mobile",
      client: "MedTech",
      year: "2024",
      image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?fit=crop&w=200&h=200",
      description: "Ứng dụng y tế",
      techStack: ["React Native", "Firebase"],
    },
    {
      id: "3",
      slug: "real-estate",
      title: "Real Estate Platform",
      category: "Web Platform",
      client: "PropertyHub",
      year: "2023",
      image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?fit=crop&w=200&h=200",
      description: "Nền tảng bất động sản",
      techStack: ["Next.js", "TypeScript"],
    },
  ];
}
