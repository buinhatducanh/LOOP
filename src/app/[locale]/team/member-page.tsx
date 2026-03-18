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
  Code2,
  Sparkles,
  ExternalLink,
  Calendar,
  Users,
  Layers,
  CheckCircle2,
  Star,
  Play,
  X,
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
  features: string[];
  results: string;
  screenshots: string[];
}

interface MemberPageProps {
  member: MemberData;
  projects?: ProjectData[];
  otherMembers: MemberData[];
}

// Animation components
function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <div className="animate-fade-in" style={{ animationDelay: `${delay}s` }}>
      {children}
    </div>
  );
}

function SlideIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <div className="animate-fade-in" style={{ animationDelay: `${delay}s` }}>
      {children}
    </div>
  );
}

// Social Button Component
function SocialBtn({ href, icon: Icon, label }: { href: string; icon: typeof Linkedin; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-slate-400 hover:text-white hover:bg-indigo-500/20 hover:border-indigo-400 transition-all duration-300 hover:scale-105 hover:-translate-y-0.5"
    >
      <Icon size={18} />
      <span className="text-sm font-medium">{label}</span>
    </a>
  );
}

// Project Card Component
function ProjectCard({ project, index }: { project: ProjectData; index: number }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="group relative animate-fade-in"
      style={{ animationDelay: `${index * 0.1}s` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/portfolio/${project.slug}`}>
        <div
          className="relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition-all duration-300 hover:-translate-y-2"
        >
          {/* Project Image */}
          <div className="relative h-56 overflow-hidden">
            <img
              src={project.image}
              alt={project.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent" />

            {/* Category Badge */}
            <div className="absolute top-4 left-4">
              <span className="px-3 py-1 rounded-full bg-indigo-600/90 backdrop-blur-sm text-white text-xs font-semibold">
                {project.category}
              </span>
            </div>

            {/* Year */}
            <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900/80 backdrop-blur-sm">
              <Calendar size={12} className="text-slate-400" />
              <span className="text-xs font-medium text-slate-300">{project.year}</span>
            </div>

            {/* Play Button Overlay */}
            {isHovered && (
              <div
                className="absolute inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in"
              >
                <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/50">
                  <Play size={24} className="text-white ml-1" fill="white" />
                </div>
              </div>
            )}
          </div>

          {/* Project Info */}
          <div className="p-5">
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-indigo-200 transition-colors">
              {project.title}
            </h3>
            <p className="text-slate-400 text-sm mb-4 line-clamp-2">{project.description}</p>

            {/* Tech Stack */}
            <div className="flex flex-wrap gap-2">
              {project.techStack.slice(0, 3).map((tech) => (
                <span
                  key={tech}
                  className="px-2 py-1 rounded-md bg-slate-800 text-slate-400 text-xs"
                >
                  {tech}
                </span>
              ))}
              {project.techStack.length > 3 && (
                <span className="px-2 py-1 rounded-md text-xs font-semibold text-indigo-400">
                  +{project.techStack.length - 3}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

// Stats Counter Component
function StatItem({ value, label, delay }: { value: string; label: string; delay: number }) {
  return (
    <div
      className="text-center animate-fade-in"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-1">
        {value}
      </div>
      <div className="text-slate-500 text-sm">{label}</div>
    </div>
  );
}

export function MemberPage({ member, projects = [], otherMembers }: MemberPageProps) {
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);

  const roleBadgeColors: Record<number, string> = {
    0: "from-amber-500 to-red-500",
    1: "from-indigo-500 to-purple-500",
    2: "from-blue-500 to-cyan-500",
    3: "from-emerald-500 to-teal-500",
    4: "from-slate-500 to-slate-600",
  };

  const memberProjects = projects.length > 0 ? projects : getMockProjects();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* ── Hero Cover Section ── */}
      <section className="relative h-[50vh] lg:h-[60vh] overflow-hidden">
        {/* Cover Image */}
        <div className="absolute inset-0">
          <img
            src={member.coverImage || "https://images.unsplash.com/photo-1497366216548-37526070297c?fit=crop&w=1920&h=800"}
            alt={member.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/30 via-slate-950/60 to-slate-950" />
        </div>

        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute -top-20 left-[20%] w-[400px] h-[400px] rounded-full bg-indigo-500/10 blur-[80px] animate-pulse"
          />
          <div
            className="absolute -top-10 right-[10%] w-[300px] h-[300px] rounded-full bg-pink-500/10 blur-[60px] animate-pulse"
            style={{ animationDelay: "2s" }}
          />
        </div>

        {/* Back Button */}
        <div
          className="absolute top-6 left-6 z-10 animate-fade-in"
        >
          <Link
            href="/team-list"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/80 backdrop-blur-sm border border-slate-800 text-slate-300 hover:text-white hover:border-indigo-500/50 transition-all"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">Đội ngũ</span>
          </Link>
        </div>

        {/* Member Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-12">
          <div className="max-w-6xl mx-auto">
            <FadeIn>
              {/* Role Badge */}
              <div className="flex items-center gap-3 mb-4">
                <span className={`px-4 py-1.5 rounded-full bg-gradient-to-r ${roleBadgeColors[member.roleLevel] || roleBadgeColors[4]} text-white text-sm font-bold shadow-lg`}>
                  {member.role}
                </span>
                {member.isFeatured && (
                  <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-sm font-medium">
                    <Star size={14} className="fill-amber-400" /> Featured
                  </span>
                )}
              </div>
            </FadeIn>

            <FadeIn delay={0.1}>
              <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight mb-3">
                {member.name}
              </h1>
            </FadeIn>

            <FadeIn delay={0.2}>
              <p className="text-xl lg:text-2xl text-indigo-300 font-medium mb-6">
                {member.shortBio}
              </p>
            </FadeIn>

            <FadeIn delay={0.3}>
              <div className="flex flex-wrap gap-3">
                {member.linkedin && <SocialBtn href={member.linkedin} icon={Linkedin} label="LinkedIn" />}
                {member.twitter && <SocialBtn href={member.twitter} icon={Twitter} label="Twitter" />}
                {member.github && <SocialBtn href={member.github} icon={Github} label="GitHub" />}
                {member.email && <SocialBtn href={`mailto:${member.email}`} icon={Mail} label={member.email} />}
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── Stats Section ── */}
      <section className="py-12 border-y border-slate-800/50 bg-slate-900/30">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <StatItem value="10+" label="Năm kinh nghiệm" delay={0} />
            <StatItem value={`${memberProjects.length}`} label="Dự án hoàn thành" delay={0.1} />
            <StatItem value="50+" label="Khách hàng" delay={0.2} />
            <StatItem value="100%" label="Sự hài lòng" delay={0.3} />
          </div>
        </div>
      </section>

      {/* ── Quote Section ── */}
      {member.quote && (
        <section className="py-16 px-6">
          <FadeIn>
            <div className="max-w-3xl mx-auto">
              <div className="relative p-8 lg:p-12 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-pink-500/10 rounded-3xl border border-indigo-500/20">
                <Quote size={48} className="text-indigo-500/30 absolute top-6 left-6" />
                <blockquote className="relative z-10">
                  <p className="text-2xl lg:text-3xl font-medium text-white leading-relaxed italic text-center">
                    &ldquo;{member.quote}&rdquo;
                  </p>
                </blockquote>
              </div>
            </div>
          </FadeIn>
        </section>
      )}

      {/* ── About & Experience Section ── */}
      <section className="py-16 px-6 bg-slate-900/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Bio */}
            <FadeIn>
              <div className="p-6 lg:p-8 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
                    <Briefcase size={20} className="text-white" />
                  </div>
                  <h2 className="text-xl font-bold">Về tôi</h2>
                </div>
                <p className="text-slate-400 leading-relaxed">{member.bio}</p>
              </div>
            </FadeIn>

            {/* Experience */}
            {member.experience && (
              <FadeIn delay={0.1}>
                <div className="p-6 lg:p-8 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center">
                      <Code2 size={20} className="text-white" />
                    </div>
                    <h2 className="text-xl font-bold">Kinh nghiệm</h2>
                  </div>
                  <p className="text-slate-400 leading-relaxed">{member.experience}</p>
                </div>
              </FadeIn>
            )}
          </div>
        </div>
      </section>

      {/* ── Expertise & Skills ── */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-3">
                Chuyên môn & <span className="text-indigo-400">Kỹ năng</span>
              </h2>
              <p className="text-slate-500">Những gì tôi mang lại cho dự án</p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Expertise */}
            <FadeIn>
              <div className="p-6 lg:p-8 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                    <Sparkles size={24} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold">Chuyên môn</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {member.expertise.map((skill, index) => (
                    <div
                      key={skill}
                      className="flex items-center gap-3 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 animate-fade-in"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <CheckCircle2 size={18} className="text-indigo-400 flex-shrink-0" />
                      <span className="text-indigo-200 font-medium text-sm">{skill}</span>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>

            {/* Skills */}
            <FadeIn delay={0.1}>
              <div className="p-6 lg:p-8 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Layers size={24} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold">Kỹ năng</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(member.skills || []).map((skill, index) => (
                    <span
                      key={skill}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm font-medium border border-slate-700 hover:border-indigo-500/50 hover:text-white transition-all cursor-default animate-fade-in"
                      style={{ animationDelay: `${index * 0.03}s` }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── Projects Portfolio ── */}
      <section className="py-16 px-6 bg-slate-900/30">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-12">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                    <Briefcase size={24} className="text-white" />
                  </div>
                  <h2 className="text-3xl font-bold">
                    Dự án <span className="text-emerald-400">tiêu biểu</span>
                  </h2>
                </div>
                <p className="text-slate-500">Những dự án tôi đã tham gia phát triển</p>
              </div>
              <Link
                href="/portfolio"
                className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <span className="text-sm font-medium">Xem tất cả dự án</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {memberProjects.map((project, index) => (
              <ProjectCard key={project.id} project={project} index={index} />
            ))}
          </div>

          {memberProjects.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-500">Chưa có dự án nào được hiển thị</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Achievements ── */}
      {member.achievements.length > 0 && (
        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto">
            <FadeIn>
              <div className="text-center mb-12">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                    <Award size={24} className="text-white" />
                  </div>
                  <h2 className="text-3xl font-bold">Thành tựu</h2>
                </div>
                <p className="text-slate-500">Những giải thưởng và chứng nhận</p>
              </div>
            </FadeIn>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {member.achievements.map((achievement, index) => (
                <div
                  key={achievement}
                  className="flex items-center gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/30 transition-all animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center flex-shrink-0">
                    <Award size={20} className="text-amber-400" />
                  </div>
                  <span className="text-slate-200 font-medium">{achievement}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Other Team Members ── */}
      {otherMembers.length > 0 && (
        <section className="py-16 px-6 bg-slate-900/30">
          <div className="max-w-6xl mx-auto">
            <FadeIn>
              <div className="text-center mb-12">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                    <Users size={24} className="text-white" />
                  </div>
                  <h2 className="text-3xl font-bold">
                    Đồng nghiệp <span className="text-blue-400">khác</span>
                  </h2>
                </div>
                <p className="text-slate-500">Gặp gỡ các thành viên khác trong đội ngũ</p>
              </div>
            </FadeIn>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {otherMembers.slice(0, 4).map((member, index) => (
                <div
                  key={member.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <Link href={`/team/${member.slug}`}>
                    <div
                      className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition-all hover:-translate-y-1"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={member.image}
                          alt={member.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div>
                          <h4 className="font-semibold text-white text-sm">{member.name}</h4>
                          <p className="text-slate-500 text-xs">{member.role}</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA Section ── */}
      <section className="py-20 px-6 border-t border-slate-800/50">
        <FadeIn>
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Muốn hợp tác?</h2>
            <p className="text-slate-400 mb-8">
              Hãy liên hệ với chúng tôi để thảo luận về dự án của bạn
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow-lg shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-transform"
              >
                Liên hệ ngay <ArrowRight size={18} />
              </a>
              <a
                href="/portfolio"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white font-semibold hover:border-indigo-500/50 transition-all hover:scale-105 active:scale-95"
              >
                Xem portfolio
              </a>
            </div>
          </div>
        </FadeIn>
      </section>
    </div>
  );
}

// Mock projects for demo
function getMockProjects(): ProjectData[] {
  return [
    {
      id: "1",
      slug: "ecommerce-platform",
      title: "E-commerce Platform",
      category: "Web App",
      client: "RetailCorp",
      year: "2024",
      image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?fit=crop&w=800&h=500",
      description: "Nền tảng thương mại điện tử đa quốc gia với hệ thống thanh toán, quản lý đơn hàng và kho hàng.",
      techStack: ["Next.js", "React", "Node.js", "PostgreSQL", "Stripe"],
      features: ["Thanh toán trực tuyến", "Quản lý kho", "Báo cáo analytics"],
      results: "Tăng 200% doanh số trong 6 tháng đầu",
      screenshots: [],
    },
    {
      id: "2",
      slug: "healthcare-app",
      title: "Healthcare Mobile App",
      category: "Mobile App",
      client: "MedTech Vietnam",
      year: "2024",
      image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?fit=crop&w=800&h=500",
      description: "Ứng dụng y tế kết nối bệnh nhân với bác sĩ, đặt lịch khám và tư vấn trực tuyến.",
      techStack: ["React Native", "Firebase", "AWS", "TensorFlow"],
      features: ["Đặt lịch khám", "Tư vấn video", "Nhắc nhở thuốc"],
      results: "Hơn 100,000 người dùng đăng ký",
      screenshots: [],
    },
    {
      id: "3",
      slug: "real-estate-platform",
      title: "Real Estate Platform",
      category: "Web Platform",
      client: "PropertyHub",
      year: "2023",
      image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?fit=crop&w=800&h=500",
      description: "Nền tảng bất động sản với tính năng tìm kiếm, so sánh và giao dịch trực tuyến.",
      techStack: ["Next.js", "TypeScript", "Prisma", "PostgreSQL"],
      features: ["Tìm kiếm thông minh", "VR Tour", "Tính toán khoản vay"],
      results: "Top 3 nền tảng BĐS tại Việt Nam",
      screenshots: [],
    },
  ];
}
