export type RankKey = 'iron' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'ruby' | 'diamond';

export interface RankConfig {
  label: string;
  tier: number;
  color: string;
  gradientFrom: string;
  gradientTo: string;
  glowColor: string;
  symbol: string;
  particleColor: string;
  minLevel: number;
  maxLevel: number;
  uncapped?: boolean;  // true → legend shows "maxLevel+"
}

export const RANKS: Record<RankKey, RankConfig> = {
  iron: {
    label: 'IRON',
    tier: 1,
    color: '#9CA3AF',
    gradientFrom: '#4B5563',
    gradientTo: '#9CA3AF',
    glowColor: 'rgba(156,163,175,0.35)',
    symbol: '⬡',
    particleColor: '#9CA3AF',
    minLevel: 1,
    maxLevel: 14,
  },
  bronze: {
    label: 'BRONZE',
    tier: 2,
    color: '#CD7F32',
    gradientFrom: '#92400E',
    gradientTo: '#F59E0B',
    glowColor: 'rgba(205,127,50,0.55)',
    symbol: '◈',
    particleColor: '#CD7F32',
    minLevel: 15,
    maxLevel: 34,
  },
  silver: {
    label: 'SILVER',
    tier: 3,
    color: '#CBD5E1',
    gradientFrom: '#94A3B8',
    gradientTo: '#E2E8F0',
    glowColor: 'rgba(203,213,225,0.5)',
    symbol: '◇',
    particleColor: '#CBD5E1',
    minLevel: 35,
    maxLevel: 54,
  },
  gold: {
    label: 'GOLD',
    tier: 4,
    color: '#FFD700',
    gradientFrom: '#F59E0B',
    gradientTo: '#FDE68A',
    glowColor: 'rgba(255,215,0,0.6)',
    symbol: '★',
    particleColor: '#FFD700',
    minLevel: 55,
    maxLevel: 74,
  },
  platinum: {
    label: 'PLATINUM',
    tier: 5,
    color: '#14B8A6',
    gradientFrom: '#14B8A6',
    gradientTo: '#8B5CF6',
    glowColor: 'rgba(20,184,166,0.6)',
    symbol: '❋',
    particleColor: '#14B8A6',
    minLevel: 75,
    maxLevel: 94,
  },
  ruby: {
    label: 'RUBY',
    tier: 6,
    color: '#EF4444',
    gradientFrom: '#DC2626',
    gradientTo: '#F87171',
    glowColor: 'rgba(239,68,68,0.7)',
    symbol: '♦',
    particleColor: '#EF4444',
    minLevel: 95,
    maxLevel: 114,
  },
  diamond: {
    label: 'DIAMOND',
    tier: 7,
    color: '#818CF8',
    gradientFrom: '#818CF8',
    gradientTo: '#7DD3FC',
    glowColor: 'rgba(129,140,248,0.7)',
    symbol: '✦',
    particleColor: '#7DD3FC',
    minLevel: 115,
    maxLevel: 135,
    uncapped: true,
  },
};

export interface MissionLog {
  title: string;
  date: string;
  status: 'completed' | 'ongoing' | 'failed';
}

export interface RankProgressEvent {
  rank: RankKey;
  level: number;
  date: string;
  note: string;
}

export interface Member {
  id: number;
  name: string;
  title: string;
  role: string;
  roleCode: string;
  team: string;
  rank: RankKey;
  level: number;
  currentXP: number;
  maxXP: number;
  img: string;
  bio: string;
  specialty: string;
  missions: number;
  achievements: string[];
  skills: Record<string, number>;
  techStack: string[];
  missionLogs: MissionLog[];
  rankHistory: RankProgressEvent[];
}

const ROLE_SYMBOLS: Record<string, string> = {
  PM:      '⊙',  // Product Manager
  PO:      '◉',  // Product Owner
  CEO:     '⬢',  // Chief Executive Officer
  SC:      '◈',  // Scrum Master
  HR:      '◇',  // Nhân sự (Human Resources)
  MKT:     '◐',  // Marketing
  DESIGNER: '✦', // Designer
  DEV_FE:  '⌖',  // Frontend Developer
  DEV_BE:  '⌗',  // Backend Developer
  DEV_FS:  '⊛',  // Full Stack Developer
  DEVOPS:  '⬡',  // DevOps Engineer
  QA:      '◎',  // Quality Assurance
  DATA:    '◆',  // Data Analyst/Engineer
  TECH:    '★',  // Tech Lead/CTO
};

