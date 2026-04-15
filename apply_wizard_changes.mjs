import fs from 'fs';
const f = 'src/components/landing/BookingWizardClient.tsx';
let c = fs.readFileSync(f, 'utf8');
let lines = c.split('\n');

// ── 1. Add DomainSearchResult type + domain states + payment states ──
// Update icons import
const iconsIdx = lines.findIndex(l => l.includes('Globe, Code2'));
if (iconsIdx >= 0) {
 lines[iconsIdx] = lines[iconsIdx].replace('Globe, Code2, BarChart3, Target, Check, ArrowRight, ArrowLeft,', 'Globe, Code2, BarChart3, Target, Check, ArrowRight, ArrowLeft, Search, AlertCircle,');
 console.log('Updated icons import at line', iconsIdx+1);
}

// Find the type declarations area
const typesEnd = lines.findIndex(l => l.includes('interface WizardDomainPrice'));
let typeInsertLine = typesEnd - 1;
while (typeInsertLine > 0 && !lines[typeInsertLine].includes('interface')) typeInsertLine--;
typeInsertLine++;
while (typeInsertLine < lines.length && lines[typeInsertLine].trim() === '') typeInsertLine++;

const domainTypeSnippet = `interface DomainSearchResult {
 domain: string;
 extension: string;
 available: boolean;
 price?: number;
}
interface SelectedDomain {
 domain: string;
 price: number;
}`;

lines.splice(typeInsertLine, 0, domainTypeSnippet);
console.log('Added types at line', typeInsertLine+1);

// ── 2. Add domain + payment states (after selectedPackage declaration) ──
const stateInsertIdx = lines.findIndex(l => l.includes('const [selectedPackage, setSelectedPackage]'));
if (stateInsertIdx < 0) { console.log('ERROR: selectedPackage not found'); process.exit(1); }

const newStates = [
 ` // Domain search state`,
 ` const [selectedDomains, setSelectedDomains] = useState<SelectedDomain[]>([]);`,
 ` const [domainSearchResults, setDomainSearchResults] = useState<DomainSearchResult[]>([]);`,
 ` const [domainSearching, setDomainSearching] = useState(false);`,
 ` const [domainHasSearched, setDomainHasSearched] = useState(false);`,
 ` const [domainError, setDomainError] = useState("");`,
 ` const [selectedTld, setSelectedTld] = useState(".com");`,
 ``,
 ` // Payment QR state`,
 ` const [paymentQrUrls, setPaymentQrUrls] = useState<{bank?: string; momo?: string}>({});`,
 ` const [selectedPayment, setSelectedPayment] = useState<string>("");`,
 ``,
 ` // Computed domain total`,
 ` const selectedDomainTotal = selectedDomains.reduce((s, d) => s + d.price, 0);`,
 ``,
 ` // Toggle domain selection`,
 ` function toggleDomain(domain: string, price: number) {`,
 ` setSelectedDomains(prev => {`,
 ` const exists = prev.find(d => d.domain === domain);`,
 ` if (exists) return prev.filter(d => d.domain !== domain);`,
 ` return [...prev, { domain, price }];`,
 ` });`,
 ` }`,
 ``,
 ` // Search domain function`,
 ` async function searchDomain() {`,
 ` if (domainName.trim().length < 2 || !domainName.includes(".")) return;`,
 ` setDomainSearching(true);`,
 ` setDomainError("");`,
 ` try {`,
 ` const tld = selectedTld.replace(/^\./, "");`,
 ` const res = await fetch(\`/api/pricing/domain-search?keyword=\${encodeURIComponent(domainName)}&tld=\${tld}\`);`,
 ` const json = await res.json();`,
 ` const results = json.data ?? [];`,
 ` setDomainSearchResults(results);`,
 ` setDomainHasSearched(true);`,
 ` const autoSelected = results`,
 ` .filter(r => r.available && (r.price ?? 0) > 0)`,
 ` .map(r => ({ domain: r.domain, price: r.price ?? 0 }));`,
 ` setSelectedDomains(autoSelected);`,
 ` } catch {`,
 ` setDomainError("Không thể kiểm tra domain. Vui lòng thử lại.");`,
 ` } finally {`,
 ` setDomainSearching(false);`,
 ` }`,
 ` }`,
 ``,
 ` // Load payment QR URLs`,
 ` useEffect(() => {`,
 ` fetch("/api/v1/payment-methods")`,
 ` .then(r => r.json())`,
 ` .then(json => {`,
 ` const d = json.data ?? {};`,
 ` setPaymentQrUrls({ bank: d.bank?.qrUrl ?? null, momo: d.momo?.qrUrl ?? null });`,
 ` })`,
 ` .catch(() => {});`,
 ` }, []);`,
];

lines.splice(stateInsertIdx, 0, ...newStates);
console.log('Added states at line', stateInsertIdx+1);

// ── 3. Update price calculations ──
const priceCalcIdx = lines.findIndex(l => l.includes('const domainTotal = domainPurchaseNow'));
if (priceCalcIdx >= 0) {
 lines[priceCalcIdx] = ` const domainTotal = domainPurchaseNow ? selectedDomainTotal : 0;`;
 console.log('Updated price calc at line', priceCalcIdx+1);
}

// ── 4. Update notes field in submit payload ──
const notesIdx = lines.findIndex(l => l.includes('notes: `Dịch vụ: ${svc?'));
if (notesIdx >= 0) {
 lines[notesIdx] = ` notes: \`Dịch vụ: \${svc?.title ?? ""} | Tính năng: \${selectedFeatures.length} | Ghi chú đội ngũ: \${talentNote || "—"}\`,`;
 console.log('Updated notes at line', notesIdx+1);
}

// ── 5. Update domainName in submit payload ──
const domainSubmitIdx = lines.findIndex((l, i) => l.includes('domainName: domainName') && i > 500);
if (domainSubmitIdx >= 0) {
 lines[domainSubmitIdx] = ` selectedDomains: selectedDomains.length > 0 ? selectedDomains : (domainName ? [{ domain: domainName, price: selectedDomainTotal }] : []),`;
 console.log('Updated domain submit at line', domainSubmitIdx+1);
}

fs.writeFileSync(f, lines.join('\n'));
console.log('Phase 1 done. New lines:', lines.length);
