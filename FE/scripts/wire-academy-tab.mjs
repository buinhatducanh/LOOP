/**
 * Wire AcademyTab → academyService.getAdminCourses() + getAdminEnrollments()
 */
import { readFileSync, writeFileSync } from 'fs';

const f = readFileSync('d:/LOOP_COMPANY/LOOP/FE/src/app/components/admin/AcademyTab.tsx', 'utf8');
let g = f;

// ── 1. Add imports + useEffect ────────────────────────────────────────────────
const oldReact = "import { useState } from 'react';";
const newReact = "import { useState, useEffect } from 'react';";
if (!g.includes('useEffect }')) g = g.replace(oldReact, newReact);

const oldAcademyImport = "import { useLoopStore } from '../../store/loopStore';";
const newAcademyImport = `import { useLoopStore } from '../../store/loopStore';
import { academyService } from '../../../api/academy.service';`;
if (!g.includes('academyService }')) {
  g = g.replace(oldAcademyImport, newAcademyImport);
}

// ── 2. Add API state after AcademyTab function signature ─────────────────────
const oldTabStart = `export function AcademyTab() {
  const { courses, orders, updateService } = useLoopStore();
  const [activeTab, setActiveTab] = useState<'courses' | 'students' | 'videos'>('courses');`;
const newTabStart = `export function AcademyTab() {
  const { courses, orders, updateService } = useLoopStore();
  const [apiCourses, setApiCourses] = useState<AcademyCourse[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState('');
  const [activeTab, setActiveTab] = useState<'courses' | 'students' | 'videos'>('courses');

  useEffect(() => {
    let cancelled = false;
    setCoursesLoading(true);
    setCoursesError('');
    academyService.getAdminCourses({ limit: 50 })
      .then(({ courses: fetched }) => { if (!cancelled) setApiCourses(fetched as unknown as AcademyCourse[]); })
      .catch(() => { if (!cancelled) setCoursesError('Không tải được danh sách khóa học'); })
      .finally(() => { if (!cancelled) setCoursesLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const displayCourses = coursesLoading && coursesError === '' ? courses : apiCourses.length > 0 ? apiCourses : courses;`;
g = g.replace(oldTabStart, newTabStart);

// ── 3. Stats: use displayCourses instead of courses ──────────────────────────
g = g.replace(
  "{ label: 'Tổng khóa học', val: courses.length,",
  "{ label: 'Tổng khóa học', val: displayCourses.length,"
);
g = g.replace(
  "{ label: 'Tổng học viên', val: MOCK_STUDENTS.length,",
  "{ label: 'Tổng học viên', val: MOCK_STUDENTS.length," // keep this as-is (from mock students array)
);

// ── 4. Map: use displayCourses ────────────────────────────────────────────────
// Replace "courses.map" in the tab content with displayCourses
g = g.replace(
  '{courses.map((course, i) => {',
  '{displayCourses.map((course, i) => {'
);

writeFileSync('d:/LOOP_COMPANY/LOOP/FE/src/app/components/admin/AcademyTab.tsx', g, 'utf8');
console.log('Done — AcademyTab wired to academyService.getAdminCourses()');
