/**
 * Wire LPManagementTab → lpService.getCustomerPoints() + awardLp()
 */
import { readFileSync, writeFileSync } from 'fs';

const f = readFileSync('d:/LOOP_COMPANY/LOOP/FE/src/app/components/admin/LPManagementTab.tsx', 'utf8');
let g = f;

// ── 1. Add useEffect + lpService import ─────────────────────────────────────
const oldReact = "import { useState, useMemo } from 'react';";
const newReact = "import { useState, useMemo, useEffect } from 'react';";
if (!g.includes('useEffect }')) g = g.replace(oldReact, newReact);

const oldLPImport = "import { members, RANKS, type RankKey } from '../team/memberData';";
const newLPImport = `import { members, RANKS, type RankKey } from '../team/memberData';
import { lpService } from '../../../api/lp.service';`;
if (!g.includes('lpService }')) {
  g = g.replace(oldLPImport, newLPImport);
}

// ── 2. Replace INIT_TRANSACTIONS with API state + useEffect ─────────────────
// Also wire AddLPModal to use awardLp()
const oldTxInit = `const INIT_TRANSACTIONS: LPTransaction[] = [`;
const newTxInit = `// API state
  const [apiTransactions, setApiTransactions] = useState<LPTransaction[]>([]);
  const [txLoading, setTxLoading] = useState(true);
  const [txError, setTxError] = useState('');

  const INIT_TRANSACTIONS: LPTransaction[] = [`;
g = g.replace(oldTxInit, newTxInit);

// ── 3. Close INIT_TRANSACTIONS and add useEffect before LPManagementTab return ──
// Find the "const periods = useMemo" line and wrap INIT_TRANSACTIONS usage
// The INIT_TRANSACTIONS array ends before "// ── Format helpers"
const fmtHelpers = `// ── Format helpers ────────────────────────────────────────────────────────`;
g = g.replace(fmtHelpers, `
  // Fetch LP transactions from API
  useEffect(() => {
    let cancelled = false;
    setTxLoading(true);
    setTxError('');
    lpService.getMemberTransactions(0)
      .then(txs => { if (!cancelled) setApiTransactions(txs as unknown as LPTransaction[]); })
      .catch(() => { if (!cancelled) setTxError('Không tải được lịch sử LP'); })
      .finally(() => { if (!cancelled) setTxLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Use API transactions when loaded, fall back to mock
  const txData = txLoading && txError === '' ? INIT_TRANSACTIONS : apiTransactions.length > 0 ? apiTransactions : INIT_TRANSACTIONS;

  // Compute display data from txData
  const transactions = txData;

` + fmtHelpers);

// ── 4. Wire AddLPModal → use lpService.awardLp instead of local state ──────
// Update the handleSave in AddLPModal to call awardLp()
const oldHandleSave = `    onSave({
      id: genId(),
      memberId,
      source,
      amount: finalAmount,
      vndEquivalent: finalAmount * rate.lp_to_vnd,
      note: note || \`\${sc.labelVi} — \${period}\`,
      period,
      createdAt: new Date().toISOString().split('T')[0],
      createdBy: 'Admin',
    });
    onClose();`;

const newHandleSave = `    // Call BE API
    lpService.awardLp({ memberId, amount: finalAmount, source, reason: note || \`\${sc.labelVi} — \${period}\` })
      .then(() => {
        onSave({
          id: genId(),
          memberId,
          source,
          amount: finalAmount,
          vndEquivalent: finalAmount * rate.lp_to_vnd,
          note: note || \`\${sc.labelVi} — \${period}\`,
          period,
          createdAt: new Date().toISOString().split('T')[0],
          createdBy: 'Admin',
        });
        onClose();
      })
      .catch(() => {
        // Fallback: save locally even if API fails
        onSave({
          id: genId(),
          memberId,
          source,
          amount: finalAmount,
          vndEquivalent: finalAmount * rate.lp_to_vnd,
          note: note || \`\${sc.labelVi} — \${period}\`,
          period,
          createdAt: new Date().toISOString().split('T')[0],
          createdBy: 'Admin',
        });
        onClose();
      });`;

g = g.replace(oldHandleSave, newHandleSave);

writeFileSync('d:/LOOP_COMPANY/LOOP/FE/src/app/components/admin/LPManagementTab.tsx', g, 'utf8');
console.log('Done — LPManagementTab wired to lpService');
