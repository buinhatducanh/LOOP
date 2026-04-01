/**
 * OrdersTab — Quản lý đơn hàng & giao tiếp khách hàng (Admin)
 * Khi khách thanh toán → admin nhận notif → phân công → gửi demo link → khách xem
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Send, Monitor, Link as LinkIcon, ChevronRight,
  Clock, CheckCircle2, AlertCircle, User, Calendar,
  DollarSign, Zap, MessageCircle, Eye, Plus,
} from 'lucide-react';
import { DS, GRD } from '../layout/ds';
import { useLoopStore, type Order, type OrderStatus } from '../../store/loopStore';
import { DemoViewer } from '../ui/DemoViewer';
import { members } from '../team/memberData';

const fmtVND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

const STATUS_CFG: Record<OrderStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending_payment: { label: 'Chờ thanh toán', color: DS.text4, icon: <Clock size={12} /> },
  paid:            { label: 'Đã thanh toán', color: DS.blue, icon: <CheckCircle2 size={12} /> },
  in_progress:     { label: 'Đang thực hiện', color: DS.cyan, icon: <AlertCircle size={12} /> },
  demo_ready:      { label: 'Demo sẵn sàng', color: DS.amber, icon: <Monitor size={12} /> },
  client_review:   { label: 'Khách đang review', color: DS.purple, icon: <Eye size={12} /> },
  done:            { label: 'Hoàn thành', color: DS.green, icon: <CheckCircle2 size={12} /> },
  cancelled:       { label: 'Đã hủy', color: DS.red, icon: <X size={12} /> },
};

const STATUS_FLOW: OrderStatus[] = ['pending_payment', 'paid', 'in_progress', 'demo_ready', 'client_review', 'done'];

// ── Send Demo Modal ────────────────────────────────────────────────────────────
function SendDemoModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const { sendDemoLink } = useLoopStore();
  const [demoUrl, setDemoUrl] = useState(order.demoUrl ?? '');
  const [maskedUrl, setMaskedUrl] = useState(order.maskedUrl ?? `demo.loop-solutions.vn/${order.id.toLowerCase()}`);
  const [note, setNote] = useState('Demo bản mới nhất đã sẵn sàng! Anh/Chị xem và phản hồi nhé 🎉');
  const [showPreview, setShowPreview] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    sendDemoLink(order.id, demoUrl, maskedUrl, note);
    setSent(true);
    setTimeout(onClose, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl rounded-3xl overflow-hidden"
        style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
        {sent ? (
          <div className="p-12 text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}>
              <div className="text-6xl mb-4">🚀</div>
            </motion.div>
            <div style={{ color: DS.green, fontFamily: DS.mono, fontSize: 16, fontWeight: 700, marginBottom: 8 }}>DEMO ĐÃ GỬI!</div>
            <p style={{ color: DS.text4, fontSize: 13 }}>Khách hàng {order.clientName} sẽ nhận thông báo ngay.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between p-5" style={{ borderBottom: `1px solid ${DS.border}` }}>
              <div>
                <div style={{ color: DS.text, fontSize: 15, fontWeight: 700 }}>Gửi Demo Link cho khách</div>
                <div style={{ color: DS.text4, fontSize: 12 }}>{order.clientName} · {order.title}</div>
              </div>
              <button onClick={onClose} style={{ color: DS.text4, background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3 rounded-xl" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <div style={{ color: DS.green, fontSize: 11, fontFamily: DS.mono, marginBottom: 4 }}>🔒 URL GỐC SẼ ĐƯỢC MÃ HÓA</div>
                <p style={{ color: DS.text4, fontSize: 12 }}>
                  Khách chỉ thấy URL che. URL thật được mã hóa base64 và không hiện trong source code của trình duyệt.
                </p>
              </div>

              <div>
                <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: 'block', marginBottom: 6 }}>URL GỐC DEMO (ẩn với khách) *</label>
                <input value={demoUrl} onChange={e => setDemoUrl(e.target.value)}
                  placeholder="https://figma.com/embed?... hoặc https://staging.example.com"
                  style={{ width: '100%', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '10px 12px', color: DS.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div>
                <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: 'block', marginBottom: 6 }}>URL CHE (khách thấy trong thanh địa chỉ)</label>
                <input value={maskedUrl} onChange={e => setMaskedUrl(e.target.value)}
                  style={{ width: '100%', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '10px 12px', color: DS.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div>
                <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: 'block', marginBottom: 6 }}>GHI CHÚ KÈM (tin nhắn gửi khách)</label>
                <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
                  style={{ width: '100%', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '10px 12px', color: DS.text, fontSize: 13, outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: DS.body, lineHeight: 1.6 }} />
              </div>

              {demoUrl && (
                <button onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl w-full justify-center"
                  style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', color: DS.blue, fontSize: 12, cursor: 'pointer' }}>
                  <Monitor size={13} /> {showPreview ? 'Ẩn preview' : 'Preview demo trước khi gửi'}
                </button>
              )}

              {showPreview && demoUrl && (
                <DemoViewer
                  demoUrl={demoUrl} maskedUrl={maskedUrl}
                  previewImg="https://images.unsplash.com/photo-1590965918603-0dce981d13b8?auto=format&fit=crop&w=800&q=80"
                  title={order.title} accentColor={DS.green} height={280}
                />
              )}

              <button onClick={handleSend} disabled={!demoUrl}
                style={{ width: '100%', background: demoUrl ? GRD.primary : DS.border, color: '#fff', border: 'none', borderRadius: 12, padding: '13px', fontSize: 15, fontWeight: 700, cursor: demoUrl ? 'pointer' : 'default', boxShadow: demoUrl ? '0 0 24px rgba(129,140,248,0.35)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Send size={15} /> Gửi Demo cho {order.clientName}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

// ── Order Detail Panel ─────────────────────────────────────────────────────────
function OrderDetailPanel({ order, onClose }: { order: Order; onClose: () => void }) {
  const { updateOrderStatus, updateOrderProgress, sendAdminMessage } = useLoopStore();
  const [msgText, setMsgText] = useState('');
  const [showSendDemo, setShowSendDemo] = useState(false);
  const [selectedPM, setSelectedPM] = useState(order.assignedPM ?? '');

  const sc = STATUS_CFG[order.status];
  const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(order.status) + 1];

  const handleSendMsg = () => {
    if (!msgText.trim()) return;
    sendAdminMessage(order.id, msgText);
    setMsgText('');
  };

  return (
    <>
      <AnimatePresence>
        {showSendDemo && <SendDemoModal order={order} onClose={() => setShowSendDemo(false)} />}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}
        className="flex flex-col" style={{ width: 440, background: DS.bgCard, borderLeft: `1px solid ${DS.border}`, height: '100%' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 flex-shrink-0" style={{ borderBottom: `1px solid ${DS.border}` }}>
          <div>
            <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.15em' }}>ĐƠN HÀNG · {order.invoiceId}</div>
            <div style={{ color: DS.text, fontSize: 14, fontWeight: 700, marginTop: 2, lineHeight: 1.3 }}>{order.title}</div>
          </div>
          <button onClick={onClose} style={{ color: DS.text4, background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Status pipeline */}
          <div className="p-4" style={{ borderBottom: `1px solid ${DS.border}` }}>
            <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.12em', marginBottom: 10 }}>TIẾN TRÌNH ĐƠN HÀNG</div>
            <div className="flex items-center gap-1">
              {STATUS_FLOW.map((s, si) => {
                const idx = STATUS_FLOW.indexOf(order.status);
                const isCurrent = s === order.status;
                const isDone = si < idx;
                const sc2 = STATUS_CFG[s];
                return (
                  <div key={s} className="flex items-center gap-1 flex-1 min-w-0">
                    <div className="flex flex-col items-center gap-1 min-w-0 flex-1">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: isDone ? `${DS.green}20` : isCurrent ? `${sc.color}20` : 'rgba(255,255,255,0.05)', border: `1.5px solid ${isDone ? DS.green : isCurrent ? sc.color : DS.border}` }}>
                        {isDone ? <CheckCircle2 size={10} style={{ color: DS.green }} /> : <span style={{ color: isCurrent ? sc.color : DS.text5, fontSize: 8 }}>{si + 1}</span>}
                      </div>
                      <span style={{ color: isCurrent ? sc.color : DS.text5, fontSize: 8, fontFamily: DS.mono, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 60, textAlign: 'center' }}>
                        {sc2.label.split(' ')[0]}
                      </span>
                    </div>
                    {si < STATUS_FLOW.length - 1 && (
                      <div style={{ flex: '0 0 12px', height: 1, background: si < STATUS_FLOW.indexOf(order.status) ? DS.green : DS.border, marginBottom: 14 }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Info */}
          <div className="p-4 space-y-3" style={{ borderBottom: `1px solid ${DS.border}` }}>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: <User size={12} />, label: 'Khách hàng', val: order.clientName },
                { icon: <DollarSign size={12} />, label: 'Giá trị', val: fmtVND(order.budget) },
                { icon: <Calendar size={12} />, label: 'Ngày tạo', val: order.createdAt },
                { icon: <Zap size={12} />, label: 'LP thưởng', val: `+${order.lpReward.toLocaleString()} LP` },
              ].map(item => (
                <div key={item.label} className="p-3 rounded-xl" style={{ background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
                  <div className="flex items-center gap-1.5 mb-1" style={{ color: DS.text4 }}>
                    {item.icon}
                    <span style={{ fontSize: 10, fontFamily: DS.mono }}>{item.label}</span>
                  </div>
                  <div style={{ color: DS.text, fontSize: 13, fontWeight: 600 }}>{item.val}</div>
                </div>
              ))}
            </div>

            {/* Progress slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span style={{ color: DS.text4, fontSize: 12 }}>Tiến độ dự án</span>
                <span style={{ color: DS.cyan, fontFamily: DS.mono, fontSize: 13, fontWeight: 700 }}>{order.progress}%</span>
              </div>
              <input type="range" min={0} max={100} step={5} value={order.progress}
                onChange={e => updateOrderProgress(order.id, Number(e.target.value))}
                style={{ width: '100%', accentColor: DS.cyan }} />
            </div>

            {/* PM assignment */}
            <div>
              <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: 'block', marginBottom: 6 }}>PHÂN CÔNG PM</label>
              <div className="flex gap-2">
                <select value={selectedPM} onChange={e => setSelectedPM(e.target.value)}
                  style={{ flex: 1, background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '8px 12px', color: DS.text, fontSize: 13, outline: 'none' }}>
                  <option value="">-- Chọn PM --</option>
                  {members.slice(0, 8).map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                </select>
                <button onClick={() => updateOrderStatus(order.id, order.status, selectedPM)}
                  style={{ padding: '8px 14px', borderRadius: 10, background: GRD.primary, color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  Lưu
                </button>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="p-4 space-y-2" style={{ borderBottom: `1px solid ${DS.border}` }}>
            <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.12em', marginBottom: 8 }}>HÀNH ĐỘNG NHANH</div>

            <button onClick={() => setShowSendDemo(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', cursor: 'pointer', textAlign: 'left' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.15)' }}>
                <Monitor size={14} style={{ color: DS.green }} />
              </div>
              <div>
                <div style={{ color: DS.green, fontSize: 13, fontWeight: 700 }}>Gửi Demo Link</div>
                <div style={{ color: DS.text4, fontSize: 11 }}>URL được mã hóa, khách không thấy link thật</div>
              </div>
            </button>

            {nextStatus && order.status !== 'done' && (
              <button onClick={() => updateOrderStatus(order.id, nextStatus, selectedPM)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ background: `${STATUS_CFG[nextStatus].color}08`, border: `1px solid ${STATUS_CFG[nextStatus].color}25`, cursor: 'pointer', textAlign: 'left' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: `${STATUS_CFG[nextStatus].color}15` }}>
                  <span style={{ color: STATUS_CFG[nextStatus].color }}>{STATUS_CFG[nextStatus].icon}</span>
                </div>
                <div>
                  <div style={{ color: STATUS_CFG[nextStatus].color, fontSize: 13, fontWeight: 700 }}>
                    Chuyển → {STATUS_CFG[nextStatus].label}
                  </div>
                  <div style={{ color: DS.text4, fontSize: 11 }}>Cập nhật trạng thái và thông báo khách</div>
                </div>
              </button>
            )}
          </div>

          {/* Chat history */}
          <div className="p-4">
            <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.12em', marginBottom: 12 }}>
              LỊCH SỬ TRAO ĐỔI ({order.messages.length})
            </div>
            <div className="space-y-3">
              {order.messages.map(msg => (
                <div key={msg.id}
                  className={`flex gap-2.5 ${msg.senderId === 'admin' ? '' : 'flex-row-reverse'}`}>
                  <div className="w-7 h-7 rounded-lg flex-shrink-0 overflow-hidden"
                    style={{ background: msg.senderId === 'admin' ? 'rgba(59,130,246,0.15)' : 'rgba(129,140,248,0.15)', border: `1px solid ${msg.senderId === 'admin' ? DS.blue : DS.purple}30` }}>
                    {msg.senderId === 'admin'
                      ? <div className="w-full h-full flex items-center justify-center"><span style={{ color: DS.blue, fontSize: 10 }}>L</span></div>
                      : <div className="w-full h-full flex items-center justify-center"><span style={{ color: DS.purple, fontSize: 10 }}>C</span></div>}
                  </div>
                  <div className={`flex-1 max-w-xs ${msg.senderId === 'admin' ? '' : 'text-right'}`}>
                    <div className="px-3 py-2.5 rounded-xl"
                      style={{ background: msg.senderId === 'admin' ? 'rgba(59,130,246,0.1)' : 'rgba(129,140,248,0.1)', display: 'inline-block', textAlign: 'left' }}>
                      {msg.type === 'demo_link' ? (
                        <div>
                          <div style={{ color: DS.text3, fontSize: 12, marginBottom: 6 }}>{msg.content}</div>
                          <div className="flex items-center gap-2 p-2 rounded-lg"
                            style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                            <Monitor size={11} style={{ color: DS.green }} />
                            <span style={{ color: DS.green, fontSize: 11, fontFamily: DS.mono }}>{msg.maskedUrl}</span>
                          </div>
                        </div>
                      ) : msg.type === 'system' ? (
                        <div style={{ color: DS.text5, fontSize: 11, fontStyle: 'italic' }}>{msg.content}</div>
                      ) : (
                        <div style={{ color: DS.text3, fontSize: 12 }}>{msg.content}</div>
                      )}
                    </div>
                    <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, marginTop: 3 }}>
                      {msg.senderName} · {msg.timestamp}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Message input */}
        <div className="p-4 flex-shrink-0" style={{ borderTop: `1px solid ${DS.border}` }}>
          <div className="flex gap-2">
            <input value={msgText} onChange={e => setMsgText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMsg()}
              placeholder="Nhập tin nhắn cho khách hàng..."
              style={{ flex: 1, background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '10px 12px', color: DS.text, fontSize: 13, outline: 'none', fontFamily: DS.body }} />
            <button onClick={() => setShowSendDemo(true)}
              style={{ padding: '10px 12px', borderRadius: 10, background: `${DS.green}15`, border: `1px solid ${DS.green}30`, color: DS.green, cursor: 'pointer' }}>
              <Monitor size={14} />
            </button>
            <button onClick={handleSendMsg} disabled={!msgText.trim()}
              style={{ padding: '10px 14px', borderRadius: 10, background: GRD.primary, border: 'none', color: '#fff', cursor: 'pointer', opacity: msgText.trim() ? 1 : 0.5 }}>
              <Send size={14} />
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function OrdersTab() {
  const { orders, adminNotifications } = useLoopStore();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
  const [search, setSearch] = useState('');

  const newPaidOrders = orders.filter(o => o.status === 'paid');
  const filtered = orders.filter(o =>
    (filterStatus === 'all' || o.status === filterStatus) &&
    (o.title.toLowerCase().includes(search.toLowerCase()) || o.clientName.toLowerCase().includes(search.toLowerCase()))
  );

  const totalRevenue = orders.filter(o => o.status !== 'pending_payment' && o.status !== 'cancelled')
    .reduce((s, o) => s + o.budget, 0);

  return (
    <div className="flex h-full gap-0" style={{ minHeight: 'calc(100vh - 120px)' }}>
      {/* Left: Order list */}
      <div className="flex-1 overflow-y-auto space-y-5 pr-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.18em' }}>── QUẢN LÝ ĐƠN HÀNG ({orders.length})</div>
          <div style={{ color: DS.green, fontFamily: DS.mono, fontSize: 13, fontWeight: 700 }}>
            Tổng thu: {fmtVND(totalRevenue)}
          </div>
        </div>

        {/* Alert: New paid orders */}
        {newPaidOrders.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl"
            style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)' }}>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: DS.green }} />
              <div style={{ color: DS.green, fontSize: 13, fontWeight: 700 }}>
                {newPaidOrders.length} đơn hàng mới đã thanh toán — Cần phân công PM ngay!
              </div>
            </div>
            <div className="mt-2 space-y-1">
              {newPaidOrders.map(o => (
                <div key={o.id} className="flex items-center gap-2">
                  <span style={{ color: DS.text4, fontSize: 12 }}>•</span>
                  <button onClick={() => setSelectedOrder(o)}
                    style={{ color: DS.text3, fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                    {o.id} — {o.clientName}: {o.title} ({fmtVND(o.budget)})
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Filter bar */}
        <div className="flex gap-2 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1" style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, minWidth: 160 }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm đơn hàng..."
              style={{ background: 'none', border: 'none', outline: 'none', color: DS.text3, fontSize: 13, width: '100%', fontFamily: DS.body }} />
          </div>
          {(['all', ...Object.keys(STATUS_CFG)] as const).map(s => {
            const cnt = s === 'all' ? orders.length : orders.filter(o => o.status === s).length;
            const sc = s === 'all' ? null : STATUS_CFG[s];
            return (
              <button key={s} onClick={() => setFilterStatus(s)}
                style={{ padding: '6px 12px', borderRadius: 8, background: filterStatus === s ? `${sc?.color ?? DS.blue}20` : 'rgba(255,255,255,0.04)', border: `1px solid ${filterStatus === s ? (sc?.color ?? DS.blue) + '40' : DS.border}`, color: filterStatus === s ? (sc?.color ?? DS.blue) : DS.text4, fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {s === 'all' ? `Tất cả (${cnt})` : `${sc!.label} (${cnt})`}
              </button>
            );
          })}
        </div>

        {/* Orders */}
        <div className="space-y-3">
          {filtered.map((order, i) => {
            const sc = STATUS_CFG[order.status];
            const unreadMsgs = order.messages.filter(m => m.senderId === 'client' && !m.read).length;
            const isSelected = selectedOrder?.id === order.id;

            return (
              <motion.div key={order.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedOrder(isSelected ? null : order)}
                className="p-4 rounded-2xl cursor-pointer"
                style={{ background: isSelected ? `${sc.color}08` : DS.bgCard, border: `1px solid ${isSelected ? sc.color + '40' : DS.border}`, boxShadow: isSelected ? `0 0 20px ${sc.color}10` : 'none', transition: 'all 0.2s' }}
                whileHover={{ borderColor: `${sc.color}40` }}>

                <div className="flex items-center gap-4">
                  {/* Client avatar */}
                  <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0"
                    style={{ border: `1.5px solid ${sc.color}40` }}>
                    <img src={order.clientAvatar} alt={order.clientName} className="w-full h-full object-cover" />
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>{order.invoiceId}</span>
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                        style={{ background: `${sc.color}12`, border: `1px solid ${sc.color}25` }}>
                        <span style={{ color: sc.color }}>{sc.icon}</span>
                        <span style={{ color: sc.color, fontSize: 10, fontFamily: DS.mono }}>{sc.label}</span>
                      </div>
                      {unreadMsgs > 0 && (
                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full"
                          style={{ background: DS.red, boxShadow: `0 0 6px ${DS.red}` }}>
                          <MessageCircle size={9} style={{ color: '#fff' }} />
                          <span style={{ color: '#fff', fontSize: 9, fontFamily: DS.mono }}>{unreadMsgs}</span>
                        </div>
                      )}
                    </div>
                    <div style={{ color: DS.text, fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>
                      {order.title}
                    </div>
                    <div style={{ color: DS.text4, fontSize: 11 }}>
                      {order.clientName} · {order.clientCompany}
                      {order.assignedPM && <span style={{ color: DS.cyan }}> · PM: {order.assignedPM}</span>}
                    </div>
                  </div>

                  {/* Right side */}
                  <div className="text-right flex-shrink-0">
                    <div style={{ color: DS.green, fontFamily: DS.mono, fontSize: 14, fontWeight: 700 }}>
                      {fmtVND(order.budget).replace('₫', '')}
                    </div>
                    <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>{order.createdAt}</div>
                    {order.status !== 'pending_payment' && order.status !== 'done' && (
                      <div className="mt-1.5">
                        <div style={{ width: 70, height: 3, background: DS.border, borderRadius: 2 }}>
                          <div style={{ height: '100%', width: `${order.progress}%`, background: sc.color, borderRadius: 2 }} />
                        </div>
                        <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, marginTop: 1 }}>{order.progress}%</div>
                      </div>
                    )}
                  </div>
                  <ChevronRight size={14} style={{ color: DS.text5, transform: isSelected ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Right: Order detail panel */}
      <AnimatePresence>
        {selectedOrder && (
          <OrderDetailPanel
            key={selectedOrder.id}
            order={orders.find(o => o.id === selectedOrder.id) ?? selectedOrder}
            onClose={() => setSelectedOrder(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
