"use client";

import { useState, useMemo, useEffect } from "react";
import { Link } from "@/i18n/routing";
import { useRouter } from "@/i18n/routing";
import {
  ArrowRight,
  Linkedin,
  Twitter,
  Github,
  Mail,
  Quote,
  Sparkles,
  Users,
  Crown,
  Star,
  Search,
  Grid3X3,
  List,
  X,
  Filter,
  Code2,
  Palette,
  Megaphone,
  Target,
  Layers,
  Phone,
} from "lucide-react";
import { useLocale } from "next-intl";

interface TeamMemberData {
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
}

interface Expertise {
  id: string;
  name: string;
  nameVi: string;
  category: string;
  categoryVi: string;
  icon: string | null;
  isActive: boolean;
  sortOrder: number;
}

interface TeamPageProps {
  team: TeamMemberData[];
  expertises?: Expertise[];
  settings?: {
    title?: string;
    subtitle?: string;
  };
}

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <div className={`animate-fade-in ${className}`} style={{ animationDelay: `${delay}s` }}>
      {children}
    </div>
  );
}

function StaggerContainer({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

function SocialLink({ href, icon: Icon }: { href: string; icon: typeof Linkedin }) {
  const isExternal = href.startsWith('http') || href.startsWith('mailto:');

  if (isExternal) {
    return (
      <a href={href} target={href.startsWith('mailto:') ? undefined : "_blank"} rel="noopener noreferrer" className="w-10 h-10 rounded-xl border border-indigo-500/30 bg-indigo-500/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-indigo-400 hover:bg-indigo-500/20 transition-all duration-300" onClick={(e) => e.stopPropagation()}>
        <Icon size={18} />
      </a>
    );
  }

  return (
    <Link href={href} className="w-10 h-10 rounded-xl border border-indigo-500/30 bg-indigo-500/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-indigo-400 hover:bg-indigo-500/20 transition-all duration-300" onClick={(e) => e.stopPropagation()}>
      <Icon size={18} />
    </Link>
  );
}

const categoryIcons: Record<string, typeof Code2> = {
  leadership: Crown,
  engineering: Code2,
  design: Palette,
  marketing: Megaphone,
  product: Target,
  default: Layers,
};

const filterCategories = [
  { id: "all", label: "Tất cả", icon: Users },
  { id: "leadership", label: "Leadership", icon: Crown },
  { id: "engineering", label: "Engineering", icon: Code2 },
  { id: "design", label: "Design", icon: Palette },
  { id: "marketing", label: "Marketing", icon: Megaphone },
  { id: "product", label: "Product", icon: Target },
];

function TeamMemberCard({ member, isCEO = false }: { member: TeamMemberData; isCEO?: boolean }) {
  const router = useRouter();
  const locale = useLocale();

  // Check if member is CEO
  const memberIsCEO = isCEO || member.roleLevel === 0 ||
    member.role.toLowerCase().includes('ceo') ||
    member.role.toLowerCase().includes('founder') ||
    member.role.toLowerCase().includes('giám đốc') ||
    member.role.toLowerCase().includes('chủ tịch');

  // Helper to show "đang cập nhật" if field is missing
  const showValue = (value: string | null | undefined, maxLength = 50) => {
    if (!value || value.trim() === "") return "đang cập nhật";
    return value.length > maxLength ? value.substring(0, maxLength) + "..." : value;
  };

  return (
    <div
      onClick={() => router.push(`/${locale}/team/${member.slug}`)}
      className="cursor-pointer group"
    >
      <div
        className={`relative overflow-hidden rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${
          memberIsCEO
            ? "ring-2 ring-amber-500 shadow-lg shadow-amber-500/20"
            : "ring-1 ring-slate-700 hover:ring-indigo-500/50"
        }`}
        style={{
          aspectRatio: "3/4",
        }}
      >
        {/* Avatar Image - Use member.image (avatar), not coverImage */}
        <div className="absolute inset-0">
          {member.image ? (
            <img
              src={member.image}
              alt={member.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
          ) : (
            <div className="w-full h-full bg-slate-800 flex items-center justify-center">
              <Users size={48} className="text-slate-600" />
            </div>
          )}
        </div>

        {/* Gradient Overlay - Dark at bottom for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />

        {/* Avatar Frame/Border Effect */}
        <div className={`absolute inset-0 ring-1 ${memberIsCEO ? 'ring-amber-500/30' : 'ring-white/5'} rounded-xl`} />

        {/* CEO Badge */}
        {memberIsCEO && (
          <div className="absolute top-3 right-3 z-10">
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500 text-white text-[10px] font-bold shadow-lg">
              <Crown size={10} />
            </div>
          </div>
        )}

        {/* Name & Role at Bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className={`font-bold text-white text-base leading-tight ${
            memberIsCEO ? 'text-amber-400' : ''
          }`}>
            {showValue(member.name, 20)}
          </div>
          <div className="text-slate-400 text-xs mt-1 truncate">
            {showValue(member.role)}
          </div>

          {/* CEO: Show additional info - inline below name */}
          {memberIsCEO && (
            <div className="mt-2 space-y-1">
              {/* Short Bio */}
              <div className="text-slate-300 text-[10px] line-clamp-2">
                {showValue(member.shortBio || member.bio, 60)}
              </div>
              {/* Skills/Expertise - show up to 2 */}
              {(member.skills?.length > 0 || member.expertise?.length > 0) && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {(member.skills || member.expertise || []).slice(0, 2).map((skill: any, idx: number) => (
                    <span key={idx} className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9px]">
                      {typeof skill === 'string' ? skill : (skill.name || skill.nameVi || skill)}
                    </span>
                  ))}
                </div>
              )}
              {/* Quote if available */}
              {member.quote && (
                <div className="text-slate-400 text-[9px] italic mt-1 line-clamp-1">
                  "{showValue(member.quote, 40)}"
                </div>
              )}

              {/* Contact icons for CEO */}
              {(member.email || member.linkedin || member.phone) && (
                <div className="flex gap-1 mt-1">
                  {member.email && (
                    <a href={`mailto:${member.email}`} onClick={(e) => e.stopPropagation()} className="p-1 rounded bg-amber-500/20 text-amber-400 hover:bg-amber-500/30">
                      <Mail size={10} />
                    </a>
                  )}
                  {member.linkedin && (
                    <a href={member.linkedin} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="p-1 rounded bg-amber-500/20 text-amber-400 hover:bg-amber-500/30">
                      <Linkedin size={10} />
                    </a>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hover Effect Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
    </div>
  );
}

// Legacy card components - kept for reference
function LeaderCardGrid({ member }: { member: TeamMemberData }) {
  const router = useRouter();
  return (
    <div className="col-span-full">
      <div onClick={() => router.push(`/team/${member.slug}`)} className="cursor-pointer">
        <div className="relative overflow-hidden rounded-3xl border-2 border-amber-500/50 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/30 shadow-2xl shadow-amber-500/10">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute top-4 right-4 z-20">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold shadow-lg shadow-amber-500/40 animate-pulse">
              <Crown size={16} /> CEO / Founder
            </div>
          </div>
          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-0">
            <div className="relative h-80 lg:h-96 overflow-hidden">
              {(member.coverImage || member.image) ? (
                <img src={member.coverImage || member.image} alt={member.name} className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700" />
              ) : (
                <div className="w-full h-full bg-slate-800 flex items-center justify-center"><Users size={64} className="text-slate-600" /></div>
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/50 to-transparent lg:bg-gradient-to-t lg:from-slate-900 lg:via-slate-900/30 lg:to-transparent" />
              {member.experience && (
                <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs font-medium">
                  <Sparkles size={14} className="text-amber-400" />{member.experience}
                </div>
              )}
            </div>
            <div className="p-8 lg:p-12 flex flex-col justify-center">
              <h3 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white mb-2 group-hover:text-amber-200 transition-colors">{member.name}</h3>
              <p className="text-amber-400 font-bold text-lg mb-4">{member.shortBio}</p>
              {member.quote && (
                <div className="flex gap-4 p-5 bg-amber-500/10 border-l-4 border-amber-500 rounded-r-xl mb-6">
                  <Quote size={24} className="text-amber-400 flex-shrink-0 mt-1" />
                  <p className="text-slate-200 text-lg leading-relaxed italic">"{member.quote}"</p>
                </div>
              )}
              <p className="text-slate-400 text-sm leading-relaxed mb-5 line-clamp-3">{member.bio}</p>
              <div className="flex flex-wrap gap-2 mb-5">
                {(member.skills || member.expertise?.slice(0, 4) || []).map((skill: any) => (
                  <div key={skill.name || skill} className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium text-amber-200 bg-amber-500/20 border border-amber-500/30">
                    {typeof skill === 'string' ? skill : (skill.name || skill.nameVi || skill)}
                    {typeof skill === 'object' && skill.level && <span className="ml-1 text-amber-400">★{skill.level}</span>}
                  </div>
                ))}
              </div>
              <div className="flex gap-2.5">
                {member.linkedin && <SocialLink href={member.linkedin} icon={Linkedin} />}
                {member.twitter && <SocialLink href={member.twitter} icon={Twitter} />}
                {member.github && <SocialLink href={member.github} icon={Github} />}
                {member.email && <SocialLink href={`mailto:${member.email}`} icon={Mail} />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LeaderCardList({ member }: { member: TeamMemberData }) {
  const router = useRouter();
  return (
    <div>
      <div onClick={() => router.push(`/team/${member.slug}`)} className="cursor-pointer">
        <div className="flex gap-5 p-5 rounded-2xl border border-indigo-500/20 bg-slate-900/50 hover:bg-slate-900 hover:border-indigo-500/40 transition-all duration-300">
          <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden">
            {member.image ? (
              <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-slate-800 flex items-center justify-center"><Users size={32} className="text-slate-600" /></div>
            )}
            <div className="absolute inset-0 ring-2 ring-indigo-500/30 rounded-xl" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-white truncate">{member.name}</h3>
              <Crown size={14} className="text-amber-500 flex-shrink-0" />
            </div>
            <p className="text-indigo-400 text-sm font-medium mb-2">{member.role}</p>
            <p className="text-slate-400 text-sm line-clamp-2">{member.shortBio}</p>
          </div>
          <div className="hidden sm:flex gap-2 items-center">
            {member.linkedin && <SocialLink href={member.linkedin} icon={Linkedin} />}
            {member.email && <SocialLink href={`mailto:${member.email}`} icon={Mail} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function MemberCardGrid({ member }: { member: TeamMemberData }) {
  const CategoryIcon = categoryIcons[member.roleCategory || "default"] || Layers;
  const router = useRouter();
  return (
    <div>
      <div onClick={() => router.push(`/team/${member.slug}`)} className="cursor-pointer">
        <div className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 h-full">
          <div className="relative h-64 overflow-hidden">
            {(member.coverImage || member.image) ? (
              <img src={member.coverImage || member.image} alt={member.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
            ) : (
              <div className="w-full h-full bg-slate-800 flex items-center justify-center"><Users size={48} className="text-slate-600" /></div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent" />
            <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
              <span className="px-3 py-1 rounded-full bg-indigo-600/90 backdrop-blur-sm text-white text-xs font-semibold">{member.role}</span>
              {member.isFeatured && <Star size={18} className="text-amber-400 fill-amber-400 drop-shadow-lg" />}
            </div>
            <div className="absolute bottom-4 right-4 w-10 h-10 rounded-xl bg-slate-900/80 backdrop-blur-sm flex items-center justify-center border border-slate-700">
              <CategoryIcon size={18} className="text-indigo-400" />
            </div>
          </div>
          <div className="p-5">
            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-indigo-200 transition-colors">{member.name}</h3>
            <p className="text-indigo-400 text-sm font-medium mb-3">{member.shortBio}</p>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {(() => {
                const skillsList = member.skills || member.expertise || [];
                return skillsList.slice(0, 3).map((skill: any) => (
                  <span key={skill.name || skill} className="px-2 py-1 rounded-md bg-slate-800 text-slate-400 text-xs flex items-center gap-1">
                    {skill.name || skill}
                    {skill.level && <span className="text-indigo-400">★{skill.level}</span>}
                  </span>
                ));
              })()}
              {(() => {
                const skillsLength = (member.skills?.length || member.expertise?.length || 0);
                if (skillsLength > 3) {
                  return <span className="px-2 py-1 rounded-md text-xs font-semibold text-indigo-400">+{skillsLength - 3}</span>;
                }
                return null;
              })()}
            </div>
            <div className="flex gap-2 pt-3 border-t border-slate-800">
              {member.linkedin && <SocialLink href={member.linkedin} icon={Linkedin} />}
              {member.twitter && <SocialLink href={member.twitter} icon={Twitter} />}
              {member.github && <SocialLink href={member.github} icon={Github} />}
              {member.email && <SocialLink href={`mailto:${member.email}`} icon={Mail} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MemberCardList({ member }: { member: TeamMemberData }) {
  const router = useRouter();
  const locale = useLocale();
  return (
    <div>
      <div onClick={() => router.push(`/${locale}/team/${member.slug}`)} className="cursor-pointer">
        <div className="flex gap-5 p-4 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900 hover:border-indigo-500/40 transition-all duration-300">
          <div className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden">
            {member.image ? (
              <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-slate-800 flex items-center justify-center"><Users size={24} className="text-slate-600" /></div>
            )}
            {member.isFeatured && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                <Star size={10} className="text-white fill-white" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-bold text-white truncate">{member.name}</h3>
            </div>
            <p className="text-indigo-400 text-sm font-medium mb-1">{member.role}</p>
            <div className="flex flex-wrap gap-1">
              {(member.skills || member.expertise || []).slice(0, 2).map((skill: any) => (
                <span key={skill.name || skill} className="px-2 py-0.5 rounded bg-slate-800 text-slate-500 text-xs flex items-center gap-1">
                  {skill.name || skill}
                  {skill.level && <span className="text-indigo-400 text-[10px]">★{skill.level}</span>}
                </span>
              ))}
            </div>
          </div>
          <div className="hidden md:flex gap-2 items-center">
            {member.linkedin && <SocialLink href={member.linkedin} icon={Linkedin} />}
            {member.email && <SocialLink href={`mailto:${member.email}`} icon={Mail} />}
            <ArrowRight size={18} className="text-slate-600 group-hover:text-indigo-400 transition-colors" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function TeamPage({ team, expertises = [], settings }: TeamPageProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20; // 4 columns x 5 rows
  const locale = useLocale();

  // Check if member is CEO/Founder
  const isCEO = (member: TeamMemberData) => {
    const roleLower = member.role.toLowerCase();
    return member.roleLevel === 0 || roleLower.includes('ceo') || roleLower.includes('founder') || roleLower.includes('giám đốc') || roleLower.includes('chủ tịch');
  };

  // Gộp tất cả và sắp xếp: CEO lên đầu
  const filteredMembers = useMemo(() => {
    let result = [...team];
    if (activeFilter !== "all") {
      result = result.filter((m) => m.roleCategory === activeFilter);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((m) =>
        m.name.toLowerCase().includes(query) ||
        m.role.toLowerCase().includes(query) ||
        (m.expertise && m.expertise.some((e) => e.toLowerCase().includes(query))) ||
        (m.skills && m.skills.some((s) => s.toLowerCase().includes(query)))
      );
    }
    // Sắp xếp: CEO lên đầu
    return result.sort((a, b) => {
      const aIsCEO = isCEO(a) ? 0 : 1;
      const bIsCEO = isCEO(b) ? 0 : 1;
      return aIsCEO - bIsCEO;
    });
  }, [team, activeFilter, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredMembers.length / ITEMS_PER_PAGE);
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredMembers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredMembers, currentPage]);

  // Reset to page 1 when filter/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <section className="relative py-20 lg:py-28 px-4 sm:px-6 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 left-[20%] w-[600px] h-[600px] rounded-full bg-indigo-500/10 blur-[100px] animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute -top-20 right-[10%] w-[400px] h-[400px] rounded-full bg-pink-500/10 blur-[80px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
        </div>
        <div className="relative max-w-6xl mx-auto text-center">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/30 mb-6">
              <Users size={16} className="text-indigo-400" />
              <span className="text-slate-300 text-sm font-medium">{settings?.subtitle || "Những con người tạo nên sự khác biệt"}</span>
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
              {settings?.title || "Đội Ngũ"}{" "}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">LOOP</span>
            </h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">Chúng tôi là tập thể những chuyên gia đam mê công nghệ, sáng tạo không ngừng để mang đến giải pháp số tốt nhất.</p>
          </FadeIn>
        </div>
      </section>

      <section className="sticky top-16 lg:top-20 z-40 bg-slate-950/80 backdrop-blur-xl border-y border-slate-800/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input type="text" placeholder="Tìm theo tên, kỹ năng..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all" />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-800 transition-colors">
                  <X size={16} className="text-slate-500" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowFilters(!showFilters)} className="lg:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-sm font-medium">
                <Filter size={18} /> Lọc
              </button>
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800">
                <button onClick={() => setViewMode("grid")} className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-white"}`}>
                  <Grid3X3 size={18} />
                </button>
                <button onClick={() => setViewMode("list")} className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-white"}`}>
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>
          <div className={`${showFilters ? "flex" : "hidden"} lg:flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-800/50`}>
            {filterCategories.map((cat) => {
              const Icon = cat.icon;
              return (
                <button key={cat.id} onClick={() => setActiveFilter(cat.id)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${activeFilter === cat.id ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800"}`}>
                  <Icon size={14} />{cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div>
          <FadeIn>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                  <Sparkles size={22} className="text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Thành Viên</h2>
                  <p className="text-slate-500 text-sm">{filteredMembers.length} {filteredMembers.length === 1 ? "người" : "thành viên"}{searchQuery && ` cho "${searchQuery}"`}</p>
                </div>
              </div>
            </div>
          </FadeIn>
          {filteredMembers.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-900 flex items-center justify-center"><Search size={24} className="text-slate-600" /></div>
              <h3 className="text-lg font-semibold text-white mb-2">Không tìm thấy</h3>
              <p className="text-slate-500">Thử tìm kiếm với từ khóa khác</p>
              <button onClick={() => { setSearchQuery(""); setActiveFilter("all"); }} className="mt-4 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition-colors">Xóa bộ lọc</button>
            </div>
          )}
          {/* All Members - 4 columns grid with pagination */}
          {viewMode === "grid" && filteredMembers.length > 0 && (
            <>
              <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {paginatedMembers.map((member) => <TeamMemberCard key={member.id} member={member} />)}
              </StaggerContainer>
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-12">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    ← Trước
                  </button>
                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 rounded-lg transition-colors ${
                          currentPage === page
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Sau →
                  </button>
                </div>
              )}
            </>
          )}
          {viewMode === "list" && filteredMembers.length > 0 && (
            <>
              <StaggerContainer className="grid grid-cols-1 gap-3">
                {paginatedMembers.map((member) => <MemberCardList key={member.id} member={member} />)}
              </StaggerContainer>
              {/* Pagination for list view */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-12">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    ← Trước
                  </button>
                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 rounded-lg transition-colors ${
                          currentPage === page
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Sau →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
      <section className="py-20 px-4 sm:px-6 border-t border-slate-800/50">
        <FadeIn>
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-2xl shadow-indigo-500/30">
              <Users size={32} className="text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Muốn gia nhập đội ngũ?</h2>
            <p className="text-slate-400 mb-8 leading-relaxed">Chúng tôi luôn tìm kiếm những tài năng xuất sắc. Hãy liên hệ nếu bạn muốn tạo ra những sản phẩm tuyệt vời.</p>
            <a href="/contact" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all hover:scale-105">
              Liên hệ ngay <ArrowRight size={18} />
            </a>
          </div>
        </FadeIn>
      </section>
    </div>
  );
}
