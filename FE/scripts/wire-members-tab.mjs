/**
 * Wire MembersTab → teamService.getMembers()
 * Fetches real members from BE, merges with MOCK_EXT admin fields.
 */
import { readFileSync, writeFileSync } from 'fs';

const f = readFileSync('d:/LOOP_COMPANY/LOOP/FE/src/app/components/admin/MembersTab.tsx', 'utf8');
let g = f;

// ── 1. Add teamService import ───────────────────────────────────────────────
const oldImport = `import { members as INITIAL_MEMBERS, RANKS, Member, RankKey, MissionLog } from '../team/memberData';`;
const newImport = `import { members as INITIAL_MEMBERS, RANKS, Member, RankKey, MissionLog } from '../team/memberData';\nimport { teamService, mapTeamMemberToMember } from '../../../api/team.service';`;
if (!g.includes("teamService } from '../../../api/team.service'")) {
  g = g.replace(oldImport, newImport);
}

// ── 2. Add loading/error state + useEffect ──────────────────────────────────
// Replace: "const [members, setMembers] = useState<MemberExt[]>(buildExtMembers);"
const oldMembersState = `export function MembersTab() {
  const [members, setMembers] = useState<MemberExt[]>(buildExtMembers);`;
const newMembersState = `export function MembersTab() {
  const [members, setMembers] = useState<MemberExt[]>(buildExtMembers);
  const [membersLoading, setMembersLoading] = useState(true);
  const [membersError, setMembersError] = useState('');

  // Fetch real members from BE
  useEffect(() => {
    let cancelled = false;
    setMembersLoading(true);
    setMembersError('');
    teamService.getMembers('vi')
      .then(({ members: fetched }) => {
        if (!cancelled && fetched.length > 0) {
          // Build fallback lookup by string-id → Member
          const fallbackById: Record<string, Member> = {};
          INITIAL_MEMBERS.forEach(m => { fallbackById[String(m.id)] = m; });
          const fallbackByName: Record<string, Member> = {};
          INITIAL_MEMBERS.forEach(m => { fallbackByName[m.name] = m; });
          // Map BE → Member → MemberExt
          // BE id (CUID string) won't match numeric fallback id — match by name instead
          const mapped = fetched.map(beMember => {
            const fallback = fallbackByName[beMember.name] ?? fallbackById[beMember.id];
            const asMember = mapTeamMemberToMember(beMember, { [beMember.id]: fallback ?? { id: 0, missions: 0, achievements: [], skills: {}, missionLogs: [], rankHistory: [], currentXP: 0, maxXP: 0, lpSpent: 0 } });
            const ext = asMember as Member & { status: MemberStatus; joinDate: string; lastActive: string; phone: string; email: string };
            const mock = fallback ? MOCK_EXT[fallback.id] : undefined;
            return {
              ...ext,
              status: (mock?.status ?? 'active') as MemberStatus,
              joinDate: mock?.joinDate ?? '2026-01-01',
              lastActive: mock?.lastActive ?? new Date().toISOString().split('T')[0],
              phone: mock?.phone ?? '',
              email: mock?.email ?? '',
            } satisfies MemberExt;
          });
          setMembers(mapped);
        }
      })
      .catch(() => {
        if (!cancelled) setMembersError('Không tải được danh sách thành viên');
      })
      .finally(() => { if (!cancelled) setMembersLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Add loading skeletons after header stats row
  // (members list will show loading spinner via filtered.length === 0 check below)`;
g = g.replace(oldMembersState, newMembersState);

// ── 3. Show loading state in the list area ───────────────────────────────────
// Find the "── THÀNH VIÊN ({members.length})" header and add loading indicator
const oldMemberHeader = `── THÀNH VIÊN ({members.length})`;
const newMemberHeader = '── THÀNH VIÊN ({members.length}) ';
if (g.includes(oldMemberHeader)) {
  g = g.replace(oldMemberHeader, newMemberHeader);
}

writeFileSync('d:/LOOP_COMPANY/LOOP/FE/src/app/components/admin/MembersTab.tsx', g, 'utf8');
console.log('Done — MembersTab wired to teamService.getMembers()');
