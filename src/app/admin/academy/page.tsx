"use client";

/**
 * Academy Admin Page — LOOP Solutions
 * Route: /admin/academy
 * Wire: /api/admin/edu/courses, /api/admin/edu/instructors, /api/admin/edu/enrollments
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { adminApi } from "@/lib/api/client";
import { DS, GRD } from "@/lib/design-tokens";
import { useAdminTranslations } from "@/i18n/admin/useAdminTranslations";
import {
  BookOpen, Users, RefreshCw, Plus, Play, BookText, Star,
  Edit2, Trash2, X, AlertTriangle, Save,
} from "lucide-react";
import { ImageUpload } from "@/components/ui/ImageUpload";

// ── Types ────────────────────────────────────────────────────────────────────

type Course = {
  id: string;
  title: string;
  titleVi?: string;
  slug: string;
  description?: string;
  thumbnail?: string;
  isPublished: boolean;
  isFeatured: boolean;
  enrolledCount: number;
  lessonCount: number;
  rating?: number;
  price?: number;
  currency?: string;
  lpReward?: number;
  category?: string;
  level?: string;
  instructorId?: string;
  instructorName?: string;
  createdAt: string;
};

type Instructor = {
  id: string;
  name: string;
  title?: string;
  bio?: string;
  avatar?: string;
  specialty?: string;
  socialLinks?: string;
  courseCount: number;
  studentCount: number;
  createdAt: string;
};

type Enrollment = {
  id: string;
  courseId: string;
  memberId: string;
  memberName?: string;
  studentEmail?: string;
  courseTitle?: string;
  enrolledAt: string;
  completedAt?: string;
  status: string;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function toSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[àáạảãâầấậẩẫăằắặẳẫ]/g, "a")
    .replace(/[èéẹẻẽêềếệểễ]/g, "e")
    .replace(/[ìíịỉĩ]/g, "i")
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, "o")
    .replace(/[ùúụủũưừứựửữ]/g, "u")
    .replace(/[ỳýỵỷỹ]/g, "y")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Shared input style
const inp = {
  width: "100%", background: DS.bg, border: `1px solid ${DS.border}`,
  borderRadius: 10, padding: "9px 12px", color: DS.text, fontSize: 13,
  outline: "none", boxSizing: "border-box" as const, fontFamily: DS.body,
};

const labelStyle = {
  color: DS.text4, fontSize: 11, fontFamily: DS.mono,
  letterSpacing: "0.08em", display: "block", marginBottom: 4,
};

const fmtDate = (d: string | Date | null | undefined) => {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("vi-VN"); }
  catch { return String(d); }
};

const fmtVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);

// ── Course Edit Modal ───────────────────────────────────────────────────────

type CourseFormData = {
  title: string; slug: string; description: string; thumbnail: string;
  price: string; lpReward: string; category: string; level: string;
  instructorId: string; isPublished: boolean;
};

function CourseEditModal({
  course,
  instructors,
  onClose,
  onSuccess,
}: {
  course: Course | null;
  instructors: Instructor[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t } = useAdminTranslations();
  const isEdit = !!course;
  const [form, setForm] = useState<CourseFormData>({
    title: course?.title ?? "",
    slug: course?.slug ?? "",
    description: course?.description ?? "",
    thumbnail: course?.thumbnail ?? "",
    price: course?.price?.toString() ?? "",
    lpReward: course?.lpReward?.toString() ?? "0",
    category: course?.category ?? "",
    level: course?.level ?? "Beginner",
    instructorId: course?.instructorId ?? "",
    isPublished: course?.isPublished ?? false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const setTitle = (v: string) => {
    setForm(f => ({ ...f, title: v, slug: f.slug || toSlug(v) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return setError(t("academy.errTitleRequired"));
    if (!form.slug.trim()) return setError(t("academy.errSlugRequired"));
    setSaving(true);
    setError("");
    try {
      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim(),
        description: form.description.trim() || undefined,
        thumbnail: form.thumbnail.trim() || undefined,
        price: form.price ? Number(form.price) : 0,
        lpReward: form.lpReward ? Number(form.lpReward) : 0,
        category: form.category.trim() || undefined,
        level: form.level || undefined,
        instructorId: form.instructorId || undefined,
        isPublished: form.isPublished,
      };
      if (isEdit) {
        await adminApi.put(`/api/admin/edu/courses/${course!.id}`, payload);
      } else {
        await adminApi.post("/api/admin/edu/courses", payload);
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("academy.errSaveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: 24, width: "100%", maxWidth: 600, maxHeight: "90vh", overflowY: "auto" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ color: DS.text, fontWeight: 700, fontSize: 18 }}>{isEdit ? t("academy.formCourseEditTitle") : t("academy.formCourseCreateTitle")}</h3>
            <button onClick={onClose} style={{ background: "none", border: "none", color: DS.text4, cursor: "pointer" }}><X size={18} /></button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={labelStyle}>{t("academy.formCourseTitle")}</label>
              <input style={inp} value={form.title} onChange={(e) => setTitle(e.target.value)} placeholder={t("academy.formCourseTitlePlaceholder")} required />
            </div>
            <div>
              <label style={labelStyle}>{t("academy.formCourseSlug")}</label>
              <input style={inp} value={form.slug} onChange={(e) => setForm(f => ({ ...f, slug: e.target.value }))} placeholder={t("academy.formCourseSlugPlaceholder")} required />
            </div>
            <div>
              <label style={labelStyle}>{t("academy.formCourseDescription")}</label>
              <textarea style={{ ...inp, resize: "vertical", minHeight: 72 }} value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} placeholder={t("academy.formCourseDescPlaceholder")} />
            </div>
            <div>
              <label style={labelStyle}>{t("academy.formCourseThumbnail")}</label>
              <ImageUpload value={form.thumbnail} onChange={url => setForm(f => ({ ...f, thumbnail: url }))} folder="loop-courses" aspectRatio="video" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>{t("academy.formCoursePrice")}</label>
                <input style={inp} type="number" min="0" value={form.price} onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))} placeholder={t("academy.formCoursePricePlaceholder")} />
              </div>
              <div>
                <label style={labelStyle}>{t("academy.formCourseLpReward")}</label>
                <input style={inp} type="number" min="0" value={form.lpReward} onChange={(e) => setForm(f => ({ ...f, lpReward: e.target.value }))} placeholder="0" />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>{t("academy.formCourseCategory")}</label>
                <input style={inp} value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Frontend, Backend..." />
              </div>
              <div>
                <label style={labelStyle}>{t("academy.formCourseLevel")}</label>
                <select style={{ ...inp, cursor: "pointer" }} value={form.level} onChange={(e) => setForm(f => ({ ...f, level: e.target.value }))}>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>
            <div>
              <label style={labelStyle}>{t("academy.formCourseInstructor")}</label>
              <select style={{ ...inp, cursor: "pointer" }} value={form.instructorId} onChange={(e) => setForm(f => ({ ...f, instructorId: e.target.value }))}>
                <option value="">— {t("common.addNew")} —</option>
                {instructors.map(i => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </select>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "4px 0" }}>
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => setForm(f => ({ ...f, isPublished: e.target.checked }))}
                style={{ width: 16, height: 16, accentColor: DS.blue, cursor: "pointer" }}
              />
              <span style={{ color: DS.text3, fontSize: 13 }}>{t("academy.formCoursePublished")}</span>
            </label>

            {error && (
              <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "8px 12px", color: DS.red, fontSize: 12 }}>
                <AlertTriangle size={12} style={{ display: "inline", marginRight: 6 }} />{error}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button type="button" onClick={onClose} style={{ flex: 1, padding: "10px", background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 10, color: DS.text3, cursor: "pointer", fontSize: 13 }}>
                {t("academy.formBtnCancel")}
              </button>
              <button type="submit" disabled={saving} style={{ flex: 1, padding: "10px", background: saving ? DS.text4 : GRD.primary, border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontSize: 13 }}>
                {saving ? t("academy.formBtnSaving") : isEdit ? t("academy.formBtnSave") : t("academy.formBtnCreate")}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Instructor Edit Modal ────────────────────────────────────────────────────

type InstructorFormData = {
  name: string; title: string; avatar: string;
  bio: string; specialty: string; socialLinks: string;
};

function InstructorEditModal({
  instructor,
  onClose,
  onSuccess,
}: {
  instructor: Instructor | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t } = useAdminTranslations();
  const isEdit = !!instructor;
  const [form, setForm] = useState<InstructorFormData>({
    name: instructor?.name ?? "",
    title: instructor?.title ?? "",
    avatar: instructor?.avatar ?? "",
    bio: instructor?.bio ?? "",
    specialty: instructor?.specialty ?? "",
    socialLinks: instructor?.socialLinks ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return setError(t("academy.formInstructorName") + " " + t("common.required").toLowerCase());
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: form.name.trim(),
        title: form.title.trim() || undefined,
        avatar: form.avatar.trim() || undefined,
        bio: form.bio.trim() || undefined,
        specialty: form.specialty.trim() || undefined,
        socialLinks: form.socialLinks.trim() || undefined,
      };
      if (isEdit) {
        await adminApi.put(`/api/admin/edu/instructors/${instructor!.id}`, payload);
      } else {
        await adminApi.post("/api/admin/edu/instructors", payload);
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("academy.errSaveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: 24, width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ color: DS.text, fontWeight: 700, fontSize: 18 }}>{isEdit ? t("academy.formInstructorEditTitle") : t("academy.formInstructorCreateTitle")}</h3>
            <button onClick={onClose} style={{ background: "none", border: "none", color: DS.text4, cursor: "pointer" }}><X size={18} /></button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={labelStyle}>{t("academy.formInstructorName")}</label>
              <input style={inp} value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder={t("academy.formInstructorNamePlaceholder")} required />
            </div>
            <div>
              <label style={labelStyle}>{t("academy.formInstructorTitle")}</label>
              <input style={inp} value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} placeholder={t("academy.formInstructorTitlePlaceholder")} />
            </div>
            <div>
              <label style={labelStyle}>{t("academy.formInstructorSpecialty")}</label>
              <input style={inp} value={form.specialty} onChange={(e) => setForm(f => ({ ...f, specialty: e.target.value }))} placeholder={t("academy.formInstructorSpecialtyPlaceholder")} />
            </div>
            <div>
              <label style={labelStyle}>{t("academy.formInstructorAvatar")}</label>
              <ImageUpload value={form.avatar} onChange={url => setForm(f => ({ ...f, avatar: url }))} folder="loop-instructors" aspectRatio="square" />
            </div>
            <div>
              <label style={labelStyle}>{t("academy.formInstructorBio")}</label>
              <textarea style={{ ...inp, resize: "vertical", minHeight: 80 }} value={form.bio} onChange={(e) => setForm(f => ({ ...f, bio: e.target.value }))} placeholder={t("academy.formInstructorBioPlaceholder")} />
            </div>
            <div>
              <label style={labelStyle}>{t("academy.formInstructorSocial")}</label>
              <textarea style={{ ...inp, resize: "vertical", minHeight: 60, fontFamily: DS.mono, fontSize: 12 }} value={form.socialLinks} onChange={(e) => setForm(f => ({ ...f, socialLinks: e.target.value }))} placeholder='{"linkedin":"...","github":"..."}' />
            </div>

            {error && (
              <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "8px 12px", color: DS.red, fontSize: 12 }}>
                <AlertTriangle size={12} style={{ display: "inline", marginRight: 6 }} />{error}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button type="button" onClick={onClose} style={{ flex: 1, padding: "10px", background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 10, color: DS.text3, cursor: "pointer", fontSize: 13 }}>
                {t("academy.formBtnCancel")}
              </button>
              <button type="submit" disabled={saving} style={{ flex: 1, padding: "10px", background: saving ? DS.text4 : GRD.primary, border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontSize: 13 }}>
                {saving ? t("academy.formBtnSaving") : isEdit ? t("academy.formBtnSave") : t("academy.formBtnCreateInstructor")}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Enrollment Create Form ───────────────────────────────────────────────────

function EnrollmentCreateForm({
  courses,
  onSuccess,
}: {
  courses: Course[];
  onSuccess: () => void;
}) {
  const { t } = useAdminTranslations();
  const [studentEmail, setStudentEmail] = useState("");
  const [courseId, setCourseId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentEmail.trim()) return setError(t("academy.errEmailRequired"));
    if (!courseId) return setError(t("academy.errCourseRequired"));
    setSaving(true);
    setError("");
    try {
      await adminApi.post("/api/admin/edu/enrollments", {
        studentEmail: studentEmail.trim(),
        courseId,
      });
      setStudentEmail("");
      setCourseId("");
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("academy.errEnrollFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
      <div style={{ flex: 1, minWidth: 200 }}>
        <label style={labelStyle}>{t("academy.formEnrollmentEmail")}</label>
        <input style={inp} type="email" value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)} placeholder={t("academy.formEnrollmentEmailPlaceholder")} required />
      </div>
      <div style={{ flex: 1, minWidth: 180 }}>
        <label style={labelStyle}>{t("academy.formEnrollmentCourse")}</label>
        <select style={{ ...inp, cursor: "pointer" }} value={courseId} onChange={(e) => setCourseId(e.target.value)} required>
          <option value="">— {t("common.filter")} —</option>
          {courses.map(c => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
      </div>
      {error && (
        <div style={{ width: "100%", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "8px 12px", color: DS.red, fontSize: 12 }}>
          <AlertTriangle size={12} style={{ display: "inline", marginRight: 6 }} />{error}
        </div>
      )}
      <button type="submit" disabled={saving} style={{ padding: "9px 18px", background: saving ? DS.text4 : GRD.primary, border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 6, alignSelf: "flex-end" }}>
        <Save size={13} />{saving ? t("academy.formBtnSaving") : t("academy.formBtnEnroll")}
      </button>
    </form>
  );
}

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: "1rem" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
        <span style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</span>
        <span style={{ color, background: `${color}15`, borderRadius: 8, padding: "4px", display: "flex" }}>{icon}</span>
      </div>
      <div style={{ color, fontSize: "1.5rem", fontWeight: 700, fontFamily: DS.heading }}>{value}</div>
    </motion.div>
  );
}

export default function AcademyPage() {
  const { t } = useAdminTranslations();
  const [tab, setTab] = useState<"courses" | "instructors" | "enrollments">("courses");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const qc = useQueryClient();

  // Modal/form state
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [editInstructor, setEditInstructor] = useState<Instructor | null>(null);

  // Queries
  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ["admin", "academy", "courses"],
    queryFn: () => adminApi.get<{ data: Course[] }>("/api/admin/edu/courses", { params: { limit: 50 } }),
  });

  const { data: instructorsData, isLoading: instructorsLoading } = useQuery({
    queryKey: ["admin", "academy", "instructors"],
    queryFn: () => adminApi.get<{ data: Instructor[] }>("/api/admin/edu/instructors", { params: { limit: 50 } }),
  });

  const { data: enrollmentsData, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ["admin", "academy", "enrollments"],
    queryFn: () => adminApi.get<{ data: Enrollment[] }>("/api/admin/edu/enrollments", { params: { limit: 50 } }),
  });

  // Mutations
  const deleteCourse = useMutation({
    mutationFn: async (id: string) => { await adminApi.delete(`/api/admin/edu/courses/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "academy", "courses"] }),
    onError: (err: unknown) => { setToast({ message: err instanceof Error ? err.message : t("academy.errDeleteFailed"), type: "error" }); },
  });

  const deleteInstructor = useMutation({
    mutationFn: async (id: string) => { await adminApi.delete(`/api/admin/edu/instructors/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "academy", "instructors"] }),
    onError: (err: unknown) => { setToast({ message: err instanceof Error ? err.message : t("academy.errDeleteFailed"), type: "error" }); },
  });

  const deleteEnrollment = useMutation({
    mutationFn: async (id: string) => { await adminApi.delete(`/api/admin/edu/enrollments/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "academy", "enrollments"] }),
    onError: (err: unknown) => { setToast({ message: err instanceof Error ? err.message : t("academy.errDeleteFailed"), type: "error" }); },
  });

  const courses = coursesData?.data ?? [];
  const instructors = instructorsData?.data ?? [];
  const enrollments = enrollmentsData?.data ?? [];

  const totalEnrolled = enrollments.length;
  const publishedCourses = courses.filter(c => c.isPublished).length;
  const completedEnrollments = enrollments.filter(e => e.completedAt).length;
  const avgRating = courses.filter(c => c.rating).length > 0
    ? (courses.reduce((s, c) => s + (c.rating ?? 0), 0) / courses.filter(c => c.rating).length).toFixed(1)
    : "—";

  return (
    <>
      <div>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <div>
            <h2 style={{ fontFamily: DS.heading, fontSize: 20, fontWeight: 800, color: DS.text, margin: "0 0 4px" }}>
              {t("academy.title")}
            </h2>
            <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono, margin: 0 }}>
              {t("academy.subtitle")}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => qc.invalidateQueries({ queryKey: ["admin", "academy"] })}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, color: DS.text3, cursor: "pointer", fontSize: 12, fontFamily: DS.mono }}
            >
              <RefreshCw size={13} /> {t("academy.refreshBtn")}
            </button>
            {tab === "courses" && (
              <button
                onClick={() => setEditCourse(null)}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 16px", background: GRD.primary, color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 700 }}
              >
                <Plus size={13} /> {t("academy.addCourseBtn")}
              </button>
            )}
            {tab === "instructors" && (
              <button
                onClick={() => setEditInstructor(null)}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 16px", background: GRD.primary, color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 700 }}
              >
                <Plus size={13} /> {t("academy.addInstructorBtn")}
              </button>
            )}
          </div>
        </div>

        {/* KPI */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
          <StatCard label={t("academy.kpiCourses")} value={courses.length} icon={<BookOpen size={16} />} color={DS.blue} />
          <StatCard label={t("academy.kpiPublished")} value={publishedCourses} icon={<Play size={16} />} color={DS.green} />
          <StatCard label={t("academy.kpiEnrollments")} value={totalEnrolled} icon={<Users size={16} />} color={DS.purple} />
          <StatCard label={t("academy.kpiCompleted")} value={completedEnrollments} icon={<BookText size={16} />} color={DS.cyan} />
          <StatCard label={t("academy.kpiAvgRating")} value={avgRating} icon={<Star size={16} />} color={DS.amber} />
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: "1rem", borderBottom: `1px solid ${DS.border}` }}>
          {(["courses", "instructors", "enrollments"] as const).map(tKey => (
            <button
              key={tKey}
              onClick={() => setTab(tKey)}
              style={{
                padding: "8px 16px",
                background: "none",
                border: "none",
                borderBottom: `2px solid ${tab === tKey ? DS.blue : "transparent"}`,
                color: tab === tKey ? DS.blue : DS.text4,
                fontSize: 13,
                fontFamily: DS.mono,
                cursor: "pointer",
                marginBottom: -1,
                fontWeight: tab === tKey ? 600 : 400,
              }}
            >
              {tKey === "courses" ? t("academy.tabCourses") : tKey === "instructors" ? t("academy.tabInstructors") : t("academy.tabEnrollments")}
            </button>
          ))}
        </div>

        {/* Courses */}
        {tab === "courses" && (
          <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, overflow: "hidden" }}>
            {coursesLoading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
                <div style={{ width: 32, height: 32, border: `2px solid ${DS.border}`, borderTop: `2px solid ${DS.blue}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              </div>
            ) : courses.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem", color: DS.text4 }}>{t("academy.emptyCourses")}</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${DS.border}` }}>
                      {[t("academy.colCourse"), t("academy.colLessons"), t("academy.colStudents"), t("academy.colPrice"), t("academy.colStatus"), t("academy.colFeatured"), t("academy.colActions")].map(h => (
                        <th key={h} style={{ textAlign: "left", padding: "10px 16px", color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map(c => (
                      <tr key={c.id} style={{ borderBottom: `1px solid ${DS.border}` }}>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ color: DS.text, fontSize: 13, fontWeight: 600 }}>{c.title}</div>
                          <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>{c.slug}</div>
                        </td>
                        <td style={{ padding: "12px 16px", color: DS.text3, fontSize: 12 }}>{c.lessonCount}</td>
                        <td style={{ padding: "12px 16px", color: DS.text3, fontSize: 12 }}>{c.enrolledCount}</td>
                        <td style={{ padding: "12px 16px", color: DS.green, fontSize: 12, fontFamily: DS.mono, fontWeight: 700 }}>
                          {c.price ? fmtVND(c.price) : t("common.noData")}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ background: c.isPublished ? "rgba(34,197,94,0.1)" : "rgba(245,158,11,0.1)", color: c.isPublished ? DS.green : DS.amber, padding: "2px 10px", borderRadius: 9999, fontSize: 11, fontFamily: DS.mono, fontWeight: 600 }}>
                            {c.isPublished ? t("academy.kpiPublished") : t("academy.statusDraft")}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          {c.isFeatured && <Star size={14} style={{ color: DS.amber }} />}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", gap: 5 }}>
                            <button
                              onClick={() => setEditCourse(c)}
                              style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 8, padding: "5px 8px", cursor: "pointer", color: DS.blue, display: "flex", alignItems: "center" }}
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => { if (confirm(t("academy.confirmDeleteCourse"))) deleteCourse.mutate(c.id); }}
                              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "5px 8px", cursor: "pointer", color: DS.red, display: "flex", alignItems: "center" }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Instructors */}
        {tab === "instructors" && (
          <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, overflow: "hidden" }}>
            {instructorsLoading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
                <div style={{ width: 32, height: 32, border: `2px solid ${DS.border}`, borderTop: `2px solid ${DS.blue}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              </div>
            ) : instructors.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem", color: DS.text4 }}>{t("academy.emptyInstructors")}</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem", padding: "1rem" }}>
                {instructors.map((inst: Instructor) => (
                  <motion.div
                    key={inst.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 10, padding: "1rem" }}
                  >
                    <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
                      <div style={{ width: 44, height: 44, borderRadius: "50%", background: `${DS.purple}20`, border: `1px solid ${DS.purple}40`, display: "grid", placeItems: "center", color: DS.purple, fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
                        {inst.avatar ? <img src={inst.avatar} alt={inst.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} /> : inst.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ color: DS.text, fontWeight: 600, fontSize: 13 }}>{inst.name}</div>
                        <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>{inst.courseCount} {t("academy.colCoursesCount")} · {inst.studentCount} {t("academy.colStudentsCount")}</div>
                      </div>
                    </div>
                    <div style={{ color: DS.text3, fontSize: 12, lineHeight: 1.4 }}>{inst.bio || "—"}</div>
                    <div style={{ display: "flex", gap: 5, marginTop: 8 }}>
                      <button
                        onClick={() => setEditInstructor(inst)}
                        style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 8, padding: "5px 8px", cursor: "pointer", color: DS.blue, display: "flex", alignItems: "center" }}
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => { if (confirm(t("academy.confirmDeleteInstructor"))) deleteInstructor.mutate(inst.id); }}
                        style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "5px 8px", cursor: "pointer", color: DS.red, display: "flex", alignItems: "center" }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Enrollments */}
        {tab === "enrollments" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Create enrollment form */}
            <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: "1rem" }}>
              <p style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.08em", marginBottom: 12, textTransform: "uppercase" }}>{t("academy.formEnrollmentSection")}</p>
              <EnrollmentCreateForm
                courses={courses}
                onSuccess={() => qc.invalidateQueries({ queryKey: ["admin", "academy", "enrollments"] })}
              />
            </div>

            {/* Enrollment list */}
            <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, overflow: "hidden" }}>
              {enrollmentsLoading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
                  <div style={{ width: 32, height: 32, border: `2px solid ${DS.border}`, borderTop: `2px solid ${DS.blue}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                </div>
              ) : enrollments.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem", color: DS.text4 }}>{t("academy.emptyEnrollments")}</div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${DS.border}` }}>
                        {[t("academy.colStudent"), t("academy.colCourse"), t("academy.colEnrolledDate"), t("academy.colCompletion"), t("academy.colEnrollmentStatus"), t("academy.colActions")].map(h => (
                          <th key={h} style={{ textAlign: "left", padding: "10px 16px", color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {enrollments.map(e => (
                        <tr key={e.id} style={{ borderBottom: `1px solid ${DS.border}` }}>
                          <td style={{ padding: "12px 16px", color: DS.text, fontSize: 13, fontWeight: 500 }}>{e.memberName ?? e.studentEmail ?? e.memberId}</td>
                          <td style={{ padding: "12px 16px", color: DS.text3, fontSize: 12 }}>{e.courseTitle ?? "—"}</td>
                          <td style={{ padding: "12px 16px", color: DS.text4, fontSize: 12, fontFamily: DS.mono }}>{fmtDate(e.enrolledAt)}</td>
                          <td style={{ padding: "12px 16px", color: DS.text4, fontSize: 12, fontFamily: DS.mono }}>{fmtDate(e.completedAt)}</td>
                          <td style={{ padding: "12px 16px" }}>
                            <span style={{ background: e.completedAt ? "rgba(34,197,94,0.1)" : "rgba(245,158,11,0.1)", color: e.completedAt ? DS.green : DS.amber, padding: "2px 10px", borderRadius: 9999, fontSize: 11, fontFamily: DS.mono, fontWeight: 600 }}>
                              {e.completedAt ? t("academy.statusCompleted") : t("academy.statusEnrolled")}
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <button
                              onClick={() => { if (confirm(t("academy.confirmDeleteEnrollment"))) deleteEnrollment.mutate(e.id); }}
                              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "5px 8px", cursor: "pointer", color: DS.red, display: "flex", alignItems: "center" }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modals */}
        <AnimatePresence>
          {editCourse !== null && (
            <CourseEditModal
              course={editCourse}
              instructors={instructors}
              onClose={() => setEditCourse(null)}
              onSuccess={() => qc.invalidateQueries({ queryKey: ["admin", "academy", "courses"] })}
            />
          )}
          {editInstructor !== null && (
            <InstructorEditModal
              instructor={editInstructor}
              onClose={() => setEditInstructor(null)}
              onSuccess={() => qc.invalidateQueries({ queryKey: ["admin", "academy", "instructors"] })}
            />
          )}
        </AnimatePresence>
      </div>
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderRadius: 12, background: "#0F172A", border: `1px solid ${toast.type === "success" ? "#22C55E" : "#CC3344"}50`, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", maxWidth: 320 }}>
          <span style={{ color: toast.type === "success" ? "#22C55E" : "#CC3344", fontSize: 16 }}>{toast.type === "success" ? "✓" : "✗"}</span>
          <span style={{ color: "#fff", fontSize: 13 }}>{toast.message}</span>
          <button onClick={() => setToast(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "#94A3B8" }}><X size={14} /></button>
        </div>
      )}
    </>
  );
}
