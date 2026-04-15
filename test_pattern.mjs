import fs from 'fs';
const c = fs.readFileSync('src/components/landing/BookingWizardClient.tsx', 'utf8');
// Test patterns
console.log('Icons ZNS pattern:', c.includes('Zap, Eye, Server,'));
console.log('Icons closing:', c.includes('} from "lucide-react"'));
console.log('DT pattern:', c.includes('domainPurchaseNow && domainName'));
const zi = c.indexOf('Zap');
console.log('Zap at:', zi);
console.log('After Zap:', JSON.stringify(c.substring(zi, zi+50)));
