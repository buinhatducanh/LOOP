/**
 * NotificationCenter — Advanced notification management for Admin
 * Filter by category/department/priority/assignee · Search · Bulk actions · Pagination
 * Handles 1000+ notifications with virtual-scroll-like pagination
 */
import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, Filter, X, Check, Bell, Trash2, Archive, Eye, EyeOff,
  ChevronDown, ChevronLeft, ChevronRight, AlertTriangle, Clock,
  Zap, DollarSign, Users, Camera, MessageSquare, BarChart3,
  CheckCircle2, Plus, ShoppingCart, Star, Building2, Settings,
  ArrowUpRight, Volume2, VolumeX,
} from 'lucide-react';
import { DS, GRD } from '../layout/ds';
import { useLoopStore, type AdminNotification } from '../../store/loopStore';

const rgba = (hex: string, a: number) => {
  const h = hex.replace('#', '');
  return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`;
};

// ── Filter configs ───────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'all', label: 'Tất cả', icon: <Bell size={13} />, color: DS.text3 },
  { id: 'order', label: 'Đơn hàng', icon: <ShoppingCart size={13} />, color: DS.blue },
  { id: 'finance', label: 'Tài chính', icon: <DollarSign size={13} />, color: DS.green },
  { id: 'team', label: 'Đội ngũ', icon: <Users size={13} />, color: DS.purple },
  { id: 'client', label: 'Khách hàng', icon: <MessageSquare size={13} />, color: DS.cyan },
  { id: 'media', label: 'Media', icon: <Camera size={13} />, color: '#F59E0B' },
  { id: 'system', label: 'Hệ thống', icon: <Settings size={13} />, color: DS.text4 },
];

const DEPARTMENTS = [
  { id: 'all', label: 'Tất cả phòng ban' },
  { id: 'engineering', label: 'Engineering' },
  { id: 'design', label: 'Design' },
  { id: 'media', label: 'Media' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'sales', label: 'Sales' },
  { id: 'finance', label: 'Finance' },
  { id: 'hr', label: 'HR' },
  { id: 'management', label: 'Management' },
];

const PRIORITIES = [
  { id: 'all', label: 'Tất cả', color: DS.text3 },
  { id: 'urgent', label: 'Khẩn cấp', color: DS.red },
  { id: 'high', label: 'Cao', color: DS.amber },
  { id: 'normal', label: 'Bình thường', color: DS.blue },
  { id: 'low', label: 'Thấp', color: DS.text4 },
];

const PRIORITY_BADGE: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  urgent: { label: 'KHẨN', color: DS.red, icon: <AlertTriangle size={10} /> },
  high: { label: 'CAO', color: DS.amber, icon: <ArrowUpRight size={10} /> },
  normal: { label: 'BT', color: DS.blue, icon: <Check size={10} /> },
  low: { label: 'THẤP', color: DS.text4, icon: <ChevronDown size={10} /> },
};

const TYPE_ICON: Record<string, React.ReactNode> = {
  new_order: <ShoppingCart size={14} />,
  payment: <DollarSign size={14} />,
  client_message: <MessageSquare size={14} />,
  demo_approved: <CheckCircle2 size={14} />,
  system: <BarChart3 size={14} />,
  task: <Clock size={14} />,
  lp: <Zap size={14} />,
  review: <Star size={14} />,
  media_booking: <Camera size={14} />,
  media_delivery: <Camera size={14} />,
  escalation: <AlertTriangle size={14} />,
};

const PAGE_SIZE = 20;

export function NotificationCenter() {
  const {
    adminNotifications, markAdminNotifRead, markAllAdminNotifsRead,
    deleteAdminNotif, archiveAdminNotif,
    bulkDeleteAdminNotifs, bulkReadAdminNotifs, bulkArchiveAdminNotifs,
  } = useLoopStore();

  // ── State ───────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [department, setDepartment] = useState('all');
  const [priority, setPriority] = useState('all');
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [showArchived, setShowArchived] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ── Filtered & paginated ────────────────────────────────────────────
  const filtered = useMemo(() => {
    return adminNotifications.filter(n => {
      if (!showArchived && n.archived) return false;
      if (showArchived && !n.archived) return false;
      if (category !== 'all' && n.category !== category) return false;
      if (department !== 'all' && n.department !== department) return false;
      if (priority !== 'all' && n.priority !== priority) return false;
      if (readFilter === 'unread' && n.read) return false;
      if (readFilter === 'read' && !n.read) return false;
      if (search) {
        const q = search.toLowerCase();
        return n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q)
          || (n.department ?? '').toLowerCase().includes(q)
          || (n.assignedTo ?? '').toLowerCase().includes(q)
          || (n.relatedOrderId ?? '').toLowerCase().includes(q);
      }
      return true;
    }).sort((a, b) => {
      // Urgent first, then by timestamp
      const pOrder: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 };
      if (!a.read && b.read) return -1;
      if (a.read && !b.read) return 1;
      const pDiff = (pOrder[a.priority] ?? 2) - (pOrder[b.priority] ?? 2);
      if (pDiff !== 0) return pDiff;
      return b.timestamp - a.timestamp;
    });
  }, [adminNotifications, search, category, department, priority, readFilter, showArchived]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageItems = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const unreadCount = adminNotifications.filter(n => !n.read && !n.archived).length;
  const urgentCount = adminNotifications.filter(n => !n.read && n.priority === 'urgent' && !n.archived).length;

  // ── Stats by category ──────────────────────────────────────────────
  const catCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    adminNotifications.filter(n => !n.archived).forEach(n => {
      counts[n.category] = (counts[n.category] ?? 0) + 1;
      if (!n.read) counts[`${n.category}_unread`] = (counts[`${n.category}_unread`] ?? 0) + 1;
    });
    counts['all'] = adminNotifications.filter(n => !n.archived).length;
    counts['all_unread'] = unreadCount;
    return counts;
  }, [adminNotifications, unreadCount]);

  // ── Handlers ───────────────────────────────────────────────────────
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const selectAll = () => {
    if (selectedIds.size === pageItems.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(pageItems.map(n => n.id)));
  };
  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkRead = () => { bulkReadAdminNotifs([...selectedIds]); clearSelection(); };
  const handleBulkArchive = () => { bulkArchiveAdminNotifs([...selectedIds]); clearSelection(); };
  const handleBulkDelete = () => { bulkDeleteAdminNotifs([...selectedIds]); clearSelection(); };

  return (
    <div className="space-y-4">
      {/* Header with stats */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <div>
            <div style={{ color: DS.text, fontSize: 16, fontWeight: 700 }}>Trung tâm thông báo</div>
            <div style={{ color: DS.text4, fontSize: 12 }}>
              {unreadCount} chưa đọc · {adminNotifications.filter(n => !n.archived).length} tổng
              {urgentCount > 0 && <span style={{ color: DS.red, fontWeight: 700 }}> · {urgentCount} khẩn cấp</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowArchived(!showArchived)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
            style={{ background: showArchived ? rgba(DS.purple, 0.1) : rgba('#FFFFFF', 0.03), border: `1px solid ${showArchived ? rgba(DS.purple, 0.3) : DS.border}`, color: showArchived ? DS.purple : DS.text4, cursor: 'pointer', fontSize: 11 }}>
            <Archive size={12} /> {showArchived ? 'Xem lưu trữ' : 'Hộp chính'}
          </button>
          <button onClick={markAllAdminNotifsRead}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
            style={{ background: rgba(DS.blue, 0.08), border: `1px solid ${rgba(DS.blue, 0.2)}`, color: DS.blue, cursor: 'pointer', fontSize: 11 }}>
            <Eye size={12} /> Đọc hết
          </button>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {CATEGORIES.map(cat => {
          const count = catCounts[cat.id] ?? 0;
          const unread = catCounts[`${cat.id}_unread`] ?? 0;
          const isActive = category === cat.id;
          return (
            <button key={cat.id} onClick={() => { setCategory(cat.id); setPage(0); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap transition-all duration-150"
              style={{
                background: isActive ? rgba(cat.color, 0.1) : 'transparent',
                border: isActive ? `1px solid ${rgba(cat.color, 0.3)}` : '1px solid transparent',
                color: isActive ? cat.color : DS.text4,
                cursor: 'pointer', fontSize: 12, flexShrink: 0,
              }}>
              {cat.icon}
              <span>{cat.label}</span>
              {count > 0 && <span style={{ fontSize: 9, fontFamily: DS.mono, background: rgba(cat.color, isActive ? 0.2 : 0.08), padding: '1px 5px', borderRadius: 6, color: isActive ? cat.color : DS.text5 }}>{count}</span>}
              {unread > 0 && !isActive && <span style={{ width: 6, height: 6, borderRadius: 3, background: cat.color, boxShadow: `0 0 4px ${cat.color}`, flexShrink: 0 }} />}
            </button>
          );
        })}
      </div>

      {/* Search + Filters row */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 min-w-[200px]" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
          <Search size={14} style={{ color: DS.text5 }} />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
            placeholder="Tìm thông báo, đơn hàng, phòng ban, người phụ trách..."
            style={{ background: 'none', border: 'none', outline: 'none', color: DS.text, fontSize: 12, flex: 1, fontFamily: DS.body }} />
          {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: DS.text5 }}><X size={12} /></button>}
        </div>

        {/* Priority filter */}
        <div className="flex gap-1">
          {PRIORITIES.map(p => (
            <button key={p.id} onClick={() => { setPriority(p.id); setPage(0); }}
              style={{
                padding: '5px 10px', borderRadius: 7, fontSize: 10, fontFamily: DS.mono, cursor: 'pointer',
                background: priority === p.id ? rgba(p.color, 0.12) : 'transparent',
                border: priority === p.id ? `1px solid ${rgba(p.color, 0.3)}` : `1px solid ${DS.border}`,
                color: priority === p.id ? p.color : DS.text5,
              }}>
              {p.label}
            </button>
          ))}
        </div>

        {/* Read filter */}
        <div className="flex gap-1">
          {[
            { id: 'all' as const, label: 'Tất cả' },
            { id: 'unread' as const, label: 'Chưa đọc' },
            { id: 'read' as const, label: 'Đã đọc' },
          ].map(f => (
            <button key={f.id} onClick={() => { setReadFilter(f.id); setPage(0); }}
              style={{
                padding: '5px 10px', borderRadius: 7, fontSize: 10, fontFamily: DS.mono, cursor: 'pointer',
                background: readFilter === f.id ? rgba(DS.cyan, 0.1) : 'transparent',
                border: readFilter === f.id ? `1px solid ${rgba(DS.cyan, 0.3)}` : `1px solid ${DS.border}`,
                color: readFilter === f.id ? DS.cyan : DS.text5,
              }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Department dropdown */}
        <select value={department} onChange={e => { setDepartment(e.target.value); setPage(0); }}
          style={{
            padding: '5px 10px', borderRadius: 7, fontSize: 11, fontFamily: DS.mono,
            background: DS.bgCard, border: `1px solid ${DS.border}`, color: DS.text3,
            cursor: 'pointer', outline: 'none',
          }}>
          {DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
        </select>
      </div>

      {/* Bulk actions bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{ background: rgba(DS.blue, 0.06), border: `1px solid ${rgba(DS.blue, 0.15)}` }}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <span style={{ color: DS.blue, fontSize: 12, fontWeight: 600 }}>
              {selectedIds.size} đã chọn
            </span>
            <div className="flex-1" />
            <button onClick={handleBulkRead} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
              style={{ background: rgba(DS.green, 0.08), border: `1px solid ${rgba(DS.green, 0.2)}`, color: DS.green, cursor: 'pointer', fontSize: 11 }}>
              <Eye size={12} /> Đọc
            </button>
            <button onClick={handleBulkArchive} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
              style={{ background: rgba(DS.purple, 0.08), border: `1px solid ${rgba(DS.purple, 0.2)}`, color: DS.purple, cursor: 'pointer', fontSize: 11 }}>
              <Archive size={12} /> Lưu trữ
            </button>
            <button onClick={handleBulkDelete} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
              style={{ background: rgba(DS.red, 0.08), border: `1px solid ${rgba(DS.red, 0.2)}`, color: DS.red, cursor: 'pointer', fontSize: 11 }}>
              <Trash2 size={12} /> Xóa
            </button>
            <button onClick={clearSelection} style={{ background: 'none', border: 'none', cursor: 'pointer', color: DS.text4 }}>
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Select all row */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <button onClick={selectAll}
            className="w-5 h-5 rounded flex items-center justify-center"
            style={{
              background: selectedIds.size === pageItems.length && pageItems.length > 0 ? DS.blue : 'transparent',
              border: selectedIds.size === pageItems.length && pageItems.length > 0 ? 'none' : `1.5px solid ${DS.border}`,
              cursor: 'pointer',
            }}>
            {selectedIds.size === pageItems.length && pageItems.length > 0 && <Check size={11} style={{ color: '#fff' }} />}
          </button>
          <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>
            Chọn tất cả · Trang {page + 1}/{Math.max(1, totalPages)} · {filtered.length} kết quả
          </span>
        </div>
      </div>

      {/* Notification list */}
      <div className="space-y-1.5">
        {pageItems.length === 0 ? (
          <div className="text-center py-16 rounded-2xl" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
            <Bell size={40} style={{ color: DS.text5, margin: '0 auto 12px' }} />
            <div style={{ color: DS.text3, fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
              {showArchived ? 'Không có thông báo lưu trữ' : 'Không có thông báo nào'}
            </div>
            <div style={{ color: DS.text5, fontSize: 12 }}>
              {search ? 'Thử từ khóa khác hoặc bỏ bộ lọc' : 'Tất cả đã xử lý xong!'}
            </div>
          </div>
        ) : pageItems.map((n, i) => {
          const pb = PRIORITY_BADGE[n.priority];
          const isSelected = selectedIds.has(n.id);
          const isExpanded = expandedId === n.id;

          return (
            <motion.div
              key={n.id}
              className="rounded-xl overflow-hidden"
              style={{
                background: n.read ? DS.bgCard : rgba(n.color, 0.03),
                border: isSelected ? `1.5px solid ${rgba(DS.blue, 0.5)}` : `1px solid ${n.read ? DS.border : rgba(n.color, 0.15)}`,
              }}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
            >
              <div
                className="flex items-start gap-3 p-3 cursor-pointer"
                onClick={() => { markAdminNotifRead(n.id); setExpandedId(isExpanded ? null : n.id); }}
              >
                {/* Checkbox */}
                <button onClick={e => { e.stopPropagation(); toggleSelect(n.id); }}
                  className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{
                    background: isSelected ? DS.blue : 'transparent',
                    border: isSelected ? 'none' : `1.5px solid ${DS.border}`,
                    cursor: 'pointer',
                  }}>
                  {isSelected && <Check size={10} style={{ color: '#fff' }} />}
                </button>

                {/* Icon */}
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: rgba(n.color, 0.1), border: `1px solid ${rgba(n.color, 0.2)}` }}>
                  <span style={{ color: n.color }}>{TYPE_ICON[n.type] ?? <Bell size={14} />}</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    {!n.read && (
                      <motion.span className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: n.color, boxShadow: `0 0 4px ${n.color}` }}
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }} />
                    )}
                    <span style={{ color: n.read ? DS.text3 : DS.text, fontSize: 12, fontWeight: n.read ? 500 : 700 }}>
                      {n.title}
                    </span>

                    {/* Priority badge */}
                    {n.priority !== 'normal' && (
                      <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded"
                        style={{ background: rgba(pb.color, 0.1), color: pb.color, fontSize: 8, fontFamily: DS.mono, fontWeight: 700 }}>
                        {pb.icon} {pb.label}
                      </span>
                    )}
                  </div>

                  <div style={{ color: DS.text4, fontSize: 11, lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: isExpanded ? 'normal' : 'nowrap' }}>
                    {n.body}
                  </div>

                  {/* Meta row */}
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>{n.time}</span>
                    {n.department && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded"
                        style={{ background: rgba('#FFFFFF', 0.03), fontSize: 9, fontFamily: DS.mono, color: DS.text5, border: `1px solid ${rgba(DS.border, 0.5)}` }}>
                        <Building2 size={8} /> {n.department}
                      </span>
                    )}
                    {n.assignedTo && (
                      <span className="flex items-center gap-1" style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono }}>
                        <Users size={8} /> {n.assignedTo}
                      </span>
                    )}
                    {n.relatedOrderId && (
                      <span style={{ color: DS.blue, fontSize: 9, fontFamily: DS.mono }}>
                        {n.relatedOrderId}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={e => { e.stopPropagation(); archiveAdminNotif(n.id); }}
                    title="Lưu trữ"
                    style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', color: DS.text5 }}
                    onMouseEnter={e => { e.currentTarget.style.background = rgba(DS.purple, 0.1); e.currentTarget.style.color = DS.purple; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = DS.text5; }}>
                    <Archive size={12} />
                  </button>
                  <button onClick={e => { e.stopPropagation(); deleteAdminNotif(n.id); }}
                    title="Xóa"
                    style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', color: DS.text5 }}
                    onMouseEnter={e => { e.currentTarget.style.background = rgba(DS.red, 0.1); e.currentTarget.style.color = DS.red; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = DS.text5; }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              {/* Expanded detail */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-12 pb-3 pt-1" style={{ borderTop: `1px solid ${rgba(DS.border, 0.5)}` }}>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                        <div>
                          <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono }}>LOẠI</div>
                          <div style={{ color: DS.text3, fontSize: 11 }}>{n.type.replace(/_/g, ' ')}</div>
                        </div>
                        <div>
                          <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono }}>DANH MỤC</div>
                          <div style={{ color: DS.text3, fontSize: 11 }}>{n.category}</div>
                        </div>
                        <div>
                          <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono }}>ĐỘ ƯU TIÊN</div>
                          <div className="flex items-center gap-1">
                            <span style={{ color: pb.color, fontSize: 11, fontWeight: 600 }}>{pb.label}</span>
                          </div>
                        </div>
                        <div>
                          <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono }}>PHÒNG BAN</div>
                          <div style={{ color: DS.text3, fontSize: 11 }}>{n.department ?? '—'}</div>
                        </div>
                      </div>
                      {n.relatedOrderId && (
                        <div className="mt-2 flex items-center gap-2">
                          <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>Liên quan:</span>
                          <span className="px-2 py-0.5 rounded" style={{ background: rgba(DS.blue, 0.08), color: DS.blue, fontSize: 10, fontFamily: DS.mono }}>{n.relatedOrderId}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: page === 0 ? rgba('#FFFFFF', 0.02) : rgba('#FFFFFF', 0.05), border: `1px solid ${DS.border}`, cursor: page === 0 ? 'not-allowed' : 'pointer', color: page === 0 ? DS.text5 : DS.text3 }}>
            <ChevronLeft size={14} />
          </button>

          {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
            let pageNum: number;
            if (totalPages <= 7) pageNum = i;
            else if (page < 3) pageNum = i;
            else if (page > totalPages - 4) pageNum = totalPages - 7 + i;
            else pageNum = page - 3 + i;
            return (
              <button key={pageNum} onClick={() => setPage(pageNum)}
                style={{
                  width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: page === pageNum ? GRD.primary : rgba('#FFFFFF', 0.03),
                  border: page === pageNum ? 'none' : `1px solid ${DS.border}`,
                  color: page === pageNum ? '#fff' : DS.text4,
                  cursor: 'pointer', fontSize: 11, fontFamily: DS.mono,
                }}>
                {pageNum + 1}
              </button>
            );
          })}

          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
            style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: page >= totalPages - 1 ? rgba('#FFFFFF', 0.02) : rgba('#FFFFFF', 0.05), border: `1px solid ${DS.border}`, cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', color: page >= totalPages - 1 ? DS.text5 : DS.text3 }}>
            <ChevronRight size={14} />
          </button>

          <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, marginLeft: 8 }}>
            {filtered.length} thông báo
          </span>
        </div>
      )}
    </div>
  );
}
