/**
 * Wire MemberDetailPage → teamService.getMemberBySlug()
 * Adds useEffect to fetch member from BE, falls back to hardcoded members[].
 */
import { readFileSync, writeFileSync } from 'fs';

const f = readFileSync('d:/LOOP_COMPANY/LOOP/FE/src/app/MemberDetailPage.tsx', 'utf8');
let g = f;

// ── 1. Add teamService import ─────────────────────────────────────────────────
const oldLine = "import { members, RANKS, RankKey } from './components/team/memberData';";
const newLine = "import { members as fallbackMembers, RANKS, RankKey, type Member as FallbackMember } from './components/team/memberData';\nimport { teamService, mapTeamMemberToMember } from './api/team.service';";
if (!g.includes("teamService } from './api/team.service'")) {
  g = g.replace(oldLine, newLine);
}

// ── 2. Update component state + useEffect ─────────────────────────────────────
// Find: "export default function MemberDetailPage() {"
//         "  const { id } = useParams();"
//         "  const navigate = useNavigate();"
//         "  const member = members.find((m) => m.id === Number(id));"
//         "  const [hovered, setHovered] = useState(false);"
const oldComponentStart = `export default function MemberDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const member = members.find((m) => m.id === Number(id));
  const [hovered, setHovered] = useState(false);

  useEffect(() => { window.scrollTo(0, 0); }, []);`;

const newComponentStart = `export default function MemberDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // API-loaded member — falls back to hardcoded data when offline
  const [apiMember, setApiMember] = useState<FallbackMember | null>(null);
  const [memberLoading, setMemberLoading] = useState(true);

  useEffect(() => {
    if (!id) { setMemberLoading(false); return; }
    let cancelled = false;
    setMemberLoading(true);
    teamService.getMemberBySlug(id, 'vi')
      .then(beMember => {
        if (!cancelled && beMember) {
          const fb = fallbackMembers.find(m => m.id === Number(id));
          const mapped = mapTeamMemberToMember(beMember, { [id]: fb ?? { id: 0 } });
          setApiMember(mapped);
        }
      })
      .catch(() => { /* fall back to hardcoded */ })
      .finally(() => { if (!cancelled) setMemberLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  const member = apiMember ?? fallbackMembers.find((m) => m.id === Number(id));
  const [hovered, setHovered] = useState(false);

  useEffect(() => { window.scrollTo(0, 0); }, []);`;

g = g.replace(oldComponentStart, newComponentStart);

// ── 3. Update loading state ──────────────────────────────────────────────────
// Before the "if (!member)" check, add loading skeleton
const oldNotFoundCheck = `  if (!member) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center text-white font-serif">
        <div className="text-center">
          <h1 className="text-4xl mb-4">Member Not Found</h1>
          <button onClick={() => navigate('/')} className="text-blue-400 hover:underline">Return to Guild Hall</button>
        </div>
      </div>
    );
  }`;

const newNotFoundCheck = `  if (memberLoading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="text-center">
          <div style={{ color: '#3B82F6', fontSize: 48, marginBottom: 16 }}>◈</div>
          <div style={{ color: '#94A3B8', fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>Loading member data...</div>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center text-white font-serif">
        <div className="text-center">
          <h1 className="text-4xl mb-4">Member Not Found</h1>
          <button onClick={() => navigate('/doi-ngu')} className="text-blue-400 hover:underline">Return to Guild Hall</button>
        </div>
      </div>
    );
  }`;

g = g.replace(oldNotFoundCheck, newNotFoundCheck);

writeFileSync('d:/LOOP_COMPANY/LOOP/FE/src/app/MemberDetailPage.tsx', g, 'utf8');
console.log('Done — MemberDetailPage wired to teamService.getMemberBySlug()');
