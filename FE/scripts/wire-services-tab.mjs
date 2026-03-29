/**
 * Wire ServicesTab → servicesService.getAdminServices()
 */
import { readFileSync, writeFileSync } from 'fs';

const f = readFileSync('d:/LOOP_COMPANY/LOOP/FE/src/app/components/admin/ServicesTab.tsx', 'utf8');
let g = f;

// ── 1. Add useEffect import + servicesService ────────────────────────────────────
const oldReact = "import { useState } from 'react';";
const newReact = "import { useState, useEffect } from 'react';";
if (!g.includes('useEffect } from')) g = g.replace(oldReact, newReact);

const oldServicesImport = "import { useLoopStore, type Service, type ServiceType } from '../../store/loopStore';";
const newServicesImport = "import { useLoopStore, type Service, type ServiceType } from '../../store/loopStore';\nimport { servicesService } from '../../../api/services.service';";
if (!g.includes('servicesService } from')) {
  g = g.replace(oldServicesImport, newServicesImport);
}

// ── 2. Add state + useEffect in ServicesTab ──────────────────────────────────────
const oldTabStart = `export function ServicesTab() {
  const { services, orders, updateService } = useLoopStore();
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [previewDemoId, setPreviewDemoId] = useState<ServiceType | null>(null);`;

const newTabStart = `export function ServicesTab() {
  const { services, orders, updateService } = useLoopStore();
  const [apiServices, setApiServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState('');
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [previewDemoId, setPreviewDemoId] = useState<ServiceType | null>(null);

  useEffect(() => {
    let cancelled = false;
    setServicesLoading(true);
    setServicesError('');
    servicesService.getAdminServices()
      .then(fetched => { if (!cancelled) setApiServices(fetched); })
      .catch(() => { if (!cancelled) setServicesError('Không tải được danh sách dịch vụ'); })
      .finally(() => { if (!cancelled) setServicesLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Use API services when loaded, fall back to store
  const displayServices = servicesLoading && servicesError === '' ? services : apiServices.length > 0 ? apiServices : services;`;

g = g.replace(oldTabStart, newTabStart);

// ── 3. Update stats and map to use displayServices ──────────────────────────────
// "({services.length} dịch vụ)"
g = g.replace('── QUẢN LÝ DỊCH VỤ ({services.length} dịch vụ)', '── QUẢN LÝ DỊCH VỤ ({displayServices.length} dịch vụ)');

// "{services.map((svc, i) => {"
g = g.replace(
  '{services.map((svc, i) => {',
  '{displayServices.map((svc, i) => {'
);

writeFileSync('d:/LOOP_COMPANY/LOOP/FE/src/app/components/admin/ServicesTab.tsx', g, 'utf8');
console.log('Done — ServicesTab wired to servicesService.getAdminServices()');
