// apply_wizard_changes_v2.mjs — Apply ALL BookingWizardClient.tsx changes
import fs from 'fs';

const f = 'src/components/landing/BookingWizardClient.tsx';
let c = fs.readFileSync(f, 'utf8');
let lines = c.split('\n');
console.log(`File: ${lines.length} lines`);

// ── 1. Add icons ──────────────────────────────────────────────────────────
const iconsIdx = lines.findIndex(l => l.includes('Globe, Code2, BarChart3'));
if (iconsIdx >= 0) {
 lines[iconsIdx] = lines[iconsIdx].replace(
 'Globe, Code2, BarChart3, Target, Check, ArrowRight, ArrowLeft,',
 'Globe, Code2, BarChart3, Target, Check, ArrowRight, ArrowLeft, Search, AlertCircle,'
 );
 console.log('1. Icons updated at line', iconsIdx + 1);
}

// ── 2. Add TypeScript interfaces ─────────────────────────────────────────
const typesIdx = lines.findIndex(l => l.includes('interface WizardDomainPrice'));
if (typesIdx >= 0) {
 const domainTypes = [
 'interface DomainSearchResult {',
 ' domain: string;',
 ' extension: string;',
 ' available: boolean;',
 ' price?: number;',
 '}',
 'interface SelectedDomain {',
 ' domain: string;',
 ' price: number;',
 '}',
 ];
 lines.splice(typesIdx, 0, ...domainTypes);
 console.log('2. Types added at line', typesIdx + 1);
}

// ── 3. Add domain + payment states ────────────────────────────────────────
const stateIdx = lines.findIndex(l => l.includes('const [selectedPackage, setSelectedPackage]'));
if (stateIdx < 0) { console.error('ERROR: selectedPackage not found'); process.exit(1); }

const newStates = [
 ' // Domain search state',
 ' const [selectedDomains, setSelectedDomains] = useState<SelectedDomain[]>([]);',
 ' const [domainSearchResults, setDomainSearchResults] = useState<DomainSearchResult[]>([]);',
 ' const [domainSearching, setDomainSearching] = useState(false);',
  ' const [domainHasSearched, setDomainHasSearched] = useState(false);',
 ' const [domainError, setDomainError] = useState("");',
 ' const [selectedTld, setSelectedTld] = useState(".com");',
 '',
  ' // Payment QR state',
 ' const [paymentQrUrls, setPaymentQrUrls] = useState<{bank?: string; momo?: string}>({});',
 ' const [selectedPayment, setSelectedPayment] = useState<string>("");',
 '',
 ' // Computed domain total',
 ' const selectedDomainTotal = selectedDomains.reduce((s, d) => s + d.price, 0);',
 '',
 ' // Toggle domain selection',
 ' function toggleDomain(domain: string, price: number) {',
 ' setSelectedDomains(prev => {',
 ' const exists = prev.find(d => d.domain === domain);',
 ' if (exists) return prev.filter(d => d.domain !== domain);',
 ' return [...prev, { domain, price }];',
 ' });',
 ' }',
 '',
 ' // Search domain function',
 ' async function searchDomain() {',
 ' if (domainName.trim().length < 2 || !domainName.includes(".")) return;',
 ' setDomainSearching(true);',
 ' setDomainError("");',
 ' try {',
 ` const tld = selectedTld.replace(/^\\./, "");`,
 ' const res = await fetch(`/api/pricing/domain-search?keyword=${encodeURIComponent(domainName)}&tld=${tld}`);',
 ' const json = await res.json();',
 ' const results = json.data ?? [];',
 ' setDomainSearchResults(results);',
 ' setDomainHasSearched(true);',
 ' const autoSelected = results',
 ' .filter(r => r.available && (r.price ?? 0) > 0)',
 ' .map(r => ({ domain: r.domain, price: r.price ?? 0 }));',
 ' setSelectedDomains(autoSelected);',
 ' } catch {',
 ' setDomainError("Khong the kiem tra domain. Vui long thu lai.");',
 ' } finally {',
 ' setDomainSearching(false);',
 ' }',
 ' }',
 '',
 ' // Load payment QR URLs',
 ' useEffect(() => {',
 ' fetch("/api/v1/payment-methods")',
 ' .then(r => r.json())',
 ' .then(json => {',
 ' const d = json.data ?? {};',
 ' setPaymentQrUrls({ bank: d.bank?.qrUrl ?? null, momo: d.momo?.qrUrl ?? null });',
 ' })',
 ' .catch(() => {});',
 ' }, []);',
];

lines.splice(stateIdx, 0, ...newStates);
console.log('3. States added at line', stateIdx + 1);

// ── 4. Update domainTotal price calc ─────────────────────────────────────
const priceIdx = lines.findIndex(l => l.includes('const domainTotal = domainPurchaseNow'));
if (priceIdx >= 0) {
 lines[priceIdx] = ' const domainTotal = domainPurchaseNow ? selectedDomainTotal : 0;';
 console.log('4. Price calc at line', priceIdx + 1);
}

// ── 5. Update notes field ────────────────────────────────────────────────
const notesIdx = lines.findIndex(l => l.includes('notes: `Dịch vụ: ${svc?'));
if (notesIdx >= 0) {
 lines[notesIdx] = ` notes: \`Dịch vụ: \${svc?.title ?? ""} | Tính năng: \${selectedFeatures.length} | Ghi chú đội ngũ: \${talentNote || "—"}\`,`;
 console.log('5. Notes at line', notesIdx + 1);
}

// ── 6. Update domainName in submit payload ───────────────────────────────
const domainSubmitIdx = lines.findIndex((l, i) => l.includes('domainName: domainName') && i > 500);
if (domainSubmitIdx >= 0) {
 lines[domainSubmitIdx] = " selectedDomains: selectedDomains.length > 0 ? selectedDomains : (domainName ? [{ domain: domainName, price: selectedDomainTotal }] : []),";
 console.log('6. Domain submit at line', domainSubmitIdx + 1);
}

// Write intermediate for debugging
fs.writeFileSync(f, lines.join('\n'));
console.log(`Phase 1 done. Lines: ${lines.length}`);
