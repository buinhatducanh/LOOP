#!/usr/bin/env node
import fs from 'fs';

const f='src/components/landing/BookingWizardClient.tsx';
let c=fs.readFileSync(f,'utf8');

const sf=`\n const searchDomain = async () => {
 if (domainName.trim().length < 2) return;
 setDomainSearching(true);
 setDomainError("");
 setDomainHasSearched(true);
 try {
 const keyword = domainName.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
 const tld = domainName.includes(".")
 ? domainName.split(".").pop() ?? "vn"
 : "vn";
 const params = new URLSearchParams({ q: keyword, tld });
 const res = await fetch(\`/api/pricing/domain-search?\${params}\`);
 if (res.ok) {
 const json = await res.json();
 setDomainSearchResults(json.data?.domains ?? []);
 } else {
 setDomainError("Tìm kiếm thất bại");
 }
 } catch {
 setDomainError("Lỗi mạng");
 }
 setDomainSearching(false);
 };
`;

const teRe = /(const toggleExtra = \(id: string\) => \{[\s\S]*?^\s\};)/m;
if (teRe.test(c)) {
 c = c.replace(teRe, '$1' + sf);
 console.log('K. searchDomain added');
} else {
 console.log('K. FAIL - toggleExtra not found');
}

fs.writeFileSync(f,c);
console.log('Step3 done. Lines:', c.split('\n').length);

// Verify
const checks=['interface DomainSearchResult','Search, AlertCircle','const [selectedDomains, setSelectedDomains]','const toggleDomain','const selectedDomainTotal','const domainCost = selectedDomains.reduce','const domainTotalCost = selectedDomains.reduce','const domainTotal = selectedDomains.reduce',"selectedDomains.map(d => d.domain)",'DOMAIN CHÍNH','GỢI Ý KHÁC','const searchDomain = async','Kiểm tra','domainSearchResults','domainSearching','domainHasSearched','domainError','domainName && domainName.includes'];
let ok=true;
for(const ch of checks){
 if(!c.includes(ch)){ok=false;console.log('MISSING:',ch);}
}
if(ok)console.log('ALL CHECKS PASSED');
