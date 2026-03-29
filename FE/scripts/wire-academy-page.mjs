/**
 * Wire AcademyPage → academyService.getCourses()
 */
import { readFileSync, writeFileSync } from 'fs';

const f = readFileSync('d:/LOOP_COMPANY/LOOP/FE/src/app/pages/AcademyPage.tsx', 'utf8');
let g = f;

// ── 1. Add academyService import ──────────────────────────────────────────────
const oldAcademyImport = "import { DS, GRD } from '../components/layout/ds';";
const newAcademyImport = `import { DS, GRD } from '../components/layout/ds';
import { academyService } from '../../api/academy.service';`;
if (!g.includes('academyService }')) {
  g = g.replace(oldAcademyImport, newAcademyImport);
}

// ── 2. Find AcademyPage component and add API state ────────────────────────────
// Find the component start — AcademyPage starts with a course card function or the page itself
const oldPageStart = `function AcademyPage() {
  const [courses, setCourses] = useState(COURSES);`;

const newPageStart = `function AcademyPage() {
  const [apiCourses, setApiCourses] = useState<typeof COURSES>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState('');
  const [courses, setCourses] = useState(COURSES);

  useEffect(() => {
    let cancelled = false;
    setCoursesLoading(true);
    setCoursesError('');
    academyService.getCourses('vi', 1, 20)
      .then(({ courses: fetched }) => {
        if (!cancelled && fetched.length > 0) setApiCourses(fetched as unknown as typeof COURSES);
      })
      .catch(() => { if (!cancelled) setCoursesError('Không tải được danh sách khóa học'); })
      .finally(() => { if (!cancelled) setCoursesLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const displayCourses = coursesLoading && coursesError === '' ? courses : apiCourses.length > 0 ? apiCourses : courses;`;

g = g.replace(oldPageStart, newPageStart);

// ── 3. Replace COURSES references in component with displayCourses ─────────────
// The main grid uses "filtered" which filters from "courses"
// We need to make filtered use displayCourses
g = g.replace(
  'const filtered = courses.filter(c =>',
  'const filtered = displayCourses.filter(c =>'
);

writeFileSync('d:/LOOP_COMPANY/LOOP/FE/src/app/pages/AcademyPage.tsx', g, 'utf8');
console.log('Done — AcademyPage wired to academyService.getCourses()');
