import { useParams, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { useState, CSSProperties, useEffect } from 'react';
import { members, RANKS, RankKey } from './components/team/memberData';
import { useI18n } from '@/hooks/useI18n';
import { LEDRunner } from './components/team/LEDRunner';
import { Counter } from './components/team/Counter';
import { GUILD_ANIMATIONS_CSS } from './components/team/MemberCard';
import {
  ArrowLeft, Shield, Zap, Target, Trophy, Cpu, Award, Terminal,
  Github, Linkedin, Globe, Mail, CheckCircle, Clock, XCircle,
  Briefcase, GraduationCap, Star, Calendar, ExternalLink, GitBranch,
  Languages, BookOpen, Code2, MapPin,
} from 'lucide-react';

// ── Inline CornerDeco (mirrors MemberCard) ────────────────────────────────
function CornerDeco({ color, opacity = 1 }: { color: string; opacity?: number }) {
  const s: CSSProperties = { borderColor: color, opacity, transition: 'opacity 0.25s ease' };
  return (
    <>
      <div className="absolute top-0 left-0 w-5 h-5 border-t-[1.5px] border-l-[1.5px] pointer-events-none" style={{ ...s, zIndex: 15 }} />
      <div className="absolute top-0 right-0 w-5 h-5 border-t-[1.5px] border-r-[1.5px] pointer-events-none" style={{ ...s, zIndex: 15 }} />
      <div className="absolute bottom-0 left-0 w-5 h-5 border-b-[1.5px] border-l-[1.5px] pointer-events-none" style={{ ...s, zIndex: 15 }} />
      <div className="absolute bottom-0 right-0 w-5 h-5 border-b-[1.5px] border-r-[1.5px] pointer-events-none" style={{ ...s, zIndex: 15 }} />
    </>
  );
}

// ── Inline RankBadge ──────────────────────────────────────────────────────
function RankBadge({ rank }: { rank: RankKey }) {
  const cfg = RANKS[rank];
  return (
    <div
      className="flex items-center gap-1 px-2 py-0.5 rounded-sm"
      style={{
        backgroundImage: `linear-gradient(135deg, ${cfg.gradientFrom}22, ${cfg.gradientTo}22)`,
        border: `1px solid ${cfg.color}55`,
        backdropFilter: 'blur(4px)',
      }}
    >
      <span style={{ color: cfg.color, fontSize: 10 }}>{cfg.symbol}</span>
      <span style={{ color: cfg.color, fontSize: 9, letterSpacing: '0.15em', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
        {cfg.label}
      </span>
    </div>
  );
}

// ── Supplemental CV data per member ──────────────────────────────────────
interface WorkEntry {
  company: string;
  role: string;
  period: string;
  description: string;
  techStack: string[];
}
interface EducationEntry {
  school: string;
  degree: string;
  year: string;
}
interface CertEntry {
  name: string;
  issuer: string;
  year: string;
  color: string;
}
interface ProjectEntry {
  name: string;
  description: string;
  techStack: string[];
  liveUrl?: string;
  repoUrl?: string;
  stars?: number;
  status: 'shipped' | 'wip' | 'archived';
}
interface LanguageEntry {
  lang: string;
  level: string;
  pct: number;
}
interface ContactInfo {
  github: string;
  linkedin: string;
  portfolio: string;
  email: string;
  location: string;
}

interface CVData {
  availability: 'open' | 'hired' | 'unavailable';
  yearsOfExp: number;
  contact: ContactInfo;
  workExperience: WorkEntry[];
  education: EducationEntry[];
  certifications: CertEntry[];
  featuredProjects: ProjectEntry[];
  languages: LanguageEntry[];
}

const CV_DATA: Record<number, CVData> = {
  1: {
    availability: 'open',
    yearsOfExp: 1,
    contact: { github: 'github.com/kai-tanaka', linkedin: 'linkedin.com/in/kai-tanaka', portfolio: 'kai-dev.io', email: 'kai@guild.dev', location: 'Tokyo, Japan' },
    workExperience: [
      { company: 'NeonSaga Guild', role: 'Junior Frontend Developer', period: 'Nov 2025 – Present', description: 'Building interactive UI components and landing pages using Vue.js and Tailwind CSS. Collaborating with design team to implement pixel-perfect interfaces.', techStack: ['Vue.js', 'Tailwind CSS', 'TypeScript'] },
    ],
    education: [
      { school: 'Tokyo Institute of Technology', degree: 'B.Sc. Computer Science', year: '2025' },
    ],
    certifications: [
      { name: 'Meta Frontend Developer Certificate', issuer: 'Meta / Coursera', year: '2025', color: '#3B82F6' },
      { name: 'Figma Essentials', issuer: 'Figma', year: '2025', color: '#9333EA' },
    ],
    featuredProjects: [
      { name: 'AniTracker', description: 'Anime & manga progress tracker with social features. Built as a graduation capstone project.', techStack: ['Vue.js', 'Firebase', 'Tailwind'], repoUrl: 'github.com/kai-tanaka/anitracker', stars: 42, status: 'shipped' },
      { name: 'CSS Playground', description: 'Interactive CSS animation explorer with 50+ preset effects and live code editor.', techStack: ['HTML', 'CSS', 'Vanilla JS'], liveUrl: 'css-play.kai-dev.io', repoUrl: 'github.com/kai-tanaka/css-playground', stars: 28, status: 'shipped' },
    ],
    languages: [
      { lang: 'Japanese', level: 'Native', pct: 100 },
      { lang: 'English', level: 'B2 – Upper Intermediate', pct: 72 },
    ],
  },
  2: {
    availability: 'hired',
    yearsOfExp: 2,
    contact: { github: 'github.com/mei-lin-design', linkedin: 'linkedin.com/in/meilin-ux', portfolio: 'meilin.design', email: 'mei@guild.dev', location: 'Shanghai, China' },
    workExperience: [
      { company: 'NeonSaga Guild', role: 'UI/UX Designer', period: 'Jun 2025 – Present', description: 'Crafting cohesive design systems, conducting UX audits, and prototyping end-to-end product flows. Owns Brand Identity system.', techStack: ['Figma', 'Framer', 'Spline'] },
      { company: 'Luminary Digital Studio', role: 'Visual Designer (Intern → Full-time)', period: 'Mar 2024 – May 2025', description: 'Designed marketing assets, social media campaigns, and SaaS product interfaces for 8+ clients across fintech and e-commerce.', techStack: ['Figma', 'Adobe XD', 'Adobe Illustrator'] },
    ],
    education: [
      { school: 'Central Academy of Fine Arts', degree: 'B.F.A. Digital Media Design', year: '2024' },
    ],
    certifications: [
      { name: 'Google UX Design Certificate', issuer: 'Google / Coursera', year: '2024', color: '#EA4335' },
      { name: 'Figma Advanced Certification', issuer: 'Figma', year: '2025', color: '#9333EA' },
      { name: 'Interaction Design Foundation', issuer: 'IxDF', year: '2024', color: '#0284C7' },
    ],
    featuredProjects: [
      { name: 'Lumina Design System', description: 'Comprehensive design system with 200+ components, tokens, and documentation — used by 3 product teams.', techStack: ['Figma', 'Storybook', 'Tokens Studio'], stars: 91, status: 'shipped' },
      { name: 'FinFlow App Redesign', description: 'Full UX overhaul of a fintech dashboard increasing user retention by 34%. Included 60+ screen designs.', techStack: ['Figma', 'Maze', 'Protopie'], status: 'shipped' },
      { name: '3D Portfolio v2', description: 'Interactive 3D portfolio built with Spline, featuring parallax scenes and motion-rich case studies.', techStack: ['Spline', 'Framer', 'GSAP'], liveUrl: 'meilin.design', stars: 156, status: 'shipped' },
    ],
    languages: [
      { lang: 'Mandarin', level: 'Native', pct: 100 },
      { lang: 'English', level: 'C1 – Advanced', pct: 88 },
      { lang: 'Japanese', level: 'A2 – Elementary', pct: 28 },
    ],
  },
  3: {
    availability: 'hired',
    yearsOfExp: 4,
    contact: { github: 'github.com/ryo-hashi', linkedin: 'linkedin.com/in/ryo-hashimoto-dev', portfolio: 'ryo.sh', email: 'ryo@guild.dev', location: 'Osaka, Japan' },
    workExperience: [
      { company: 'NeonSaga Guild', role: 'Backend Developer', period: 'Jan 2025 – Present', description: 'Architecting microservices and APIs powering the guild platform. Led auth service overhaul reducing latency by 40%.', techStack: ['Node.js', 'PostgreSQL', 'Redis', 'Docker'] },
      { company: 'ByteForge Inc.', role: 'Backend Engineer', period: 'Aug 2023 – Dec 2024', description: 'Developed and maintained RESTful and GraphQL APIs serving 500k+ daily active users. Introduced Redis caching layer.', techStack: ['Node.js', 'GraphQL', 'Redis', 'AWS'] },
      { company: 'Kōsoku Systems', role: 'Junior Backend Developer', period: 'Apr 2022 – Jul 2023', description: 'Built internal tools, ETL pipelines, and reporting APIs for manufacturing SaaS platform.', techStack: ['Python', 'MySQL', 'FastAPI'] },
    ],
    education: [
      { school: 'Osaka University', degree: 'B.Sc. Information Engineering', year: '2022' },
    ],
    certifications: [
      { name: 'AWS Certified Developer – Associate', issuer: 'Amazon Web Services', year: '2024', color: '#F59E0B' },
      { name: 'PostgreSQL Expert Level I', issuer: 'EDB', year: '2023', color: '#3B82F6' },
      { name: 'Docker Certified Associate', issuer: 'Docker', year: '2024', color: '#06B6D4' },
    ],
    featuredProjects: [
      { name: 'NexusAuth', description: 'Open-source multi-tenant auth service with JWT + OAuth2. Handles 10k req/sec with sub-5ms p99 latency.', techStack: ['Node.js', 'Redis', 'PostgreSQL'], repoUrl: 'github.com/ryo-hashi/nexus-auth', stars: 312, status: 'shipped' },
      { name: 'GraphQL Federation Gateway', description: 'Federated GraphQL gateway aggregating 6 microservices with automatic schema stitching.', techStack: ['Apollo Federation', 'Node.js', 'Docker'], stars: 87, status: 'shipped' },
      { name: 'Chrono ETL', description: 'Lightweight TypeScript ETL framework for scheduled data pipeline automation.', techStack: ['TypeScript', 'Node.js', 'PostgreSQL'], repoUrl: 'github.com/ryo-hashi/chrono-etl', stars: 54, status: 'archived' },
    ],
    languages: [
      { lang: 'Japanese', level: 'Native', pct: 100 },
      { lang: 'English', level: 'B2 – Upper Intermediate', pct: 75 },
      { lang: 'Korean', level: 'A2 – Elementary', pct: 22 },
    ],
  },
  4: {
    availability: 'hired',
    yearsOfExp: 6,
    contact: { github: 'github.com/yuna-park-dev', linkedin: 'linkedin.com/in/yunapark-fs', portfolio: 'yunapark.dev', email: 'yuna@guild.dev', location: 'Seoul, South Korea' },
    workExperience: [
      { company: 'NeonSaga Guild', role: 'Full Stack Developer', period: 'Sep 2024 – Present', description: 'Leading frontend architecture and contributing to backend microservices. Built SaaS dashboard MVP serving 15k users from scratch.', techStack: ['React', 'Next.js', 'Prisma', 'PostgreSQL'] },
      { company: 'Stellar Labs', role: 'Full Stack Engineer', period: 'Jan 2023 – Aug 2024', description: 'Developed real-time collaboration features used by 120k MAU. Led migration from REST to tRPC. Mentored 3 junior engineers.', techStack: ['React', 'tRPC', 'Prisma', 'AWS'] },
      { company: 'KairoSoft', role: 'Frontend Developer → Full Stack', period: 'Mar 2021 – Dec 2022', description: 'Transitioned from frontend specialist to full-stack role. Built internal SaaS tools and customer-facing dashboard.', techStack: ['Vue.js', 'Django', 'PostgreSQL'] },
      { company: 'Pixel Studio', role: 'Frontend Intern', period: 'Jun 2020 – Feb 2021', description: 'Implemented UI components and integrated third-party APIs. Contributed to 4 client projects.', techStack: ['React', 'SCSS', 'REST APIs'] },
    ],
    education: [
      { school: 'KAIST', degree: 'B.Sc. Computer Science & Engineering', year: '2020' },
    ],
    certifications: [
      { name: 'AWS Certified Solutions Architect', issuer: 'Amazon Web Services', year: '2023', color: '#F59E0B' },
      { name: 'Google Cloud Professional Developer', issuer: 'Google Cloud', year: '2024', color: '#EA4335' },
      { name: 'Next.js Certified Developer', issuer: 'Vercel', year: '2023', color: '#FFFFFF' },
    ],
    featuredProjects: [
      { name: 'Helix SaaS Platform', description: 'End-to-end SaaS platform for project management. 15k active users, 99.9% uptime, $0 → $50k MRR growth.', techStack: ['Next.js', 'Prisma', 'PostgreSQL', 'AWS'], liveUrl: 'helix.app', stars: 420, status: 'shipped' },
      { name: 'RealtimeCollab', description: 'Google Docs-like real-time collaborative editor built with CRDTs and WebSockets.', techStack: ['React', 'yjs', 'Socket.io', 'Redis'], repoUrl: 'github.com/yuna-park-dev/realtime-collab', stars: 680, status: 'shipped' },
      { name: 'Prisma Schema Visualizer', description: 'VS Code extension that generates interactive ERD diagrams from Prisma schema files. 28k installs.', techStack: ['TypeScript', 'VS Code API', 'D3.js'], stars: 892, status: 'shipped' },
      { name: 'Tailwind Inspector', description: 'Browser devtools extension for inspecting and editing Tailwind classes in real-time.', techStack: ['TypeScript', 'Chrome Extension API'], stars: 234, status: 'wip' },
    ],
    languages: [
      { lang: 'Korean', level: 'Native', pct: 100 },
      { lang: 'English', level: 'C1 – Advanced', pct: 90 },
      { lang: 'Japanese', level: 'B1 – Intermediate', pct: 58 },
    ],
  },
  5: {
    availability: 'unavailable',
    yearsOfExp: 8,
    contact: { github: 'github.com/shin-w', linkedin: 'linkedin.com/in/shin-watanabe-devops', portfolio: 'shin-ops.dev', email: 'shin@guild.dev', location: 'Tokyo, Japan' },
    workExperience: [
      { company: 'NeonSaga Guild', role: 'DevOps / Infrastructure Lead', period: 'Mar 2024 – Present', description: 'Owns the entire infrastructure stack. Designed multi-region Kubernetes architecture serving 1M+ requests/day. Zero incidents in 14 months.', techStack: ['Kubernetes', 'Terraform', 'AWS', 'Prometheus'] },
      { company: 'CloudNative Corp.', role: 'Senior Site Reliability Engineer', period: 'Jul 2021 – Feb 2024', description: 'Led platform engineering team of 6. Reduced infrastructure costs 38% via FinOps optimization. Implemented chaos engineering program.', techStack: ['GCP', 'Kubernetes', 'Terraform', 'Datadog'] },
      { company: 'SkyBridge Systems', role: 'DevOps Engineer', period: 'Jan 2019 – Jun 2021', description: 'Built CI/CD pipelines for 40+ microservices. Containerized legacy monolith into 12 independent services.', techStack: ['Docker', 'Jenkins', 'Ansible', 'AWS'] },
      { company: 'Nexus IT Solutions', role: 'Systems Administrator', period: 'Apr 2017 – Dec 2018', description: 'Managed on-premise and hybrid cloud infrastructure. Led migration of 200+ servers to AWS EC2.', techStack: ['Linux', 'Bash', 'VMware', 'AWS'] },
    ],
    education: [
      { school: 'Waseda University', degree: 'B.Sc. Network Engineering & Information Security', year: '2017' },
    ],
    certifications: [
      { name: 'CKA – Certified Kubernetes Administrator', issuer: 'CNCF', year: '2022', color: '#326CE5' },
      { name: 'AWS Solutions Architect – Professional', issuer: 'Amazon Web Services', year: '2023', color: '#F59E0B' },
      { name: 'HashiCorp Terraform Associate', issuer: 'HashiCorp', year: '2022', color: '#7B42F6' },
      { name: 'Google SRE Practitioner', issuer: 'Google Cloud', year: '2024', color: '#EA4335' },
    ],
    featuredProjects: [
      { name: 'K8s Multi-Region Blueprint', description: 'Production-grade Kubernetes multi-region HA setup with Terraform. Used by 40+ companies worldwide.', techStack: ['Terraform', 'Kubernetes', 'AWS', 'Cilium'], repoUrl: 'github.com/shin-w/k8s-multiregion', stars: 1240, status: 'shipped' },
      { name: 'ObservaStack', description: 'Open-source observability stack (metrics + logs + traces) deployable in one Helm chart. 3k GitHub stars.', techStack: ['Prometheus', 'Loki', 'Tempo', 'Helm'], stars: 3100, status: 'shipped' },
      { name: 'FinOps Lens', description: 'AWS cost analysis CLI tool with automated rightsizing recommendations. Cut bills 20-40% for adopters.', techStack: ['Go', 'AWS SDK', 'Cobra'], repoUrl: 'github.com/shin-w/finops-lens', stars: 567, status: 'shipped' },
    ],
    languages: [
      { lang: 'Japanese', level: 'Native', pct: 100 },
      { lang: 'English', level: 'C1 – Advanced', pct: 87 },
    ],
  },
  6: {
    availability: 'unavailable',
    yearsOfExp: 10,
    contact: { github: 'github.com/rin-nakamura', linkedin: 'linkedin.com/in/rin-nakamura-be', portfolio: 'rin.systems', email: 'rin@guild.dev', location: 'Kyoto, Japan' },
    workExperience: [
      { company: 'NeonSaga Guild', role: 'Backend Lead / Crimson Architect', period: 'Aug 2023 – Present', description: 'Architecting ultra-high-performance distributed systems. Achieved sub-1ms P99 latency on critical payment path. Leading backend team of 8.', techStack: ['Rust', 'Go', 'Kafka', 'ClickHouse'] },
      { company: 'HyperScale Technologies', role: 'Staff Engineer – Backend', period: 'Feb 2021 – Jul 2023', description: 'Designed event-driven architecture processing 10M+ events/day. Introduced Rust into the stack achieving 10x throughput gain.', techStack: ['Rust', 'Kafka', 'PostgreSQL', 'gRPC'] },
      { company: 'Orbital Systems', role: 'Senior Backend Engineer', period: 'Sep 2018 – Jan 2021', description: 'Core platform team. Built distributed job scheduler handling 500k concurrent jobs. Mentored 6 engineers.', techStack: ['Go', 'Redis', 'Kubernetes', 'PostgreSQL'] },
      { company: 'DataForge Inc.', role: 'Backend Engineer', period: 'Apr 2016 – Aug 2018', description: 'Developed data ingestion pipelines and analytical APIs. Designed SQL query optimizer that improved reporting speed 8x.', techStack: ['Java', 'Spark', 'Cassandra', 'Elasticsearch'] },
      { company: 'TechMatrix', role: 'Junior Developer', period: 'Aug 2014 – Mar 2016', description: 'CRUD API development and legacy system maintenance. First production deployment at 3 months in.', techStack: ['Java', 'MySQL', 'Spring'] },
    ],
    education: [
      { school: 'Kyoto University', degree: 'M.Sc. Computer Science – Distributed Systems', year: '2014' },
      { school: 'Kyoto University', degree: 'B.Sc. Information Science', year: '2012' },
    ],
    certifications: [
      { name: 'CKAD – Certified Kubernetes App Developer', issuer: 'CNCF', year: '2021', color: '#326CE5' },
      { name: 'Google Cloud Professional Data Engineer', issuer: 'Google Cloud', year: '2022', color: '#EA4335' },
      { name: 'Apache Kafka Certified Developer', issuer: 'Confluent', year: '2023', color: '#EF4444' },
      { name: 'Rust Foundation Associate', issuer: 'Rust Foundation', year: '2022', color: '#F97316' },
    ],
    featuredProjects: [
      { name: 'Crimson Queue', description: 'High-performance message queue in Rust achieving 20M msg/sec throughput on commodity hardware.', techStack: ['Rust', 'Tokio', 'RDMA'], repoUrl: 'github.com/rin-nakamura/crimson-queue', stars: 4200, status: 'shipped' },
      { name: 'OrbitalDB', description: 'Distributed key-value store with linearizable consistency and automatic sharding. MIT-licensed.', techStack: ['Rust', 'Raft', 'RocksDB'], stars: 2800, status: 'shipped' },
      { name: 'Refactor Deity CLI', description: 'AI-assisted code refactoring CLI that analyzes Go/Rust codebases and suggests performance improvements.', techStack: ['Go', 'Tree-sitter', 'OpenAI API'], stars: 1100, status: 'shipped' },
      { name: 'gRPC Load Balancer', description: 'Client-side gRPC load balancer with adaptive routing based on tail latency (P99).', techStack: ['Go', 'gRPC', 'Envoy'], stars: 340, status: 'archived' },
    ],
    languages: [
      { lang: 'Japanese', level: 'Native', pct: 100 },
      { lang: 'English', level: 'C2 – Mastery', pct: 97 },
      { lang: 'Mandarin', level: 'A2 – Elementary', pct: 30 },
    ],
  },
  7: {
    availability: 'unavailable',
    yearsOfExp: 12,
    contact: { github: 'github.com/akira-sato', linkedin: 'linkedin.com/in/akira-sato-guildmaster', portfolio: 'akira.dev', email: 'akira@guild.dev', location: 'Tokyo / Remote — World' },
    workExperience: [
      { company: 'NeonSaga Guild', role: 'Guild Master / Tech Lead', period: 'Apr 2022 – Present', description: 'Founded and leads a 50+ person guild. Defined technical vision, architecture standards, and engineering culture. Scaled platform to 500k users.', techStack: ['System Design', 'React', 'Go', 'Rust', 'AWS', 'GCP'] },
      { company: 'Apex Technologies', role: 'Principal Engineer', period: 'Jan 2019 – Mar 2022', description: 'Led re-architecture of a monolith to microservices at a 200-person startup. Built engineering team from 12 to 45. Series B → C journey.', techStack: ['Go', 'Kubernetes', 'React', 'PostgreSQL'] },
      { company: 'DeepSystems Corp.', role: 'Staff Engineer', period: 'Jun 2016 – Dec 2018', description: 'Designed ML inference infrastructure serving 50M predictions/day. Pioneered internal platform engineering discipline.', techStack: ['Python', 'TensorFlow', 'Go', 'Kubernetes'] },
      { company: 'OmniCloud', role: 'Senior Software Engineer', period: 'Aug 2014 – May 2016', description: 'Core cloud storage team. Contributed to distributed filesystem achieving 11-nines durability.', techStack: ['C++', 'Go', 'Erasure Coding', 'RAFT'] },
      { company: 'Fujitsu Research Labs', role: 'Research Engineer', period: 'Apr 2012 – Jul 2014', description: 'HPC and distributed computing research. Published 3 papers on consensus algorithms at OSDI / SOSP.', techStack: ['C++', 'MPI', 'RDMA', 'Linux Kernel'] },
    ],
    education: [
      { school: 'University of Tokyo', degree: 'M.Sc. Computer Science – Distributed & Parallel Computing', year: '2012' },
      { school: 'University of Tokyo', degree: 'B.Sc. Computer Engineering (Top of Class)', year: '2010' },
    ],
    certifications: [
      { name: 'AWS Solutions Architect – Professional', issuer: 'Amazon Web Services', year: '2020', color: '#F59E0B' },
      { name: 'Google Cloud Fellow', issuer: 'Google Cloud', year: '2022', color: '#EA4335' },
      { name: 'CKA + CKAD + CKS – Triple Crown', issuer: 'CNCF', year: '2021', color: '#326CE5' },
      { name: 'Rust Foundation Fellow', issuer: 'Rust Foundation', year: '2023', color: '#F97316' },
    ],
    featuredProjects: [
      { name: 'NeonSaga Platform', description: 'Guild platform serving 500k+ users. Full-stack monorepo: Next.js frontend, Go microservices, global Kubernetes fleet.', techStack: ['Next.js', 'Go', 'Kubernetes', 'Terraform'], liveUrl: 'neon.saga', stars: 8800, status: 'shipped' },
      { name: 'AkiraDB', description: 'Geo-distributed SQL database achieving global linearizability. Featured at VLDB 2024.', techStack: ['Rust', 'Raft', 'MVCC', 'RocksDB'], repoUrl: 'github.com/akira-sato/akiradb', stars: 12400, status: 'shipped' },
      { name: 'Constellation Framework', description: 'Opinionated full-stack framework for building distributed SaaS apps. Convention over configuration, zero boilerplate.', techStack: ['TypeScript', 'Go', 'React', 'gRPC'], stars: 5600, status: 'shipped' },
      { name: 'SilverPath CLI', description: 'AI-powered code review tool integrating with GitHub Actions, Jira, and Slack. Used by 3k+ teams.', techStack: ['Go', 'OpenAI', 'GitHub API'], stars: 3200, status: 'shipped' },
      { name: 'Guild OS', description: 'Custom Linux distro optimized for development environments with pre-configured toolchains and dotfiles.', techStack: ['Linux', 'Bash', 'Nix', 'Ansible'], stars: 2100, status: 'wip' },
    ],
    languages: [
      { lang: 'Japanese', level: 'Native', pct: 100 },
      { lang: 'English', level: 'C2 – Mastery', pct: 99 },
      { lang: 'Mandarin', level: 'B2 – Upper Intermediate', pct: 74 },
      { lang: 'Korean', level: 'B1 – Intermediate', pct: 56 },
    ],
  },
};

// ── Availability badge ────────────────────────────────────────────────────
function AvailabilityBadge({ status }: { status: CVData['availability'] }) {
  const map = {
    open: { label: 'OPEN TO WORK', color: '#22C55E', icon: CheckCircle, bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.3)' },
    hired: { label: 'CURRENTLY HIRED', color: '#F59E0B', icon: Briefcase, bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.3)' },
    unavailable: { label: 'NOT AVAILABLE', color: '#EF4444', icon: XCircle, bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.3)' },
  };
  const cfg = map[status];
  const Icon = cfg.icon;
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-sm w-fit" style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
      <Icon size={11} style={{ color: cfg.color }} />
      <span style={{ color: cfg.color, fontSize: 10, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.15em', fontWeight: 600 }}>{cfg.label}</span>
      {status === 'open' && <div className="w-1.5 h-1.5 rounded-full ml-1" style={{ backgroundColor: cfg.color, boxShadow: `0 0 6px ${cfg.color}`, animation: 'pulse 1.5s ease-in-out infinite' }} />}
    </div>
  );
}

// ── Section header ────────────────────────────────────────────────────────
function SectionHead({ icon: Icon, label, color = '#3B82F6' }: { icon: any; label: string; color?: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-7 h-7 rounded flex items-center justify-center" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
        <Icon size={13} style={{ color }} />
      </div>
      <span style={{ color: '#475569', fontSize: 10, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.3em' }}>{label}</span>
      <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${color}20, transparent)` }} />
    </div>
  );
}

// ── Project status pill ───────────────────────────────────────────────────
function StatusPill({ status, t }: { status: ProjectEntry['status']; t: ReturnType<typeof useI18n>['t'] }) {
  const map = {
    shipped: { labelKey: 'team.member.statusShipped' as const, color: '#22C55E' },
    wip:     { labelKey: 'team.member.statusInProgress' as const, color: '#F59E0B' },
    archived:{ labelKey: 'team.member.statusArchived' as const, color: '#475569' },
  };
  const c = map[status];
  return (
    <span style={{ color: c.color, fontSize: 8, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.15em', background: `${c.color}15`, border: `1px solid ${c.color}30`, padding: '2px 6px', borderRadius: 2 }}>{t(c.labelKey)}</span>
  );
}

// ── Main Component ────────────────────────────────────────────────────────
export default function MemberDetailPage() {
  const { t } = useI18n();
  const { id } = useParams();
  const navigate = useNavigate();
  const member = members.find((m) => m.id === Number(id));
  const [hovered, setHovered] = useState(false);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  if (!member) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center text-white font-serif">
        <div className="text-center">
          <h1 className="text-4xl mb-4">{t('errors.notFound')}</h1>
          <button onClick={() => navigate('/')} className="text-blue-400 hover:underline">{t('team.member.backToTeam')}</button>
        </div>
      </div>
    );
  }

  const cfg = RANKS[member.rank];
  const xpPct = Math.round((member.currentXP / member.maxXP) * 100);
  const cv = CV_DATA[member.id];

  const ROLE_SYMBOLS: Record<string, string> = {
    BOW: '⌖', DAGGER: '⌗', DUAL: '⊛', STAFF: '✦', DESIGNER: '✦',
    SHIELD: '⬡', DEVOPS: '⬡', PM: '⊙', PO: '◉', MAP: '★',
    HR: '◇', MKT: '◐', QA: '◎', DATA: '◆', SC: '◈',
  };

  return (
    <div className="min-h-screen bg-[#020617] text-[#94A3B8] overflow-x-hidden selection:bg-blue-500/30">
      {/* Inject animations */}
      <style>{GUILD_ANIMATIONS_CSS}</style>

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#1F2937 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="absolute top-0 left-0 w-full h-full opacity-5" style={{ background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${cfg.glowColor}, transparent)` }} />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 px-8 py-6 flex items-center justify-between border-b border-[#0F172A]">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm font-mono tracking-widest text-[#475569] hover:text-[#3B82F6] transition-colors group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          {t('team.member.returnToBase')}
        </button>
        <div className="flex items-center gap-4 text-[10px] font-mono tracking-[0.3em] text-[#1F2937]">
          <span>{t('team.member.profileView')}</span>
          <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
          <span>{t('team.member.lvl')}_<Counter value={member.level} duration={1.5} /></span>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

          {/* ── LEFT COLUMN ────────────────────────────────────────────── */}
          <div className="lg:col-span-4 space-y-6">

            {/* Avatar Card — mirrors MemberCard exactly */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              style={{ borderRadius: 12, position: 'relative' }}
              onHoverStart={() => setHovered(true)}
              onHoverEnd={() => setHovered(false)}
            >
              {/* Ambient glow ring (behind card) */}
              <div
                className="absolute inset-0 rounded-xl pointer-events-none"
                style={{
                  boxShadow: `0 0 ${hovered ? 60 : 30}px ${cfg.glowColor}`,
                  opacity: hovered ? 1 : 0.6,
                  borderRadius: 12,
                  transition: 'box-shadow 0.35s ease, opacity 0.35s ease',
                }}
              />

              {/* Card body */}
              <div
                style={{
                  backgroundColor: '#0F172A',
                  border: `1px solid ${cfg.color}40`,
                  borderRadius: 12,
                  position: 'relative',
                  overflow: 'hidden',
                  animation: member.rank === 'diamond' ? 'guildDiamondSpectral 3s ease-in-out infinite' : undefined,
                }}
              >
                {/* Avatar image section */}
                <div className="relative" style={{ paddingBottom: '115%' }}>
                  <img
                    src={member.img}
                    alt={member.name}
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ borderRadius: '10px 10px 0 0' }}
                  />
                  {/* Bottom gradient fade */}
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: 'linear-gradient(to top, #0F172A 0%, #0F172A55 35%, transparent 62%)',
                      borderRadius: '10px 10px 0 0',
                    }}
                  />

                  {/* Rank badge — top right */}
                  <div className="absolute top-2.5 right-2.5 z-20">
                    <RankBadge rank={member.rank} />
                  </div>
                  {/* Team tag — top left */}
                  <div
                    className="absolute top-2.5 left-2.5 z-20 px-2 py-0.5 rounded-sm"
                    style={{ backgroundColor: 'rgba(2,6,23,0.72)', border: '1px solid #1F2937', backdropFilter: 'blur(4px)' }}
                  >
                    <span style={{ color: '#64748B', fontSize: 9, letterSpacing: '0.12em', fontFamily: "'JetBrains Mono', monospace" }}>
                      ⬡ {member.team}
                    </span>
                  </div>

                  {/* Level — bottom left */}
                  <div className="absolute bottom-3 left-3 z-20 flex items-baseline gap-1">
                    <span style={{ fontFamily: "'Cinzel', serif", color: cfg.color, fontSize: 22, fontWeight: 700, lineHeight: 1, textShadow: `0 0 16px ${cfg.glowColor}` }}>
                      <Counter value={member.level} duration={1.2} delay={0.2} />
                    </span>
                    <span style={{ color: '#64748B', fontSize: 9, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em', marginBottom: 2 }}>{t('team.member.lvl')}</span>
                  </div>

                  {/* Boost indicator on hover */}
                  {hovered && (
                    <div
                      className="absolute bottom-3 right-3 z-20 flex items-center gap-1 px-1.5 py-0.5 rounded-sm"
                      style={{ backgroundColor: `${cfg.color}20`, border: `1px solid ${cfg.color}60`, animation: 'guildHeartbeat 0.5s ease-in-out infinite' }}
                    >
                      <span style={{ color: cfg.color, fontSize: 8, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em' }}>{t('team.member.boosted')}</span>
                    </div>
                  )}
                </div>

                {/* Info panel */}
                <div className="px-4 pt-3 pb-4">
                  <div style={{ color: '#FFFFFF', fontFamily: "'Cinzel', serif", fontSize: 15, fontWeight: 600, letterSpacing: '0.04em', lineHeight: 1.3 }}>
                    {member.name}
                  </div>
                  <div className="mt-0.5" style={{ color: '#64748B', fontSize: 10, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em' }}>
                    {ROLE_SYMBOLS[member.roleCode] ?? '◎'} {member.role}
                  </div>

                  {/* XP bar */}
                  <div className="mt-3">
                    <div className="flex justify-between mb-1" style={{ color: '#475569', fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }}>
                      <span style={{ color: cfg.color }}>XP <Counter value={xpPct} duration={1.5} delay={0.4} />%</span>
                      <span>
                        <Counter value={member.currentXP} duration={1.2} delay={0.5} />
                        /
                        <Counter value={member.maxXP} duration={1.2} delay={0.5} />
                      </span>
                    </div>
                    <div className="rounded-full overflow-hidden" style={{ height: 3, backgroundColor: '#1F2937' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${xpPct}%` }}
                        transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                        className="h-full rounded-full"
                        style={{ backgroundImage: `linear-gradient(90deg, ${cfg.gradientFrom}, ${cfg.gradientTo})`, boxShadow: `0 0 8px ${cfg.glowColor}` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* LED Runner — outside overflow:hidden */}
              <LEDRunner member={member} boosted />

              {/* Corner decorations — outside overflow:hidden */}
              <CornerDeco color={cfg.color} opacity={hovered ? 1 : 0.6} />
            </motion.div>

            {/* Availability */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              {cv && <AvailabilityBadge status={cv.availability} />}
            </motion.div>

            {/* Core stats grid */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="grid grid-cols-2 gap-3"
            >
              {[
                { label: t('team.member.rank'), raw: cfg.label, icon: Award, color: cfg.color },
                { label: t('team.member.missionsLabel'), raw: member.missions, icon: Target, color: '#EF4444' },
                { label: t('team.member.yearsExpShort'), raw: cv?.yearsOfExp ?? 0, suffix: '+', icon: Briefcase, color: '#F59E0B' },
                { label: t('team.member.xpTotalShort'), raw: member.currentXP, suffix: 'k', icon: Zap, color: '#3B82F6' },
              ].map((stat) => (
                <div key={stat.label} className="bg-[#0F172A]/60 border border-[#1F2937] p-3 rounded-lg hover:border-[#374151] transition-colors">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <stat.icon size={11} style={{ color: stat.color }} />
                    <span className="text-[9px] font-mono tracking-widest text-[#475569]">{stat.label}</span>
                  </div>
                  <div className="text-sm font-bold text-white font-serif uppercase">
                    {typeof stat.raw === 'number' ? (
                      <>
                        <Counter value={stat.raw} duration={1.5} delay={0.6} />
                        {stat.suffix}
                      </>
                    ) : (
                      stat.raw
                    )}
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Contact Info */}
            {cv && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-[#0F172A]/60 border border-[#1F2937] rounded-xl p-5"
              >
                <SectionHead icon={Mail} label={t('team.member.contactLinks')} color={cfg.color} />
                <div className="space-y-3">
                  {[
                    { icon: MapPin, val: cv.contact.location, color: '#475569' },
                    { icon: Github, val: cv.contact.github, color: '#94A3B8' },
                    { icon: Linkedin, val: cv.contact.linkedin, color: '#3B82F6' },
                    { icon: Globe, val: cv.contact.portfolio, color: cfg.color },
                    { icon: Mail, val: cv.contact.email, color: '#94A3B8' },
                  ].map(({ icon: Icon, val, color }, i) => (
                    <div key={i} className="flex items-center gap-3 group">
                      <Icon size={12} style={{ color, flexShrink: 0 }} />
                      <span style={{ color: '#64748B', fontSize: 10, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.05em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{val}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Languages */}
            {cv && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="bg-[#0F172A]/60 border border-[#1F2937] rounded-xl p-5"
              >
                <SectionHead icon={Languages} label={t('team.member.languages')} color={cfg.color} />
                <div className="space-y-4">
                  {cv.languages.map((lang) => (
                    <div key={lang.lang} className="space-y-1.5">
                      <div className="flex justify-between">
                        <span style={{ color: '#94A3B8', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}>{lang.lang} <span className="opacity-50">(<Counter value={lang.pct} delay={0.8} />%)</span></span>
                        <span style={{ color: '#475569', fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }}>{lang.level}</span>
                      </div>
                      <div className="h-1 w-full bg-[#1F2937] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${lang.pct}%` }}
                          transition={{ duration: 1, ease: 'easeOut', delay: 0.4 }}
                          className="h-full rounded-full"
                          style={{ backgroundImage: `linear-gradient(90deg, ${cfg.gradientFrom}, ${cfg.gradientTo})`, boxShadow: `0 0 6px ${cfg.glowColor}` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* ── RIGHT COLUMN ───────────────────────────────────────────── */}
          <div className="lg:col-span-8 space-y-8">

            {/* Bio & Tech stack */}
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-[#0F172A]/40 border border-[#1F2937] rounded-xl p-7"
            >
              <SectionHead icon={Terminal} label={t('team.member.operativeManifest')} color={cfg.color} />
              <blockquote className="text-xl font-serif text-white leading-relaxed italic border-l-2 pl-6 mb-5" style={{ borderColor: cfg.color + '50' }}>
                "{member.bio}"
              </blockquote>
              <div className="flex flex-wrap gap-2">
                {member.techStack.map((tech) => (
                  <span key={tech} className="px-2.5 py-1 bg-[#1F2937] border border-[#374151] rounded text-[10px] font-mono text-[#94A3B8] tracking-widest hover:border-[#475569] transition-colors">
                    {tech}
                  </span>
                ))}
              </div>
            </motion.section>

            {/* Skills */}
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
              className="bg-[#0F172A]/40 border border-[#1F2937] rounded-xl p-7"
            >
              <SectionHead icon={Shield} label={t('team.member.skillArchitecture')} color={cfg.color} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {Object.entries(member.skills).map(([skill, val]) => (
                  <div key={skill} className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span style={{ color: '#94A3B8', fontSize: 10, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em' }}>{skill.toUpperCase()}</span>
                      <span style={{ color: cfg.color, fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}><Counter value={val} delay={0.8} />%</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#1F2937] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${val}%` }}
                        transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                        className="h-full rounded-full"
                        style={{ backgroundImage: `linear-gradient(90deg, ${cfg.gradientFrom}, ${cfg.gradientTo})`, boxShadow: `0 0 8px ${cfg.glowColor}` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>

            {/* Work Experience */}
            {cv && (
              <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.34 }}
                className="bg-[#0F172A]/40 border border-[#1F2937] rounded-xl p-7"
              >
                <SectionHead icon={Briefcase} label={t('team.member.workExperience')} color={cfg.color} />
                <div className="relative space-y-0">
                  {/* Timeline line */}
                  <div className="absolute left-[11px] top-2 bottom-2 w-px" style={{ background: `linear-gradient(to bottom, ${cfg.color}40, transparent)` }} />

                  {cv.workExperience.map((job, i) => (
                    <div key={i} className="relative pl-8 pb-7 last:pb-0">
                      {/* Dot */}
                      <div
                        className="absolute left-0 top-1 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: i === 0 ? `${cfg.color}20` : '#0F172A', border: `1.5px solid ${i === 0 ? cfg.color : '#1F2937'}` }}
                      >
                        {i === 0 && <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.color, boxShadow: `0 0 6px ${cfg.glowColor}` }} />}
                      </div>

                      <div className="bg-[#020617]/50 border border-[#1F2937] rounded-lg p-4 hover:border-[#374151] transition-colors">
                        <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                          <div>
                            <div style={{ color: '#FFFFFF', fontSize: 13, fontFamily: "'Cinzel', serif", fontWeight: 600 }}>{job.role}</div>
                            <div style={{ color: cfg.color, fontSize: 10, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em', marginTop: 2 }}>{job.company}</div>
                          </div>
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded" style={{ background: '#0F172A', border: '1px solid #1F2937' }}>
                            <Calendar size={9} style={{ color: '#475569' }} />
                            <span style={{ color: '#475569', fontSize: 9, fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap' }}>{job.period}</span>
                          </div>
                        </div>
                        <p style={{ color: '#64748B', fontSize: 11, lineHeight: 1.7, marginBottom: 10 }}>{job.description}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {job.techStack.map((t) => (
                            <span key={t} style={{ color: '#475569', fontSize: 9, fontFamily: "'JetBrains Mono', monospace", background: '#1F2937', border: '1px solid #374151', padding: '1px 6px', borderRadius: 2 }}>{t}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.section>
            )}

            {/* Education & Certifications side by side */}
            {cv && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {/* Education */}
                <div className="bg-[#0F172A]/40 border border-[#1F2937] rounded-xl p-6">
                  <SectionHead icon={GraduationCap} label={t('team.member.education')} color={cfg.color} />
                  <div className="space-y-4">
                    {cv.education.map((edu, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="mt-1 w-5 h-5 rounded flex items-center justify-center flex-shrink-0" style={{ background: `${cfg.color}15`, border: `1px solid ${cfg.color}30` }}>
                          <BookOpen size={10} style={{ color: cfg.color }} />
                        </div>
                        <div>
                          <div style={{ color: '#FFFFFF', fontSize: 11, fontFamily: "'Cinzel', serif", fontWeight: 600, lineHeight: 1.4 }}>{edu.degree}</div>
                          <div style={{ color: '#64748B', fontSize: 10, fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>{edu.school}</div>
                          <div style={{ color: '#475569', fontSize: 9, fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>{t('team.member.classOf')} {edu.year}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Certifications */}
                <div className="bg-[#0F172A]/40 border border-[#1F2937] rounded-xl p-6">
                  <SectionHead icon={Award} label={t('team.member.certifications')} color={cfg.color} />
                  <div className="space-y-3">
                    {cv.certifications.map((cert, i) => (
                      <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-[#1F2937]/30 transition-colors">
                        <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${cert.color}15`, border: `1px solid ${cert.color}40` }}>
                          <Star size={9} style={{ color: cert.color }} />
                        </div>
                        <div className="min-w-0">
                          <div style={{ color: '#CBD5E1', fontSize: 10, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.4 }}>{cert.name}</div>
                          <div style={{ color: '#475569', fontSize: 9, fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>{cert.issuer} · {cert.year}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Featured Projects */}
            {cv && (
              <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.46 }}
                className="bg-[#0F172A]/40 border border-[#1F2937] rounded-xl p-7"
              >
                <SectionHead icon={Code2} label={t('team.member.featuredProjects')} color={cfg.color} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cv.featuredProjects.map((proj, i) => (
                    <div key={i} className="bg-[#020617]/60 border border-[#1F2937] rounded-lg p-4 hover:border-[#374151] transition-all hover:-translate-y-0.5 group">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span style={{ color: '#FFFFFF', fontSize: 12, fontFamily: "'Cinzel', serif", fontWeight: 600 }}>{proj.name}</span>
                        <StatusPill status={proj.status} t={t} />
                      </div>
                      <p style={{ color: '#64748B', fontSize: 10, lineHeight: 1.7, marginBottom: 10 }}>{proj.description}</p>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {proj.techStack.map((t) => (
                          <span key={t} style={{ color: '#475569', fontSize: 9, fontFamily: "'JetBrains Mono', monospace", background: '#1F2937', border: '1px solid #374151', padding: '1px 5px', borderRadius: 2 }}>{t}</span>
                        ))}
                      </div>
                      <div className="flex items-center gap-3">
                        {proj.stars && (
                          <div className="flex items-center gap-1">
                            <Star size={9} style={{ color: '#F59E0B' }} />
                            <span style={{ color: '#475569', fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }}>
                              <Counter 
                                value={proj.stars} 
                                delay={1.2} 
                                formatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toString()} 
                              />
                            </span>
                          </div>
                        )}
                        {proj.repoUrl && (
                          <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                            <GitBranch size={9} style={{ color: cfg.color }} />
                            <span style={{ color: cfg.color, fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }}>{t('team.member.repo')}</span>
                          </div>
                        )}
                        {proj.liveUrl && (
                          <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                            <ExternalLink size={9} style={{ color: '#22C55E' }} />
                            <span style={{ color: '#22C55E', fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }}>{t('team.member.live')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.section>
            )}

            {/* Achievements + Mission log */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.52 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {/* Achievements */}
              <div className="bg-[#0F172A]/40 border border-[#1F2937] rounded-xl p-6">
                <SectionHead icon={Trophy} label={t('team.member.trophyVault')} color={cfg.color} />
                <div className="space-y-2.5">
                  {member.achievements.map((ach) => (
                    <div key={ach} className="flex items-center gap-3 p-3 rounded-lg bg-[#020617]/40 border border-[#1F2937] hover:border-[#374151] transition-colors">
                      <div className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0" style={{ background: `${cfg.color}15`, border: `1px solid ${cfg.color}25` }}>
                        <Trophy size={12} style={{ color: cfg.color }} />
                      </div>
                      <div>
                        <div style={{ color: '#CBD5E1', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}>{ach}</div>
                        <div style={{ color: '#1F2937', fontSize: 8, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.15em', marginTop: 1 }}>{t('team.member.verified')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mission log */}
              <div className="bg-[#0F172A]/40 border border-[#1F2937] rounded-xl p-6">
                <SectionHead icon={Target} label={t('team.member.missionLog')} color={cfg.color} />
                <div className="space-y-3">
                  {member.missionLogs.map((log, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-[#020617]/40 border border-[#1F2937] hover:border-[#374151] transition-colors">
                      <div className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${log.status === 'completed' ? 'bg-green-500' : log.status === 'ongoing' ? 'bg-amber-500' : 'bg-red-600'}`}
                        style={{ boxShadow: log.status === 'completed' ? '0 0 6px #22C55E' : log.status === 'ongoing' ? '0 0 6px #F59E0B' : 'none' }}
                      />
                      <div className="min-w-0">
                        <div style={{ color: '#CBD5E1', fontSize: 10, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.5 }}>{log.title}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span style={{ color: '#475569', fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }}>{log.date}</span>
                          <span style={{ color: log.status === 'completed' ? '#22C55E' : log.status === 'ongoing' ? '#F59E0B' : '#EF4444', fontSize: 8, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em' }}>
                            {log.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Rank History Timeline */}
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.58 }}
              className="bg-[#0F172A]/40 border border-[#1F2937] rounded-xl p-7"
            >
              <SectionHead icon={Zap} label={t('team.member.rankAscensionHistory')} color={cfg.color} />
              <div className="flex flex-wrap gap-3">
                {member.rankHistory.map((ev, i) => {
                  const rc = RANKS[ev.rank];
                  return (
                    <div key={i} className="flex-1 min-w-[200px] bg-[#020617]/60 border border-[#1F2937] rounded-lg p-4 hover:border-[#374151] transition-colors">
                      <div className="flex items-center gap-2 mb-2">
                        <span style={{ color: rc.color, fontSize: 12 }}>{rc.symbol}</span>
                        <span style={{ color: rc.color, fontSize: 9, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.15em' }}>{rc.label}</span>
                        <span style={{ color: '#475569', fontSize: 9, fontFamily: "'JetBrains Mono', monospace", marginLeft: 'auto' }}>Lv.{ev.level}</span>
                      </div>
                      <p style={{ color: '#475569', fontSize: 9, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.6 }}>{ev.note}</p>
                      <div style={{ color: '#1F2937', fontSize: 8, fontFamily: "'JetBrains Mono', monospace", marginTop: 6 }}>{ev.date}</div>
                    </div>
                  );
                })}
              </div>
            </motion.section>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-10 border-t border-[#0F172A] mt-12 bg-[#020617] relative z-20">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-[#1F2937]">
            <span className="text-[10px] font-mono tracking-[0.5em]">{t('team.member.footerOperative')}</span>
            <div className="w-12 h-[1px] bg-[#1F2937]" />
            <span className="text-[10px] font-mono tracking-[0.5em]">{t('team.member.footerAuth')}</span>
          </div>
          <div className="text-[10px] font-mono text-[#1F2937]">{t('team.member.footerCopyright')}</div>
        </div>
      </footer>
    </div>
  );
}
