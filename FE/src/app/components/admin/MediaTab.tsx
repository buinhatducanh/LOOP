/**
 * MediaTab — Admin panel for managing Media bookings
 * Book Chụp · Book Quay · Làm Content
 */
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Camera, Video, FileText, Search, Filter, Check, X, Clock,
  Calendar, MapPin, Users, Star, Eye, ChevronDown, ArrowUpRight,
  Zap, AlertCircle, CheckCircle2, Play, Pause, Trash2, Edit3, Loader2,
} from 'lucide-react';
import { DS, GRD } from '../layout/ds';
import { useLoopStore, type AdminNotification } from '../../store/loopStore';
import { mediaBookingsService, type MediaBooking as BeBooking } from '../../../api/media-bookings.service';

const fmtVND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

const rgba = (hex: string, a: number) => {
  const h = hex.replace('#', '');
  return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`;
};

// ── Mock fallback (used when BE is offline) ──────────────────────────────────
type MediaStatus = 'pending' | 'confirmed' | 'in_progress' | 'delivered' | 'completed' | 'cancelled';

interface LocalMediaBooking {
  id: string;
  type: 'photo' | 'video' | 'content';
  clientName: string;
  clientCompany: string;
  clientAvatar: string;
  package: string;
  styles: string[];
  addons: string[];
  date: string;
  timeSlot: string;
  location: string;
  assignedLead: string;
  budget: number;
  status: MediaStatus;
  lpReward: number;
  note: string;
  createdAt: string;
}

const FALLBACK_BOOKINGS: LocalMediaBooking[] = [
  {
    id: 'MDA-8821', type: 'photo', clientName: 'Trần Minh Hùng', clientCompany: 'CafeHouse VN',
    clientAvatar: 'https://images.unsplash.com/photo-1557862921-37829c790f19?auto=format&fit=crop&w=80&h=80&crop=faces',
    package: 'Professional', styles: ['Ẩm thực', 'Sản phẩm'], addons: ['Studio cao cấp', 'Retouch chuyên sâu'],
    date: '28/03/2026', timeSlot: 'Sáng (08:00-12:00)', location: 'Studio LOOP, Q1, HCM',
    assignedLead: 'Haru Tanaka', budget: 19_000_000, status: 'confirmed', lpReward: 760,
    note: 'Cần chụp 50 món cho menu mới. Mood: rustic, warm tone.', createdAt: '24/03/2026',
  },
  {
    id: 'MDA-8822', type: 'video', clientName: 'Nguyễn Thu Hà', clientCompany: 'BeautyLab',
    clientAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=80&h=80&crop=faces',
    package: 'Premium', styles: ['TVC / Quảng cáo', 'Review sản phẩm'], addons: ['Drone cinematic', 'Licensed music', 'Voice-over'],
    date: '30/03/2026', timeSlot: 'Cả ngày (08:00-18:00)', location: 'Spa BeautyLab, Q3, HCM',
    assignedLead: 'Trần Thu Linh', budget: 82_500_000, status: 'in_progress', lpReward: 3300,
    note: 'TVC 30s + 3 clips review cho TikTok. Cần diễn viên nữ.', createdAt: '20/03/2026',
  },
  {
    id: 'MDA-8823', type: 'content', clientName: 'Lê Hoàng Nam', clientCompany: 'TechStart VN',
    clientAvatar: 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&w=80&h=80&crop=faces',
    package: 'Professional', styles: ['TikTok / Reels', 'YouTube'], addons: ['Script writing', 'Quản lý đăng bài 1 tháng'],
    date: '01/04/2026', timeSlot: 'Chiều (13:00-17:00)', location: 'Văn phòng TechStart, Q7, HCM',
    assignedLead: 'Kai Nguyen', budget: 28_000_000, status: 'pending', lpReward: 1120,
    note: 'Chuỗi 8 videos ngắn giới thiệu sản phẩm SaaS. Phong cách tech/modern.', createdAt: '25/03/2026',
  },
  {
    id: 'MDA-8824', type: 'photo', clientName: 'Phạm Thị Lan', clientCompany: 'FashionX',
    clientAvatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=80&h=80&crop=faces',
    package: 'Premium', styles: ['Thời trang', 'Chân dung'], addons: ['Model chuyên nghiệp', 'Drone', 'In ảnh album'],
    date: '25/03/2026', timeSlot: 'Cả ngày (08:00-18:00)', location: 'Outdoor, Đà Lạt',
    assignedLead: 'Haru Tanaka', budget: 35_000_000, status: 'delivered', lpReward: 1400,
    note: 'Lookbook Summer 2026. 2 models, 5 sets.', createdAt: '18/03/2026',
  },
  {
    id: 'MDA-8825', type: 'video', clientName: 'Vũ Đức Anh', clientCompany: 'ResortStar',
    clientAvatar: 'https://images.unsplash.com/photo-1557862921-37829c790f19?auto=format&fit=crop&w=80&h=80&crop=faces',
    package: 'Premium', styles: ['Quay flycam', 'Phóng sự doanh nghiệp'], addons: ['Drone cinematic', 'Motion graphics', 'Licensed music'],
    date: '22/03/2026', timeSlot: 'Cả ngày (08:00-18:00)', location: 'ResortStar Phú Quốc',
    assignedLead: 'Trần Thu Linh', budget: 95_000_000, status: 'completed', lpReward: 3800,
    note: 'Video giới thiệu resort 3 phút. Drone shots bắt buộc.', createdAt: '10/03/2026',
  },
];

const TYPE_CFG = {
  photo: { label: 'Chụp ảnh', icon: <Camera size={14} />, color: '#F59E0B' },
  video: { label: 'Quay phim', icon: <Video size={14} />, color: '#EF4444' },
  content: { label: 'Content', icon: <FileText size={14} />, color: '#818CF8' },
};

const STATUS_CFG: Record<MediaStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'Chờ xác nhận', color: DS.amber, icon: <Clock size={12} /> },
  confirmed: { label: 'Đã xác nhận', color: DS.blue, icon: <Check size={12} /> },
  in_progress: { label: 'Đang thực hiện', color: DS.purple, icon: <Play size={12} /> },
  delivered: { label: 'Đã giao file', color: DS.cyan, icon: <ArrowUpRight size={12} /> },
  completed: { label: 'Hoàn thành', color: DS.green, icon: <CheckCircle2 size={12} /> },
  cancelled: { label: 'Hủy bỏ', color: DS.red, icon: <X size={12} /> },
};

export function MediaTab() {
  const [bookings, setBookings] = useState<LocalMediaBooking[]>(FALLBACK_BOOKINGS);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selected, setSelected] = useState<string | null>(null);
  const { addAdminNotification } = useLoopStore();

  // ── Fetch bookings from BE ──────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError('');
    mediaBookingsService.getBookings({ limit: 100 })
      .then(({ bookings: be }) => {
        if (cancelled) return;
        setBookings(be as unknown as LocalMediaBooking[]);
      })
      .catch(() => { if (!cancelled) setLoadError('Không tải được danh sách media bookings'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    return bookings.filter(b => {
      if (filterType !== 'all' && b.type !== filterType) return false;
      if (filterStatus !== 'all' && b.status !== filterStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        return b.clientName.toLowerCase().includes(q) || b.clientCompany.toLowerCase().includes(q) || b.id.toLowerCase().includes(q);
      }
      return true;
    });
  }, [bookings, search, filterType, filterStatus]);

  const stats = useMemo(() => {
    const total = bookings.length;
    const active = bookings.filter(b => ['confirmed', 'in_progress'].includes(b.status)).length;
    const pending = bookings.filter(b => b.status === 'pending').length;
    const revenue = bookings.filter(b => b.status !== 'cancelled').reduce((s, b) => s + b.budget, 0);
    return { total, active, pending, revenue };
  }, [bookings]);

  const updateStatus = (id: string, status: MediaStatus) => {
    // Optimistic update
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    const booking = bookings.find(b => b.id === id);
    // Sync to BE
    mediaBookingsService.transitionBooking(id, status).catch(() => {
      // Revert on error
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: booking?.status ?? 'pending' } : b));
    });
    // Notification
    if (booking) {
      const notif: AdminNotification = {
        id: `an_media_${Date.now()}`,
        type: status === 'confirmed' ? 'media_booking' : 'media_delivery',
        title: `📸 Media ${id} → ${STATUS_CFG[status].label}`,
        body: `Booking ${booking.type === 'photo' ? 'chụp ảnh' : booking.type === 'video' ? 'quay phim' : 'content'} của ${booking.clientName} (${booking.clientCompany})`,
        time: 'Vừa xong', read: false, color: STATUS_CFG[status].color,
        relatedOrderId: id, timestamp: Date.now(),
        priority: status === 'pending' ? 'high' : 'normal',
        department: 'media', assignedTo: booking.assignedLead,
        category: 'media', archived: false,
      };
      addAdminNotification(notif);
    }
  };

  const selectedBooking = bookings.find(b => b.id === selected);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { label: 'Tổng booking', value: stats.total, color: DS.blue, icon: <Camera size={18} /> },
          { label: 'Đang thực hiện', value: stats.active, color: DS.purple, icon: <Play size={18} /> },
          { label: 'Chờ xác nhận', value: stats.pending, color: DS.amber, icon: <Clock size={18} /> },
          { label: 'Doanh thu Media', value: fmtVND(stats.revenue), color: DS.green, icon: <Zap size={18} /> },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: rgba(s.color, 0.12), border: `1px solid ${rgba(s.color, 0.25)}` }}>
                <span style={{ color: s.color }}>{s.icon}</span>
              </div>
            </div>
            <div style={{ color: s.color, fontFamily: DS.heading, fontSize: 22, fontWeight: 700 }}>{s.value}</div>
            <div style={{ color: DS.text4, fontSize: 11, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {loading && (
          <div className="flex items-center gap-1.5 px-2" style={{ color: DS.text5 }}>
            <Loader2 size={12} className="animate-spin" />
            <span style={{ fontSize: 10, fontFamily: DS.mono }}>Đang tải...</span>
          </div>
        )}
        {loadError && (
          <span style={{ fontSize: 10, color: DS.red, fontFamily: DS.mono }}>{loadError}</span>
        )}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 min-w-[200px]" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
          <Search size={14} style={{ color: DS.text4 }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm theo tên, công ty, mã booking..."
            style={{ background: 'none', border: 'none', outline: 'none', color: DS.text, fontSize: 13, flex: 1, fontFamily: DS.body }} />
        </div>

        {/* Type filter */}
        <div className="flex gap-1">
          {[{ id: 'all', label: 'Tất cả' }, ...Object.entries(TYPE_CFG).map(([id, c]) => ({ id, label: c.label }))].map(f => (
            <button key={f.id} onClick={() => setFilterType(f.id)}
              style={{
                padding: '6px 12px', borderRadius: 8, fontSize: 11, fontFamily: DS.mono, cursor: 'pointer',
                background: filterType === f.id ? rgba(DS.blue, 0.12) : 'transparent',
                border: filterType === f.id ? `1px solid ${rgba(DS.blue, 0.3)}` : `1px solid ${DS.border}`,
                color: filterType === f.id ? DS.blue : DS.text4,
              }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex gap-1">
          {[{ id: 'all', label: 'Tất cả' }, { id: 'pending', label: 'Chờ' }, { id: 'confirmed', label: 'XN' }, { id: 'in_progress', label: 'Đang làm' }, { id: 'delivered', label: 'Giao' }, { id: 'completed', label: 'Xong' }].map(f => (
            <button key={f.id} onClick={() => setFilterStatus(f.id)}
              style={{
                padding: '6px 10px', borderRadius: 8, fontSize: 10, fontFamily: DS.mono, cursor: 'pointer',
                background: filterStatus === f.id ? rgba(DS.purple, 0.12) : 'transparent',
                border: filterStatus === f.id ? `1px solid ${rgba(DS.purple, 0.3)}` : `1px solid ${DS.border}`,
                color: filterStatus === f.id ? DS.purple : DS.text5,
              }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings list + Detail */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* List */}
        <div className="xl:col-span-3 space-y-2">
          <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 4 }}>
            {filtered.length} BOOKING{filtered.length !== 1 ? 'S' : ''}
          </div>
          {filtered.map((b, i) => {
            const tc = TYPE_CFG[b.type];
            const sc = STATUS_CFG[b.status];
            return (
              <motion.div
                key={b.id}
                onClick={() => setSelected(b.id)}
                className="p-4 rounded-xl cursor-pointer transition-all duration-150"
                style={{
                  background: selected === b.id ? rgba(tc.color, 0.04) : DS.bgCard,
                  border: selected === b.id ? `1.5px solid ${rgba(tc.color, 0.35)}` : `1px solid ${DS.border}`,
                }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onMouseEnter={e => { if (selected !== b.id) e.currentTarget.style.borderColor = rgba(tc.color, 0.2); }}
                onMouseLeave={e => { if (selected !== b.id) e.currentTarget.style.borderColor = DS.border; }}
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0" style={{ border: `1.5px solid ${rgba(tc.color, 0.3)}` }}>
                    <img src={b.clientAvatar} alt={b.clientName} className="w-full h-full object-cover" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span style={{ color: DS.text, fontSize: 13, fontWeight: 700 }}>{b.clientName}</span>
                      <span style={{ color: DS.text5, fontSize: 11 }}>· {b.clientCompany}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded" style={{ background: rgba(tc.color, 0.1), color: tc.color, fontSize: 10, fontFamily: DS.mono }}>
                        {tc.icon} {tc.label}
                      </span>
                      <span style={{ color: DS.text4, fontSize: 11 }}>{b.package}</span>
                      <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>· {b.id}</span>
                    </div>
                  </div>

                  {/* Right */}
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg mb-1" style={{ background: rgba(sc.color, 0.1), border: `1px solid ${rgba(sc.color, 0.2)}` }}>
                      <span style={{ color: sc.color }}>{sc.icon}</span>
                      <span style={{ color: sc.color, fontSize: 10, fontFamily: DS.mono }}>{sc.label}</span>
                    </div>
                    <div style={{ color: tc.color, fontSize: 12, fontFamily: DS.mono, fontWeight: 700 }}>{fmtVND(b.budget)}</div>
                  </div>
                </div>

                {/* Bottom row */}
                <div className="flex items-center gap-4 mt-2 pt-2" style={{ borderTop: `1px solid ${rgba(DS.border, 0.5)}` }}>
                  <span className="flex items-center gap-1" style={{ color: DS.text5, fontSize: 10 }}>
                    <Calendar size={10} /> {b.date}
                  </span>
                  <span className="flex items-center gap-1" style={{ color: DS.text5, fontSize: 10 }}>
                    <Clock size={10} /> {b.timeSlot.split(' ')[0]}
                  </span>
                  <span className="flex items-center gap-1" style={{ color: DS.text5, fontSize: 10 }}>
                    <MapPin size={10} /> {b.location.split(',')[0]}
                  </span>
                  <span className="flex items-center gap-1 ml-auto" style={{ color: DS.text5, fontSize: 10 }}>
                    <Users size={10} /> {b.assignedLead}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Detail panel */}
        <div className="xl:col-span-2">
          <AnimatePresence mode="wait">
            {selectedBooking ? (
              <motion.div
                key={selectedBooking.id}
                className="rounded-2xl overflow-hidden sticky top-14"
                style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                {/* Header */}
                <div className="p-5" style={{ background: `linear-gradient(135deg, ${rgba(TYPE_CFG[selectedBooking.type].color, 0.12)}, transparent)`, borderBottom: `1px solid ${DS.border}` }}>
                  <div className="flex items-center justify-between mb-3">
                    <span style={{ color: TYPE_CFG[selectedBooking.type].color, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.12em' }}>
                      {selectedBooking.id} · {TYPE_CFG[selectedBooking.type].label.toUpperCase()}
                    </span>
                    <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: DS.text4 }}>
                      <X size={16} />
                    </button>
                  </div>
                  <div style={{ color: DS.text, fontSize: 16, fontWeight: 700 }}>{selectedBooking.clientName}</div>
                  <div style={{ color: DS.text4, fontSize: 12 }}>{selectedBooking.clientCompany}</div>
                </div>

                <div className="p-5 space-y-4">
                  {/* Status actions */}
                  <div>
                    <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.12em', marginBottom: 8 }}>CẬP NHẬT TRẠNG THÁI</div>
                    <div className="flex flex-wrap gap-2">
                      {(['pending', 'confirmed', 'in_progress', 'delivered', 'completed'] as MediaStatus[]).map(st => {
                        const cfg = STATUS_CFG[st];
                        const isActive = selectedBooking.status === st;
                        return (
                          <button key={st} onClick={() => updateStatus(selectedBooking.id, st)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-150"
                            style={{
                              background: isActive ? rgba(cfg.color, 0.15) : rgba('#FFFFFF', 0.03),
                              border: isActive ? `1.5px solid ${rgba(cfg.color, 0.5)}` : `1px solid ${DS.border}`,
                              color: isActive ? cfg.color : DS.text4,
                              cursor: 'pointer', fontSize: 11,
                            }}>
                            {cfg.icon} {cfg.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Details grid */}
                  <div className="space-y-2.5">
                    {[
                      { label: 'Gói', value: selectedBooking.package },
                      { label: 'Ngày', value: selectedBooking.date },
                      { label: 'Khung giờ', value: selectedBooking.timeSlot },
                      { label: 'Địa điểm', value: selectedBooking.location },
                      { label: 'Creative Lead', value: selectedBooking.assignedLead },
                      { label: 'Ngân sách', value: fmtVND(selectedBooking.budget), color: TYPE_CFG[selectedBooking.type].color },
                      { label: 'LP thưởng', value: `+${selectedBooking.lpReward} LP`, color: DS.purple },
                    ].map(r => (
                      <div key={r.label} className="flex justify-between">
                        <span style={{ color: DS.text4, fontSize: 12 }}>{r.label}</span>
                        <span style={{ color: (r as any).color ?? DS.text, fontSize: 12, fontWeight: 600 }}>{r.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Styles */}
                  <div>
                    <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.12em', marginBottom: 6 }}>PHONG CÁCH</div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedBooking.styles.map(s => (
                        <span key={s} style={{ fontSize: 10, fontFamily: DS.mono, color: TYPE_CFG[selectedBooking.type].color, background: rgba(TYPE_CFG[selectedBooking.type].color, 0.08), padding: '2px 8px', borderRadius: 5 }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Addons */}
                  {selectedBooking.addons.length > 0 && (
                    <div>
                      <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.12em', marginBottom: 6 }}>ADD-ONS</div>
                      <div className="space-y-1.5">
                        {selectedBooking.addons.map(a => (
                          <div key={a} className="flex items-center gap-2">
                            <Check size={10} style={{ color: DS.green }} />
                            <span style={{ color: DS.text3, fontSize: 12 }}>{a}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Note */}
                  {selectedBooking.note && (
                    <div className="p-3 rounded-xl" style={{ background: rgba('#FFFFFF', 0.02), border: `1px solid ${rgba(DS.border, 0.5)}` }}>
                      <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, marginBottom: 4 }}>GHI CHÚ KHÁCH HÀNG</div>
                      <div style={{ color: DS.text3, fontSize: 12, lineHeight: 1.6 }}>{selectedBooking.note}</div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <button style={{ flex: 1, background: GRD.primary, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 0', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                      💬 Nhắn khách hàng
                    </button>
                    <button style={{ padding: '10px 14px', borderRadius: 10, background: rgba(DS.red, 0.08), border: `1px solid ${rgba(DS.red, 0.2)}`, cursor: 'pointer', color: DS.red }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                className="rounded-2xl p-8 text-center"
                style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Camera size={40} style={{ color: DS.text5, margin: '0 auto 12px' }} />
                <div style={{ color: DS.text3, fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Chọn một booking</div>
                <div style={{ color: DS.text5, fontSize: 12 }}>Nhấp vào booking để xem chi tiết và quản lý</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