export const members: Member[] = [
  {
    id: 1,
    name: 'Kai Tanaka',
    title: 'Junior Operative',
    role: 'Frontend Dev',
    roleCode: 'BOW',
    team: 'Alpha',
    rank: 'iron',
    level: 8,
    currentXP: 45,
    maxXP: 100,
    img: 'https://images.unsplash.com/photo-1769221909855-d1f62ef5aaa7?auto=format&fit=crop&w=400&h=560&crop=faces',
    bio: 'The blade is still being tempered. Raw potential awaits the flame of experience.',
    specialty: 'Vue.js & CSS Animations',
    missions: 12,
    achievements: ['First Deployment', 'Void Hunter', 'Code Apprentice'],
    skills: { Code: 35, Design: 20, Strategy: 15, Execution: 38, Teamwork: 30 },
    techStack: ['Vue.js', 'Tailwind CSS', 'TypeScript', 'Figma'],
    missionLogs: [
      { title: 'Landing Page Redesign', date: '2026-03-10', status: 'completed' },
      { title: 'Component Library Setup', date: '2026-02-28', status: 'completed' },
      { title: 'Dark Mode Integration', date: '2026-03-18', status: 'ongoing' },
    ],
    rankHistory: [
      { rank: 'iron', level: 1, date: '2025-11-15', note: 'Guild Registration — A new blade is forged.' },
    ],
  },
  {
    id: 2,
    name: 'Mei Lin',
    title: 'Visual Artisan',
    role: 'UI/UX Designer',
    roleCode: 'STAFF',
    team: 'Sigma',
    rank: 'bronze',
    level: 24,
    currentXP: 78,
    maxXP: 100,
    img: 'https://images.unsplash.com/photo-1729337531424-198f880cb6c7?auto=format&fit=crop&w=400&h=560&crop=faces',
    bio: 'A steady ember growing brighter. Craft sharpens with every design cycle.',
    specialty: 'Design Systems & Figma',
    missions: 28,
    achievements: ['Pixel Perfect', 'Design Sage', 'Sprint Champion', 'Brand Keeper'],
    skills: { Code: 25, Design: 72, Strategy: 45, Execution: 58, Teamwork: 65 },
    techStack: ['Figma', 'Adobe XD', 'Framer', 'Protopie', 'Spline'],
    missionLogs: [
      { title: 'Dashboard Redesign v2', date: '2026-03-15', status: 'completed' },
      { title: 'Mobile App UX Audit', date: '2026-03-08', status: 'completed' },
      { title: 'Brand Identity System', date: '2026-03-20', status: 'ongoing' },
    ],
    rankHistory: [
      { rank: 'iron', level: 1, date: '2025-06-01', note: 'Guild Registration — The artisan awakens.' },
      { rank: 'bronze', level: 15, date: '2025-08-12', note: 'Bronze Ascension — First major design sprint shipped.' },
    ],
  },
  {
    id: 3,
    name: 'Ryo Hashimoto',
    title: 'Code Sentinel',
    role: 'Backend Dev',
    roleCode: 'DAGGER',
    team: 'Alpha',
    rank: 'silver',
    level: 43,
    currentXP: 62,
    maxXP: 100,
    img: 'https://images.unsplash.com/photo-1547137289-636000d1ec10?auto=format&fit=crop&w=400&h=560&crop=faces',
    bio: 'Silver paths carved through countless debug storms. APIs bow to his will.',
    specialty: 'Node.js & Microservices',
    missions: 51,
    achievements: ['Centurion Coder', 'API Architect', 'Bug Slayer', 'Night Owl', 'Zero Downtime'],
    skills: { Code: 78, Design: 30, Strategy: 60, Execution: 72, Teamwork: 55 },
    techStack: ['Node.js', 'PostgreSQL', 'Redis', 'Docker', 'GraphQL'],
    missionLogs: [
      { title: 'Auth Service Overhaul', date: '2026-03-12', status: 'completed' },
      { title: 'Cache Layer Migration', date: '2026-03-05', status: 'completed' },
      { title: 'Payment API Integration', date: '2026-03-19', status: 'ongoing' },
    ],
    rankHistory: [
      { rank: 'iron', level: 1, date: '2025-01-10', note: 'Guild Registration — Entered the forge.' },
      { rank: 'bronze', level: 15, date: '2025-02-28', note: 'Bronze Ascension — First API deployed to production.' },
      { rank: 'silver', level: 35, date: '2025-05-20', note: 'Silver Ascension — Centurion Coder badge earned.' },
    ],
  },
  {
    id: 4,
    name: 'Yuna Park',
    title: 'Dual-Path Operative',
    role: 'Full Stack Dev',
    roleCode: 'DUAL',
    team: 'Omega',
    rank: 'gold',
    level: 68,
    currentXP: 85,
    maxXP: 100,
    img: 'https://images.unsplash.com/photo-1665615839740-f9cfcc9568f9?auto=format&fit=crop&w=400&h=560&crop=faces',
    bio: 'Where code meets art — Yuna commands both with effortless grace.',
    specialty: 'React & System Architecture',
    missions: 84,
    achievements: ['Gold Standard', 'Full Stack Legend', 'Sprint MVP', 'Mentor Badge', 'Architect Seal', '1000 Commits'],
    skills: { Code: 85, Design: 70, Strategy: 75, Execution: 88, Teamwork: 80 },
    techStack: ['React', 'Next.js', 'Prisma', 'PostgreSQL', 'AWS', 'Tailwind'],
    missionLogs: [
      { title: 'E-commerce Platform v3', date: '2026-03-14', status: 'completed' },
      { title: 'Real-time Chat Feature', date: '2026-03-09', status: 'completed' },
      { title: 'SaaS Dashboard MVP', date: '2026-03-21', status: 'ongoing' },
    ],
    rankHistory: [
      { rank: 'iron', level: 1, date: '2024-09-05', note: 'Guild Registration — Dual blades unsheathed.' },
      { rank: 'bronze', level: 15, date: '2024-10-22', note: 'Bronze Ascension — Full-stack delivery champion.' },
      { rank: 'silver', level: 35, date: '2025-01-14', note: 'Silver Ascension — 1,000 commits milestone.' },
      { rank: 'gold', level: 55, date: '2025-07-03', note: 'Gold Ascension — Sprint MVP awarded, Gold Standard unlocked.' },
    ],
  },
  {
    id: 5,
    name: 'Shin Watanabe',
    title: 'Infrastructure Warden',
    role: 'DevOps Engineer',
    roleCode: 'SHIELD',
    team: 'Sigma',
    rank: 'platinum',
    level: 85,
    currentXP: 40,
    maxXP: 100,
    img: 'https://images.unsplash.com/photo-1618698937393-8d7bb5f2d341?auto=format&fit=crop&w=400&h=560&crop=faces',
    bio: 'Infrastructure whisperer. No system escapes his order. The pipeline obeys.',
    specialty: 'Kubernetes & CI/CD',
    missions: 103,
    achievements: ['Platinum Guard', 'Zero Incident', 'Pipeline Master', 'K8s Warden', 'Security Seal', 'SRE Elite'],
    skills: { Code: 70, Design: 25, Strategy: 88, Execution: 90, Teamwork: 72 },
    techStack: ['Kubernetes', 'Terraform', 'AWS', 'GitHub Actions', 'Prometheus', 'Grafana'],
    missionLogs: [
      { title: 'Multi-Region Deployment', date: '2026-03-11', status: 'completed' },
      { title: 'Security Audit & Hardening', date: '2026-03-07', status: 'completed' },
      { title: 'Observability Stack Setup', date: '2026-03-20', status: 'ongoing' },
    ],
    rankHistory: [
      { rank: 'iron', level: 1, date: '2024-03-10', note: 'Guild Registration — The warden takes post.' },
      { rank: 'bronze', level: 15, date: '2024-05-01', note: 'Bronze Ascension — First CI/CD pipeline automated.' },
      { rank: 'silver', level: 35, date: '2024-07-18', note: 'Silver Ascension — Zero Incident badge earned.' },
      { rank: 'gold', level: 55, date: '2024-10-30', note: 'Gold Ascension — Kubernetes cluster scaled to 50 nodes.' },
      { rank: 'platinum', level: 75, date: '2025-04-12', note: 'Platinum Ascension — Platinum Guard seal bestowed.' },
    ],
  },
  {
    id: 6,
    name: 'Rin Nakamura',
    title: 'Crimson Architect',
    role: 'Backend Lead',
    roleCode: 'DAGGER',
    team: 'Omega',
    rank: 'ruby',
    level: 103,
    currentXP: 60,
    maxXP: 100,
    img: 'https://images.unsplash.com/photo-1725144118950-44dc92db3f09?auto=format&fit=crop&w=400&h=560&crop=faces',
    bio: 'Aggressive precision. Every function is a strike. Systems fear her refactors.',
    specialty: 'High-Performance Systems',
    missions: 138,
    achievements: ['Ruby Ascendant', 'Refactor Deity', 'SQL Samurai', 'API Overlord', 'Latency Slayer', 'Concurrency Master', 'Elite Hacker'],
    skills: { Code: 95, Design: 40, Strategy: 85, Execution: 96, Teamwork: 78 },
    techStack: ['Rust', 'Go', 'PostgreSQL', 'Kafka', 'gRPC', 'Kubernetes', 'ClickHouse'],
    missionLogs: [
      { title: 'Distributed Cache System', date: '2026-03-13', status: 'completed' },
      { title: 'Event Sourcing Migration', date: '2026-03-06', status: 'completed' },
      { title: '10x Performance Refactor', date: '2026-03-22', status: 'ongoing' },
    ],
    rankHistory: [
      { rank: 'iron', level: 1, date: '2023-08-20', note: 'Guild Registration — Crimson blade draws first blood.' },
      { rank: 'bronze', level: 15, date: '2023-10-05', note: 'Bronze Ascension — Bug Slayer badge first earned.' },
      { rank: 'silver', level: 35, date: '2024-01-17', note: 'Silver Ascension — SQL Samurai mastery confirmed.' },
      { rank: 'gold', level: 55, date: '2024-05-22', note: 'Gold Ascension — API Overlord title claimed.' },
      { rank: 'platinum', level: 75, date: '2024-09-14', note: 'Platinum Ascension — Latency Slayer achieves sub-1ms.' },
      { rank: 'ruby', level: 95, date: '2025-02-28', note: 'Ruby Ascension — Ruby Ascendant seal forged in fire.' },
    ],
  },
  {
    id: 7,
    name: 'Akira Sato',
    title: 'Guild Master',
    role: 'Tech Lead',
    roleCode: 'MAP',
    team: 'All',
    rank: 'diamond',
    level: 118,
    currentXP: 92,
    maxXP: 100,
    img: 'https://images.unsplash.com/photo-1750741268857-7e44510f867d?auto=format&fit=crop&w=400&h=560&crop=faces',
    bio: 'The apex operative. A legend carved in silicon and starlight. The guild bows.',
    specialty: 'Vision & System Architecture',
    missions: 201,
    achievements: ['Diamond Ascension', 'Guild Master Seal', 'Tech Visionary', 'Legendary Architect', 'Infinite Commits', 'Team Forger', 'Lore Keeper', 'Apex Predator'],
    skills: { Code: 98, Design: 82, Strategy: 99, Execution: 97, Teamwork: 95 },
    techStack: ['Everything', 'System Design', 'Leadership', 'React', 'Go', 'Rust', 'AWS', 'GCP'],
    missionLogs: [
      { title: 'Platform Architecture Overhaul', date: '2026-03-16', status: 'completed' },
      { title: 'Team Scaling Strategy', date: '2026-03-10', status: 'completed' },
      { title: 'Next-Gen Product Vision', date: '2026-03-22', status: 'ongoing' },
    ],
    rankHistory: [
      { rank: 'iron', level: 1, date: '2022-04-01', note: 'Guild Registration — The legend begins its chronicle.' },
      { rank: 'bronze', level: 15, date: '2022-06-15', note: 'Bronze Ascension — First architectural vision drafted.' },
      { rank: 'silver', level: 35, date: '2022-09-30', note: 'Silver Ascension — Team of 5 assembled and forged.' },
      { rank: 'gold', level: 55, date: '2023-01-22', note: 'Gold Ascension — Platform v1 launched to 10k users.' },
      { rank: 'platinum', level: 75, date: '2023-06-08', note: 'Platinum Ascension — Lore Keeper title inscribed.' },
      { rank: 'ruby', level: 95, date: '2023-12-01', note: 'Ruby Ascension — Legendary Architect seal obtained.' },
      { rank: 'diamond', level: 115, date: '2024-08-18', note: 'Diamond Ascension — Guild Master throne ascended.' },
    ],
  },
];