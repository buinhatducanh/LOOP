#!/usr/bin/env node
import fs from 'fs';

const f='src/components/landing/BookingWizardClient.tsx';
let c=fs.readFileSync(f,'utf8');

// A. DomainSearchResult type
c=c.replace(/(interface WizardDomainPrice \{[^}]+\})/s,'$1\ninterface DomainSearchResult {\n domain: string;\n available: boolean;\n reason?: string;\n price: number;\n}\n');

// B. Icons
c=c.replace('Users, Calendar, Layers, Sparkles, Shield, Plus, Minus, X, ExternalLink, Zap, Eye, Server,','Users, Calendar, Layers, Sparkles, Shield, Plus, Minus, X, ExternalLink, Zap, Eye, Server, Search, AlertCircle,');

// C. State vars
c=c.replace(/(const \[domainPurchaseNow, setDomainPurchaseNow\] = useState<boolean>\(false\);)/,'$1\n const [domainSearchResults, setDomainSearchResults] = useState<DomainSearchResult[]>([]);\n const [domainSearching, setDomainSearching] = useState(false);\n const [domainHasSearched, setDomainHasSearched] = useState(false);\n const [domainError, setDomainError] = useState("");\n const [selectedDomains, setSelectedDomains] = useState<{domain: string; price: number}[]>([]);\n const toggleDomain = (domain: string, price: number) => {\n setSelectedDomains(prev => {\n const exists = prev.find(d => d.domain === domain);\n if (exists) return prev.filter(d => d.domain !== domain);\n return [...prev, { domain, price }];\n });\n };\n const selectedDomainTotal = selectedDomains.reduce((s, d) => s + (d.price ?? 0), 0);\n');

// D. domainCost
c=c.replace(/const domainCost = domainPurchaseNow[\s\S]*?const currentSubtotal/,' const domainCost = selectedDomains.reduce((s, d) => s + (d.price ?? 0), 0);\nconst currentSubtotal');

// E. domainTotalCost
c=c.replace(/const domainTotalCost = domainPurchaseNow[\s\S]*?const hostingTotalCost/,' const domainTotalCost = selectedDomains.reduce((s, d) => s + (d.price ?? 0), 0);\nconst hostingTotalCost');

// F. domainTotal
c=c.replace(/const domainTotal = domainPurchaseNow[\s\S]*?const subtotalForDisplay/,' const domainTotal = selectedDomains.reduce((s, d) => s + (d.price ?? 0), 0);\nconst subtotalForDisplay');

// G. Submit
c=c.replace('domainName: domainName || undefined,','domainName: selectedDomains.map(d => d.domain).join(", ") || undefined,');

// H. Sidebar
c=c.replace('+Domain: {fmtVND(domainTotal)}','+Domain: {selectedDomains.length > 0 ? `${selectedDomains.length} domain · ${fmtVND(selectedDomainTotal)}` : "+0"}');

// I. Purchase timing
c=c.replace(
'{domainName && domainName.includes(".") && domainPrices.find(d => domainName.endsWith(d.extension)) && (',
'{domainName && domainName.includes(".") && ('
);

fs.writeFileSync(f,c);
console.log('Step1 done. Lines:', c.split('\n').length);
