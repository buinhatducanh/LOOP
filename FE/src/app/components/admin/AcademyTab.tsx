import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, Search, Edit3, Trash2, Eye, BookOpen, Users, Star,
  ChevronDown, X, Check, Clock, TrendingUp, Award, Zap,
  ToggleLeft, ToggleRight, Upload,
  Play, BarChart3, FileText, MessageCircle, UserCheck, AlertCircle, Loader2,
} from 'lucide-react';
import { DS, GRD } from '../layout/ds';
import { academyService } from '../../../api/academy.service';

// ── StudentProgress bridge type (BE → FE) ──────────────────────────────────────
// Maps BE enrollment response to the local StudentProgress shape
function mapEnrollmentToStudent(be: Record<string, unknown>): StudentProgress {
  return {
    id: Number(be.id ?? 0),
    name: String(be.studentName ?? be.userName ?? 'Học viên'),
    avatar: String(be.avatarUrl ?? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(String(be.studentName ?? 'HV'))}`),
    courseId: Number(be.courseId ?? 0),
    courseTitle: String(be.courseTitle ?? '—'),
    enrolledAt: be.enrolledAt ? new Date(String(be.enrolledAt)).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—',
    progress: Number(be.progress ?? 0),
    lessonsCompleted: Number(be.lessonsCompleted ?? 0),
    totalLessons: Number(be.totalLessons ?? 0),
    lastActive: be.lastActiveAt ? new Date(String(be.lastActiveAt)).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—',
    totalWatchTime: String(be.totalWatchTime ?? '0h 0p'),
    quizAvg: Number(be.quizAvg ?? 0),
    status: (['active', 'completed', 'inactive', 'dropped'].includes(String(be.status ?? '')) ? be.status : 'active') as StudentProgress['status'],
    lpEarned: Number(be.lpEarned ?? 0),
    certificateIssued: Boolean(be.certificateIssued ?? false),
  };
}

const fmtVND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

type Course = {
  id: number;
  title: string;
  instructor: string;
  cat: string;
  level: string;
  price: number;
  lpReward: number;
  students: number;
  rating: number;
  status: 'published' | 'draft' | 'archived';
  duration: string;
  revenue: number;
  img: string;
  createdAt: string;
};

const INITIAL_COURSES: Course[] = [
  { id: 1, title: 'React & Next.js 14 Từ Zero Đến Hero', instructor: 'Akira Sato', cat: 'Frontend', level: 'Intermediate', price: 2_000_000, lpReward: 200, students: 2400, rating: 4.9, status: 'published', duration: '32h', revenue: 4_800_000_000, img: 'https://images.unsplash.com/photo-1634836023845-eddbfe9937da?auto=format&fit=crop&w=80&q=80', createdAt: '01/01/2026' },
  { id: 2, title: 'UI/UX Design System với Figma & Tailwind', instructor: 'Mei Lin', cat: 'Design', level: 'Beginner', price: 1_500_000, lpReward: 150, students: 1800, rating: 4.8, status: 'published', duration: '18h', revenue: 2_700_000_000, img: 'https://images.unsplash.com/photo-1590965918603-0dce981d13b8?auto=format&fit=crop&w=80&q=80', createdAt: '05/01/2026' },
  { id: 3, title: 'Node.js API & PostgreSQL: Production-Ready', instructor: 'Ryo Hashimoto', cat: 'Backend', level: 'Advanced', price: 2_500_000, lpReward: 250, students: 1200, rating: 4.9, status: 'published', duration: '26h', revenue: 3_000_000_000, img: 'https://images.unsplash.com/photo-1771012788703-d310cdf189bb?auto=format&fit=crop&w=80&q=80', createdAt: '10/01/2026' },
  { id: 4, title: 'Kubernetes & DevOps cho Startup Việt Nam', instructor: 'Shin Watanabe', cat: 'DevOps', level: 'Advanced', price: 3_000_000, lpReward: 300, students: 890, rating: 4.7, status: 'published', duration: '22h', revenue: 2_670_000_000, img: 'https://images.unsplash.com/photo-1596843720750-7de9329da5d7?auto=format&fit=crop&w=80&q=80', createdAt: '15/01/2026' },
  { id: 5, title: 'SEO & Content Marketing cho SaaS B2B', instructor: 'Yuna Park', cat: 'Marketing', level: 'Beginner', price: 1_200_000, lpReward: 120, students: 3100, rating: 4.8, status: 'published', duration: '14h', revenue: 3_720_000_000, img: 'https://images.unsplash.com/photo-1517309561013-16f6e4020305?auto=format&fit=crop&w=80&q=80', createdAt: '20/01/2026' },
  { id: 6, title: 'High-Performance Rust & Go cho Backend', instructor: 'Rin Nakamura', cat: 'Backend', level: 'Expert', price: 4_500_000, lpReward: 450, students: 680, rating: 5.0, status: 'published', duration: '40h', revenue: 3_060_000_000, img: 'https://images.unsplash.com/photo-1762330910399-95caa55acf04?auto=format&fit=crop&w=80&q=80', createdAt: '25/01/2026' },
  { id: 7, title: 'Python ML & AI cho Web Developer', instructor: 'Ryo Hashimoto', cat: 'AI/ML', level: 'Intermediate', price: 3_500_000, lpReward: 350, students: 0, rating: 0, status: 'draft', duration: '28h', revenue: 0, img: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=80&q=80', createdAt: '01/03/2026' },
];

const catColors: Record<string, string> = {
  Frontend: DS.blue, Design: DS.purple, Backend: DS.cyan,
  DevOps: DS.green, Marketing: DS.amber, 'AI/ML': DS.red,
};
const levelColors: Record<string, string> = {
  Beginner: DS.green, Intermediate: DS.blue, Advanced: DS.amber, Expert: DS.red,
};
const statusCfg: Record<string, { label: string; color: string }> = {
  published: { label: 'Đã xuất bản', color: DS.green },
  draft: { label: 'Bản nháp', color: DS.amber },
  archived: { label: 'Đã lưu trữ', color: DS.text4 },
};

// ── Student data ──────────────────────────────────────────────────────────
type StudentProgress = {
  id: number;
  name: string;
  avatar: string;
  courseId: number;
  courseTitle: string;
  enrolledAt: string;
  progress: number; // 0-100
  lessonsCompleted: number;
  totalLessons: number;
  lastActive: string;
  totalWatchTime: string;
  quizAvg: number;
  status: 'active' | 'completed' | 'inactive' | 'dropped';
  lpEarned: number;
  certificateIssued: boolean;
};

const MOCK_STUDENTS: StudentProgress[] = [
  { id: 1, name: 'Trần Minh Khoa', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=50&h=50&crop=faces', courseId: 1, courseTitle: 'React & Next.js 14 Từ Zero Đến Hero', enrolledAt: '01/02/2026', progress: 85, lessonsCompleted: 41, totalLessons: 48, lastActive: '24/03/2026', totalWatchTime: '28h 15p', quizAvg: 92, status: 'active', lpEarned: 170, certificateIssued: false },
  { id: 2, name: 'Lê Thu Hằng', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=50&h=50&crop=faces', courseId: 1, courseTitle: 'React & Next.js 14 Từ Zero Đến Hero', enrolledAt: '15/01/2026', progress: 100, lessonsCompleted: 48, totalLessons: 48, lastActive: '10/03/2026', totalWatchTime: '33h 40p', quizAvg: 96, status: 'completed', lpEarned: 200, certificateIssued: true },
  { id: 3, name: 'Phạm Văn Đức', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=50&h=50&crop=faces', courseId: 1, courseTitle: 'React & Next.js 14 Từ Zero Đến Hero', enrolledAt: '20/02/2026', progress: 42, lessonsCompleted: 20, totalLessons: 48, lastActive: '22/03/2026', totalWatchTime: '13h 05p', quizAvg: 78, status: 'active', lpEarned: 84, certificateIssued: false },
  { id: 4, name: 'Nguyễn Thị Lan', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=50&h=50&crop=faces', courseId: 2, courseTitle: 'UI/UX Design System với Figma', enrolledAt: '10/01/2026', progress: 100, lessonsCompleted: 32, totalLessons: 32, lastActive: '05/03/2026', totalWatchTime: '19h 20p', quizAvg: 88, status: 'completed', lpEarned: 150, certificateIssued: true },
  { id: 5, name: 'Hoàng Văn Nam', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=50&h=50&crop=faces', courseId: 2, courseTitle: 'UI/UX Design System với Figma', enrolledAt: '25/02/2026', progress: 65, lessonsCompleted: 21, totalLessons: 32, lastActive: '23/03/2026', totalWatchTime: '11h 45p', quizAvg: 82, status: 'active', lpEarned: 98, certificateIssued: false },
  { id: 6, name: 'Vũ Thanh Tùng', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=50&h=50&crop=faces', courseId: 3, courseTitle: 'Node.js API & PostgreSQL', enrolledAt: '01/03/2026', progress: 30, lessonsCompleted: 17, totalLessons: 56, lastActive: '24/03/2026', totalWatchTime: '8h 30p', quizAvg: 85, status: 'active', lpEarned: 75, certificateIssued: false },
  { id: 7, name: 'Đỗ Thị Mai', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=50&h=50&crop=faces', courseId: 3, courseTitle: 'Node.js API & PostgreSQL', enrolledAt: '15/02/2026', progress: 12, lessonsCompleted: 7, totalLessons: 56, lastActive: '10/03/2026', totalWatchTime: '3h 15p', quizAvg: 70, status: 'inactive', lpEarned: 30, certificateIssued: false },
  { id: 8, name: 'Lý Quốc Bảo', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=50&h=50&crop=faces', courseId: 4, courseTitle: 'Kubernetes & DevOps', enrolledAt: '20/01/2026', progress: 75, lessonsCompleted: 28, totalLessons: 37, lastActive: '23/03/2026', totalWatchTime: '16h 30p', quizAvg: 90, status: 'active', lpEarned: 225, certificateIssued: false },
  { id: 9, name: 'Ngô Hải Yến', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=50&h=50&crop=faces', courseId: 5, courseTitle: 'SEO & Content Marketing', enrolledAt: '05/03/2026', progress: 55, lessonsCompleted: 14, totalLessons: 25, lastActive: '24/03/2026', totalWatchTime: '7h 45p', quizAvg: 88, status: 'active', lpEarned: 66, certificateIssued: false },
  { id: 10, name: 'Trương Đình Phong', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=50&h=50&crop=faces', courseId: 1, courseTitle: 'React & Next.js 14 Từ Zero Đến Hero', enrolledAt: '10/03/2026', progress: 8, lessonsCompleted: 4, totalLessons: 48, lastActive: '15/03/2026', totalWatchTime: '2h 10p', quizAvg: 0, status: 'dropped', lpEarned: 0, certificateIssued: false },
];

const STUDENT_STATUS_CFG: Record<string, { label: string; color: string }> = {
  active: { label: 'Đang học', color: DS.green },
  completed: { label: 'Hoàn thành', color: DS.blue },
  inactive: { label: 'Không hoạt động', color: DS.amber },
  dropped: { label: 'Bỏ học', color: DS.red },
};

// ── Student Detail Modal ──────────────────────────────────────────────────
function StudentDetailModal({ student, onClose }: { student: StudentProgress; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg rounded-2xl overflow-hidden" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
        <div className="flex items-center justify-between p-5" style={{ borderBottom: `1px solid ${DS.border}` }}>
          <div style={{ color: DS.text, fontSize: 15, fontWeight: 700 }}>Chi tiết học viên</div>
          <button onClick={onClose} style={{ color: DS.text4, background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
        </div>
        <div className="p-5 space-y-5">
          {/* Student info */}
          <div className="flex items-center gap-4">
            <img src={student.avatar} alt={student.name} className="w-14 h-14 rounded-xl object-cover" style={{ border: `2px solid ${STUDENT_STATUS_CFG[student.status].color}50` }} />
            <div>
              <div style={{ color: DS.text, fontSize: 16, fontWeight: 700 }}>{student.name}</div>
              <div style={{ color: DS.text4, fontSize: 12, marginTop: 2 }}>{student.courseTitle}</div>
              <div className="flex items-center gap-2 mt-1">
                <span style={{ color: STUDENT_STATUS_CFG[student.status].color, fontSize: 10, fontFamily: DS.mono, border: `1px solid ${STUDENT_STATUS_CFG[student.status].color}30`, padding: '1px 6px', borderRadius: 4, background: `${STUDENT_STATUS_CFG[student.status].color}10` }}>
                  {STUDENT_STATUS_CFG[student.status].label}
                </span>
                {student.certificateIssued && <span style={{ color: DS.amber, fontSize: 10, fontFamily: DS.mono }}>🏆 Certificate</span>}
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="p-4 rounded-xl" style={{ background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
            <div className="flex items-center justify-between mb-2">
              <span style={{ color: DS.text3, fontSize: 12 }}>Tiến độ khóa học</span>
              <span style={{ color: DS.blue, fontSize: 14, fontFamily: DS.mono, fontWeight: 700 }}>{student.progress}%</span>
            </div>
            <div className="rounded-full overflow-hidden" style={{ height: 6, background: DS.border }}>
              <div style={{ height: '100%', width: `${student.progress}%`, background: GRD.primary, borderRadius: 99, transition: 'width 0.3s' }} />
            </div>
            <div style={{ color: DS.text5, fontSize: 11, marginTop: 6 }}>
              {student.lessonsCompleted}/{student.totalLessons} bài đã hoàn thành
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Ngày đăng ký', value: student.enrolledAt, color: DS.blue },
              { label: 'Hoạt động gần nhất', value: student.lastActive, color: DS.green },
              { label: 'Tổng thời gian xem', value: student.totalWatchTime, color: DS.cyan },
              { label: 'Điểm TB Quiz', value: student.quizAvg > 0 ? `${student.quizAvg}/100` : 'N/A', color: DS.purple },
              { label: 'LP đã nhận', value: `${student.lpEarned} LP`, color: DS.amber },
              { label: 'Certificate', value: student.certificateIssued ? 'Đã cấp' : 'Chưa', color: student.certificateIssued ? DS.green : DS.text5 },
            ].map(s => (
              <div key={s.label} className="p-3 rounded-xl" style={{ background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
                <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, marginBottom: 4 }}>{s.label}</div>
                <div style={{ color: s.color, fontSize: 13, fontWeight: 700 }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Video progress chart (pure SVG) */}
          <div className="p-4 rounded-xl" style={{ background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
            <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.1em', marginBottom: 10 }}>TIẾN ĐỘ THEO TUẦN</div>
            <svg width="100%" height="80" viewBox="0 0 400 80">
              {[15, 25, 35, 48, 55, 65, 72, student.progress].map((v, i) => (
                <g key={i}>
                  <rect x={i * 50 + 2} y={80 - v * 0.75} width={44} height={v * 0.75} rx={4} fill={`${DS.blue}${i === 7 ? 'cc' : '60'}`} />
                  <text x={i * 50 + 24} y={76} textAnchor="middle" fontSize="8" fill={DS.text5} fontFamily={DS.mono}>T{i + 1}</text>
                </g>
              ))}
            </svg>
          </div>
        </div>
        <div className="p-5" style={{ borderTop: `1px solid ${DS.border}` }}>
          <button onClick={onClose} className="w-full py-2.5 rounded-xl" style={{ background: GRD.primary, color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Đóng</button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Modal tạo/sửa khóa học ────────────────────────────────────────────────
function CourseModal({ course, onClose, onSave }: {
  course: Partial<Course> | null;
  onClose: () => void;
  onSave: (c: Course) => void;
}) {
  const isNew = !course?.id;
  const [form, setForm] = useState<Partial<Course>>({
    title: '', instructor: '', cat: 'Frontend', level: 'Intermediate',
    price: 1_500_000, lpReward: 150, duration: '10h', status: 'draft',
    img: 'https://images.unsplash.com/photo-1634836023845-eddbfe9937da?auto=format&fit=crop&w=80&q=80',
    createdAt: new Date().toLocaleDateString('vi-VN'),
    students: 0, revenue: 0, rating: 0,
    ...course,
  });

  const field = (label: string, key: keyof Course, type = 'text', opts?: string[]) => (
    <div>
      <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: 'block', marginBottom: 6, letterSpacing: '0.12em' }}>{label}</label>
      {opts ? (
        <select value={String(form[key] ?? '')} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
          style={{ width: '100%', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '9px 12px', color: DS.text, fontSize: 13, outline: 'none' }}>
          {opts.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} value={String(form[key] ?? '')} onChange={e => setForm(p => ({ ...p, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
          style={{ width: '100%', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '9px 12px', color: DS.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-xl rounded-2xl overflow-hidden" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
        {/* Header */}
        <div className="flex items-center justify-between p-5" style={{ borderBottom: `1px solid ${DS.border}` }}>
          <div style={{ color: DS.text, fontSize: 15, fontWeight: 700 }}>{isNew ? '+ Thêm khóa học mới' : '✎ Chỉnh sửa khóa học'}</div>
          <button onClick={onClose} style={{ color: DS.text4, background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
        </div>
        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto" style={{ maxHeight: '70vh' }}>
          {field('TIÊU ĐỀ KHÓA HỌC', 'title')}
          {field('GIẢNG VIÊN', 'instructor')}
          <div className="grid grid-cols-2 gap-4">
            {field('DANH MỤC', 'cat', 'text', ['Frontend', 'Backend', 'Design', 'DevOps', 'Marketing', 'AI/ML'])}
            {field('CẤP ĐỘ', 'level', 'text', ['Beginner', 'Intermediate', 'Advanced', 'Expert'])}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {field('GIÁ (VNĐ)', 'price', 'number')}
            {field('LP THƯỞNG', 'lpReward', 'number')}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {field('THỜI LƯỢNG', 'duration')}
            {field('TRẠNG THÁI', 'status', 'text', ['published', 'draft', 'archived'])}
          </div>
          {field('URL ẢNH BÌA', 'img')}
          {form.img && (
            <div className="rounded-xl overflow-hidden" style={{ height: 120 }}>
              <img src={form.img as string} alt="preview" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5" style={{ borderTop: `1px solid ${DS.border}` }}>
          <button onClick={onClose} style={{ background: 'none', border: `1px solid ${DS.border}`, borderRadius: 10, padding: '9px 20px', color: DS.text3, fontSize: 13, cursor: 'pointer' }}>Hủy</button>
          <button onClick={() => onSave({ ...form, id: form.id ?? Date.now() } as Course)}
            style={{ background: GRD.primary, color: '#fff', border: 'none', borderRadius: 10, padding: '9px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 0 16px rgba(129,140,248,0.4)' }}>
            <Check size={13} style={{ display: 'inline', marginRight: 6 }} />{isNew ? 'Tạo khóa học' : 'Lưu thay đổi'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────
export function AcademyTab() {
  // ── API state ──────────────────────────────────────────────────────────────
  const [apiCourses, setApiCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setCoursesLoading(true);
    setCoursesError('');
    academyService.getAdminCourses({ limit: 50 })
      .then(({ courses: fetched }) => { if (!cancelled) setApiCourses(fetched as unknown as Course[]); })
      .catch(() => { if (!cancelled) setCoursesError('Không tải được danh sách khóa học'); })
      .finally(() => { if (!cancelled) setCoursesLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // ── Fetch students from BE ────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setStudentsLoading(true);
    academyService.getAdminEnrollments({ limit: 200 })
      .then(({ enrollments }) => {
        if (cancelled) return;
        if (Array.isArray(enrollments) && enrollments.length > 0) {
          setStudents(enrollments.map(e => mapEnrollmentToStudent(e as Record<string, unknown>)));
        }
        // else: keep MOCK_STUDENTS as fallback
      })
      .catch(() => { /* keep MOCK_STUDENTS */ })
      .finally(() => { if (!cancelled) setStudentsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const displayCourses = coursesLoading && coursesError === '' ? INITIAL_COURSES : apiCourses.length > 0 ? apiCourses : INITIAL_COURSES;

  const [courses, setCourses] = useState<Course[]>(INITIAL_COURSES);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('Tất cả');
  const [filterStatus, setFilterStatus] = useState('Tất cả');
  const [modal, setModal] = useState<null | 'new' | Course>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [activeView, setActiveView] = useState<'courses' | 'students' | 'videos'>('courses');
  const [students, setStudents] = useState<StudentProgress[]>(MOCK_STUDENTS);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentCourseFilter, setStudentCourseFilter] = useState('Tất cả');
  const [studentStatusFilter, setStudentStatusFilter] = useState('Tất cả');
  const [selectedStudent, setSelectedStudent] = useState<StudentProgress | null>(null);

  const cats = ['Tất cả', 'Frontend', 'Backend', 'Design', 'DevOps', 'Marketing', 'AI/ML'];
  const statuses = ['Tất cả', 'published', 'draft', 'archived'];

  const filtered = displayCourses.filter(c =>
    (filterCat === 'Tất cả' || c.cat === filterCat) &&
    (filterStatus === 'Tất cả' || c.status === filterStatus) &&
    (c.title.toLowerCase().includes(search.toLowerCase()) || c.instructor.toLowerCase().includes(search.toLowerCase()))
  );

  const toggleStatus = (id: number) => {
    setCourses(prev => prev.map(c => c.id === id
      ? { ...c, status: c.status === 'published' ? 'draft' : 'published' }
      : c
    ));
  };

  const handleSave = async (updated: Course) => {
    try {
      if (updated.id && typeof updated.id === 'number') {
        // Update existing course via BE API
        await academyService.updateCourse(String(updated.id), {
          title: updated.title,
          titleVi: updated.title,
          price: updated.price,
          lpReward: updated.lpReward,
          status: updated.status,
        });
      } else {
        // Create new course via BE API
        await academyService.createCourse({
          title: updated.title,
          titleVi: updated.title,
          price: updated.price,
          lpReward: updated.lpReward,
          status: updated.status,
          instructorId: 'instr-1', // TODO: wire instructor selector
        });
      }
    } catch {
      // API unavailable — still save locally
    }
    // Update local state regardless
    setCourses(prev => {
      const exists = prev.find(c => c.id === updated.id);
      return exists ? prev.map(c => c.id === updated.id ? updated : c) : [updated, ...prev];
    });
    setModal(null);
  };

  const handleDelete = async (id: number) => {
    try {
      await academyService.deleteCourse(String(id));
    } catch {
      // API unavailable — still delete locally
    }
    setCourses(prev => prev.filter(c => c.id !== id));
    setDeleteId(null);
  };

  const totalStudents = courses.filter(c => c.status === 'published').reduce((s, c) => s + c.students, 0);
  const totalRevenue = courses.reduce((s, c) => s + c.revenue, 0);
  const published = courses.filter(c => c.status === 'published').length;

  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Tổng khóa học', value: String(courses.length), sub: `${published} đã xuất bản`, color: DS.blue, icon: <BookOpen size={16} /> },
          { label: 'Tổng học viên', value: totalStudents.toLocaleString('vi-VN'), sub: 'Tất cả khóa học', color: DS.purple, icon: <Users size={16} /> },
          { label: 'Doanh thu học viện', value: `${(totalRevenue / 1e9).toFixed(1)}B`, sub: 'Tổng cộng VNĐ', color: DS.green, icon: <TrendingUp size={16} /> },
          { label: 'LP đã thưởng', value: courses.reduce((s, c) => s + c.lpReward * c.students, 0).toLocaleString('vi-VN'), sub: 'LP tổng cộng', color: DS.amber, icon: <Zap size={16} /> },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-2xl" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${s.color}15`, border: `1px solid ${s.color}25` }}>
                <span style={{ color: s.color }}>{s.icon}</span>
              </div>
            </div>
            <div style={{ color: s.color, fontFamily: DS.heading, fontSize: 22, fontWeight: 700 }}>{s.value}</div>
            <div style={{ color: DS.text3, fontSize: 12, marginTop: 4 }}>{s.label}</div>
            <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* View tabs */}
      <div className="flex gap-2">
        {[
          { id: 'courses' as const, label: 'Khóa học', icon: <BookOpen size={13} /> },
          { id: 'students' as const, label: 'Học viên & Tiến độ', icon: <Users size={13} /> },
          { id: 'videos' as const, label: 'Video & Bài giảng', icon: <Play size={13} /> },
        ].map(v => (
          <button key={v.id} onClick={() => setActiveView(v.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl"
            style={{
              background: activeView === v.id ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${activeView === v.id ? DS.blue + '40' : DS.border}`,
              color: activeView === v.id ? DS.blue : DS.text3, fontSize: 12, cursor: 'pointer',
            }}>
            {v.icon} {v.label}
          </button>
        ))}
      </div>

      {/* Students View */}
      {activeView === 'students' && (
        <div className="space-y-4">
          {studentsLoading && (
            <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
              <Loader2 size={16} className="animate-spin" style={{ color: DS.purple }} />
              <span style={{ color: DS.text4, fontSize: 12 }}>Đang tải danh sách học viên...</span>
            </div>
          )}
          {/* Student stats */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            {[
              { label: 'Đang học', value: students.filter(s => s.status === 'active').length, color: DS.green, icon: <UserCheck size={14} /> },
              { label: 'Hoàn thành', value: students.filter(s => s.status === 'completed').length, color: DS.blue, icon: <Award size={14} /> },
              { label: 'Không hoạt động', value: students.filter(s => s.status === 'inactive').length, color: DS.amber, icon: <Clock size={14} /> },
              { label: 'Bỏ học', value: students.filter(s => s.status === 'dropped').length, color: DS.red, icon: <AlertCircle size={14} /> },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${s.color}15` }}>
                  <span style={{ color: s.color }}>{s.icon}</span>
                </div>
                <div>
                  <div style={{ color: s.color, fontSize: 18, fontWeight: 700, fontFamily: DS.heading }}>{s.value}</div>
                  <div style={{ color: DS.text4, fontSize: 10 }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Student filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 min-w-48" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
              <Search size={14} style={{ color: DS.text4 }} />
              <input value={studentSearch} onChange={e => setStudentSearch(e.target.value)} placeholder="Tìm học viên..."
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: DS.text3, fontSize: 13, fontFamily: DS.body }} />
            </div>
            <select value={studentCourseFilter} onChange={e => setStudentCourseFilter(e.target.value)}
              style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: '8px 12px', color: DS.text3, fontSize: 12, outline: 'none', cursor: 'pointer' }}>
              <option value="Tất cả">Tất cả khóa học</option>
              {courses.map(c => <option key={c.id} value={String(c.id)}>{c.title}</option>)}
            </select>
            <select value={studentStatusFilter} onChange={e => setStudentStatusFilter(e.target.value)}
              style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: '8px 12px', color: DS.text3, fontSize: 12, outline: 'none', cursor: 'pointer' }}>
              <option value="Tất cả">Tất cả trạng thái</option>
              {Object.entries(STUDENT_STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>

          {/* Student table */}
          <div className="rounded-2xl overflow-hidden" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
            <div className="grid px-4 py-3" style={{ gridTemplateColumns: '2fr 1.5fr 1fr 0.8fr 0.8fr 0.6fr', borderBottom: `1px solid ${DS.border}` }}>
              {['HỌC VIÊN', 'KHÓA HỌC', 'TIẾN ĐỘ', 'QUIZ', 'TRẠNG THÁI', ''].map(h => (
                <div key={h} style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: '0.15em' }}>{h}</div>
              ))}
            </div>
            {students
              .filter(s => (studentCourseFilter === 'Tất cả' || String(s.courseId) === studentCourseFilter) &&
                          (studentStatusFilter === 'Tất cả' || s.status === studentStatusFilter) &&
                          (s.name.toLowerCase().includes(studentSearch.toLowerCase())))
              .map((s, i) => {
                const sc = STUDENT_STATUS_CFG[s.status];
                return (
                  <div key={s.id} className="grid px-4 py-3 items-center"
                    style={{ gridTemplateColumns: '2fr 1.5fr 1fr 0.8fr 0.8fr 0.6fr', borderBottom: i < students.length - 1 ? `1px solid ${DS.border}` : 'none' }}>
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={s.avatar} alt={s.name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                      <div className="min-w-0">
                        <div style={{ color: DS.text, fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                        <div style={{ color: DS.text5, fontSize: 10 }}>Đăng ký: {s.enrolledAt}</div>
                      </div>
                    </div>
                    <div style={{ color: DS.text3, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.courseTitle}</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 rounded-full overflow-hidden" style={{ height: 4, background: DS.border }}>
                        <div style={{ height: '100%', width: `${s.progress}%`, background: s.progress === 100 ? DS.green : DS.blue, borderRadius: 99 }} />
                      </div>
                      <span style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono }}>{s.progress}%</span>
                    </div>
                    <div style={{ color: s.quizAvg >= 80 ? DS.green : s.quizAvg >= 60 ? DS.amber : DS.red, fontSize: 12, fontFamily: DS.mono }}>{s.quizAvg > 0 ? `${s.quizAvg}%` : '—'}</div>
                    <span style={{ color: sc.color, fontSize: 10, fontFamily: DS.mono, background: `${sc.color}10`, border: `1px solid ${sc.color}25`, padding: '2px 6px', borderRadius: 4, display: 'inline-block' }}>{sc.label}</span>
                    <button onClick={() => setSelectedStudent(s)}
                      style={{ color: DS.blue, background: `${DS.blue}12`, border: `1px solid ${DS.blue}25`, borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 10 }}>
                      <Eye size={11} />
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Videos View */}
      {activeView === 'videos' && (
        <div className="space-y-4">
          <div className="rounded-2xl p-5" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
            <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 16 }}>── QUẢN LÝ VIDEO & BÀI GIẢNG</div>
            {courses.filter(c => c.status === 'published').map(c => (
              <div key={c.id} className="mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <img src={c.img} alt={c.title} className="w-10 h-10 rounded-xl object-cover" />
                  <div>
                    <div style={{ color: DS.text, fontSize: 14, fontWeight: 700 }}>{c.title}</div>
                    <div style={{ color: DS.text4, fontSize: 11 }}>👤 {c.instructor} · {c.duration} · {c.students.toLocaleString()} học viên</div>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <span style={{ color: catColors[c.cat], fontSize: 10, fontFamily: DS.mono, border: `1px solid ${catColors[c.cat]}30`, padding: '2px 6px', borderRadius: 4 }}>{c.cat}</span>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3 mb-3">
                  {[
                    { label: 'Tổng video', value: '~' + Math.floor(parseInt(c.duration) * 1.5), color: DS.blue },
                    { label: 'Tổng lượt xem', value: (c.students * 12).toLocaleString(), color: DS.cyan },
                    { label: 'TB xem/bài', value: Math.floor(parseInt(c.duration) / 4 * 60) + 'p', color: DS.purple },
                    { label: 'Tỷ lệ hoàn thành', value: Math.floor(60 + Math.random() * 30) + '%', color: DS.green },
                  ].map(s => (
                    <div key={s.label} className="p-2.5 rounded-xl text-center" style={{ background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
                      <div style={{ color: s.color, fontSize: 14, fontWeight: 700, fontFamily: DS.mono }}>{s.value}</div>
                      <div style={{ color: DS.text5, fontSize: 9 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                {/* Video progress gate info */}
                <div className="p-3 rounded-xl flex items-center gap-3" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
                  <AlertCircle size={14} style={{ color: DS.amber, flexShrink: 0 }} />
                  <div style={{ color: DS.text4, fontSize: 11 }}>
                    <span style={{ color: DS.amber, fontWeight: 700 }}>Video Gate: </span>
                    Học viên phải xem ≥35% thời lượng video trước khi mở bài tiếp theo
                  </div>
                  <button style={{ color: DS.blue, background: `${DS.blue}12`, border: `1px solid ${DS.blue}25`, borderRadius: 6, padding: '3px 10px', cursor: 'pointer', fontSize: 10, whiteSpace: 'nowrap', flexShrink: 0 }}>
                    <Edit3 size={10} style={{ display: 'inline', marginRight: 3 }} />Cấu hình
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Courses View (existing) */}
      {activeView === 'courses' && (
        <>
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 min-w-48" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
          <Search size={14} style={{ color: DS.text4 }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm khóa học, giảng viên..."
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: DS.text3, fontSize: 13, fontFamily: DS.body }} />
        </div>

        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: '8px 12px', color: DS.text3, fontSize: 12, outline: 'none', cursor: 'pointer' }}>
          {cats.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: '8px 12px', color: DS.text3, fontSize: 12, outline: 'none', cursor: 'pointer' }}>
          {statuses.map(s => <option key={s} value={s}>{s === 'Tất cả' ? 'Tất cả trạng thái' : statusCfg[s].label}</option>)}
        </select>

        <button onClick={() => setModal('new')}
          style={{ background: GRD.primary, color: '#fff', border: 'none', borderRadius: 12, padding: '8px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', boxShadow: '0 0 16px rgba(129,140,248,0.35)' }}>
          <Plus size={14} /> Thêm khóa học
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
        <div className="grid px-4 py-3" style={{ gridTemplateColumns: '2.5fr 1fr 0.8fr 0.8fr 0.8fr 0.8fr 1fr', borderBottom: `1px solid ${DS.border}` }}>
          {['KHÓA HỌC', 'DANH MỤC', 'GIÁ', 'HỌC VIÊN', 'DOANH THU', 'TRẠNG THÁI', 'THAO TÁC'].map(h => (
            <div key={h} style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: '0.15em' }}>{h}</div>
          ))}
        </div>
        <AnimatePresence>
          {filtered.map((c, i) => {
            const sc = statusCfg[c.status];
            const cc = catColors[c.cat] ?? DS.blue;
            return (
              <motion.div key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="grid px-4 py-3 items-center"
                style={{ gridTemplateColumns: '2.5fr 1fr 0.8fr 0.8fr 0.8fr 0.8fr 1fr', borderBottom: i < filtered.length - 1 ? `1px solid ${DS.border}` : 'none', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                {/* Course info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
                    <img src={c.img} alt={c.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <div style={{ color: DS.text, fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</div>
                    <div style={{ color: DS.text4, fontSize: 11 }}>👤 {c.instructor} · <span style={{ color: levelColors[c.level] }}>{c.level}</span> · {c.duration}</div>
                  </div>
                </div>
                {/* Cat */}
                <span style={{ color: cc, fontSize: 10, fontFamily: DS.mono, background: `${cc}15`, border: `1px solid ${cc}30`, borderRadius: 6, padding: '2px 8px', display: 'inline-block' }}>{c.cat}</span>
                {/* Price */}
                <div style={{ color: DS.text2, fontSize: 12, fontFamily: DS.mono }}>{(c.price / 1e6).toFixed(1)}M ₫</div>
                {/* Students */}
                <div className="flex items-center gap-1.5" style={{ color: DS.text2, fontSize: 12 }}>
                  <Users size={11} style={{ color: DS.text4 }} />{c.students.toLocaleString()}
                </div>
                {/* Revenue */}
                <div style={{ color: DS.green, fontSize: 12, fontFamily: DS.mono }}>{c.revenue >= 1e9 ? `${(c.revenue / 1e9).toFixed(1)}B` : `${(c.revenue / 1e6).toFixed(0)}M`}</div>
                {/* Status */}
                <button onClick={() => toggleStatus(c.id)} className="flex items-center gap-1.5"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  {c.status === 'published'
                    ? <ToggleRight size={18} style={{ color: DS.green }} />
                    : <ToggleLeft size={18} style={{ color: DS.text4 }} />}
                  <span style={{ color: sc.color, fontSize: 10, fontFamily: DS.mono }}>{sc.label}</span>
                </button>
                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button onClick={() => setModal(c)} style={{ color: DS.blue, background: `${DS.blue}12`, border: `1px solid ${DS.blue}25`, borderRadius: 7, padding: '4px 8px', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Edit3 size={11} /> Sửa
                  </button>
                  <button onClick={() => setDeleteId(c.id)} style={{ color: DS.red, background: `${DS.red}10`, border: `1px solid ${DS.red}20`, borderRadius: 7, padding: '4px 8px', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Trash2 size={11} /> Xóa
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <div style={{ color: DS.text4, fontSize: 32, marginBottom: 8 }}>◎</div>
            <div style={{ color: DS.text4, fontSize: 13 }}>Không có khóa học phù hợp</div>
          </div>
        )}
      </div>

      {/* Enrollment stats */}
      <div className="rounded-2xl p-5" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
        <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 16 }}>── TỶ LỆ HỌC VIÊN THEO DANH MỤC</div>
        <div className="space-y-3">
          {Object.entries(
            courses.filter(c => c.status === 'published').reduce((acc, c) => {
              acc[c.cat] = (acc[c.cat] ?? 0) + c.students;
              return acc;
            }, {} as Record<string, number>)
          ).sort(([, a], [, b]) => b - a).map(([cat, count]) => {
            const pct = Math.round((count / totalStudents) * 100);
            const cc = catColors[cat] ?? DS.blue;
            return (
              <div key={cat} className="flex items-center gap-3">
                <div style={{ width: 70, color: cc, fontSize: 11, fontFamily: DS.mono }}>{cat}</div>
                <div className="flex-1 rounded-full overflow-hidden" style={{ height: 6, background: DS.border }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${cc}cc, ${cc}66)`, borderRadius: 99, transition: 'width 0.6s ease' }} />
                </div>
                <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, width: 60, textAlign: 'right' }}>{count.toLocaleString()} ({pct}%)</div>
              </div>
            );
          })}
        </div>
      </div>
        </>
      )}

      {/* Modals */}
      <AnimatePresence>
        {modal && (
          <CourseModal
            course={modal === 'new' ? null : modal}
            onClose={() => setModal(null)}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="p-6 rounded-2xl w-full max-w-sm" style={{ background: DS.bgCard, border: `1px solid ${DS.red}40` }}>
              <div style={{ color: DS.text, fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Xác nhận xóa khóa học?</div>
              <div style={{ color: DS.text4, fontSize: 13, marginBottom: 20 }}>Thao tác này không thể hoàn tác. Tất cả dữ liệu liên quan sẽ bị xóa.</div>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} style={{ flex: 1, background: 'none', border: `1px solid ${DS.border}`, borderRadius: 10, padding: '10px', color: DS.text3, fontSize: 13, cursor: 'pointer' }}>Hủy</button>
                <button onClick={() => handleDelete(deleteId)} style={{ flex: 1, background: DS.red, border: 'none', borderRadius: 10, padding: '10px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Xóa</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Student Detail Modal */}
      <AnimatePresence>
        {selectedStudent && (
          <StudentDetailModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}