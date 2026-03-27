/**
 * ChatWidget — Floating chat bubble for quick access to project conversations
 * Shows unread count, recent messages, quick reply
 */
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, ChevronDown, ExternalLink } from 'lucide-react';
import { Link } from 'react-router';
import { DS, GRD } from '../layout/ds';
import { useLoopStore } from '../../store/loopStore';

const rgba = (hex: string, a: number) => {
  const h = hex.replace('#', '');
  return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`;
};

export function ChatWidget({ isAdmin = false }: { isAdmin?: boolean }) {
  const [open, setOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { orders, sendClientMessage, sendAdminMessage } = useLoopStore();

  // Orders with messages
  const activeChats = orders.filter(o => o.messages.length > 0 || o.status !== 'cancelled');
  const unreadTotal = activeChats.reduce((s, o) => {
    return s + o.messages.filter(m => !m.read && m.senderId !== (isAdmin ? 'admin' : 'client')).length;
  }, 0);

  const currentOrder = selectedOrder ? orders.find(o => o.id === selectedOrder) : null;

  // Auto scroll to bottom
  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [open, selectedOrder, currentOrder?.messages.length]);

  // Focus input when order selected
  useEffect(() => {
    if (selectedOrder && open && inputRef.current) inputRef.current.focus();
  }, [selectedOrder, open]);

  const handleSend = () => {
    if (!msg.trim() || !selectedOrder) return;
    if (isAdmin) sendAdminMessage(selectedOrder, msg.trim());
    else sendClientMessage(selectedOrder, msg.trim());
    setMsg('');
  };

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 45 }}>
      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={chatRef}
            className="rounded-2xl overflow-hidden"
            style={{
              position: 'absolute', bottom: 60, right: 0,
              width: 360, maxHeight: 520,
              background: DS.bgCard, border: `1px solid ${rgba(DS.blue, 0.15)}`,
              boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)',
              display: 'flex', flexDirection: 'column',
            }}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', damping: 24, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3" style={{ background: GRD.primary, flexShrink: 0 }}>
              <div className="flex items-center gap-2">
                <MessageSquare size={16} style={{ color: '#fff' }} />
                <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>
                  {selectedOrder ? currentOrder?.title?.slice(0, 25) + '...' : 'Tin nhắn dự án'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {selectedOrder && (
                  <button onClick={() => setSelectedOrder(null)}
                    style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', color: '#fff' }}>
                    <ChevronDown size={14} />
                  </button>
                )}
                <button onClick={() => setOpen(false)}
                  style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', color: '#fff' }}>
                  <X size={14} />
                </button>
              </div>
            </div>

            {!selectedOrder ? (
              /* Chat list */
              <div className="flex-1 overflow-auto" style={{ maxHeight: 400 }}>
                {activeChats.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <MessageSquare size={32} style={{ color: DS.text5, margin: '0 auto 8px' }} />
                    <div style={{ color: DS.text3, fontSize: 13 }}>Chưa có cuộc hội thoại nào</div>
                  </div>
                ) : activeChats.map(o => {
                  const lastMsg = o.messages[o.messages.length - 1];
                  const unread = o.messages.filter(m => !m.read && m.senderId !== (isAdmin ? 'admin' : 'client')).length;
                  return (
                    <button key={o.id} onClick={() => setSelectedOrder(o.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-100"
                      style={{ background: 'transparent', border: 'none', borderBottom: `1px solid ${rgba(DS.border, 0.5)}`, cursor: 'pointer' }}
                      onMouseEnter={e => { e.currentTarget.style.background = rgba('#FFFFFF', 0.02); }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0" style={{ border: `1.5px solid ${rgba(DS.blue, 0.25)}` }}>
                        <img src={o.clientAvatar} alt={o.clientName} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span style={{ color: DS.text, fontSize: 12, fontWeight: unread > 0 ? 700 : 500 }}>
                            {isAdmin ? o.clientName : (o.assignedPM ?? 'LOOP Team')}
                          </span>
                          {lastMsg && <span style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, flexShrink: 0 }}>{lastMsg.timestamp.split(' ')[0]}</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span style={{ color: DS.text4, fontSize: 11, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {lastMsg ? (lastMsg.type === 'demo_link' ? '🔗 Demo link' : lastMsg.content.slice(0, 50)) : 'Chưa có tin nhắn'}
                          </span>
                          {unread > 0 && (
                            <span style={{ background: DS.red, color: '#fff', fontSize: 8, fontFamily: DS.mono, borderRadius: 8, padding: '1px 5px', minWidth: 16, textAlign: 'center', flexShrink: 0, boxShadow: `0 0 6px ${DS.red}` }}>
                              {unread}
                            </span>
                          )}
                        </div>
                        <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, marginTop: 2 }}>{o.id}</div>
                      </div>
                    </button>
                  );
                })}

                {/* Link to full dashboard */}
                <Link to={isAdmin ? '/admin' : '/khach-hang'}
                  className="flex items-center justify-center gap-2 py-3 m-2 rounded-xl"
                  style={{ background: rgba(DS.blue, 0.04), border: `1px solid ${rgba(DS.blue, 0.1)}`, color: DS.blue, fontSize: 11, textDecoration: 'none' }}>
                  <ExternalLink size={12} /> Mở đầy đủ trong Dashboard
                </Link>
              </div>
            ) : (
              /* Chat messages */
              <>
                <div className="flex-1 overflow-auto px-3 py-3 space-y-2" style={{ maxHeight: 340 }}>
                  {currentOrder?.messages.map(m => {
                    const isMe = m.senderId === (isAdmin ? 'admin' : 'client');
                    return (
                      <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className="max-w-[80%] rounded-xl px-3 py-2" style={{
                          background: isMe ? rgba(DS.blue, 0.12) : rgba('#FFFFFF', 0.04),
                          border: `1px solid ${isMe ? rgba(DS.blue, 0.2) : rgba('#FFFFFF', 0.06)}`,
                        }}>
                          <div style={{ color: isMe ? DS.blue : DS.text3, fontSize: 9, fontFamily: DS.mono, marginBottom: 2 }}>
                            {m.senderName}
                          </div>
                          {m.type === 'demo_link' ? (
                            <div>
                              <div style={{ color: DS.text3, fontSize: 12 }}>{m.content}</div>
                              <a href={m.demoUrl} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1 mt-1 px-2 py-1 rounded"
                                style={{ background: rgba(DS.green, 0.08), color: DS.green, fontSize: 10, textDecoration: 'none' }}>
                                <ExternalLink size={10} /> Xem demo
                              </a>
                            </div>
                          ) : m.type === 'system' ? (
                            <div style={{ color: DS.text4, fontSize: 11, fontStyle: 'italic' }}>{m.content}</div>
                          ) : (
                            <div style={{ color: isMe ? DS.text : DS.text3, fontSize: 12, lineHeight: 1.5 }}>{m.content}</div>
                          )}
                          <div style={{ color: DS.text5, fontSize: 8, fontFamily: DS.mono, marginTop: 3, textAlign: 'right' }}>
                            {m.timestamp.split(' ').slice(-1)[0]}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="px-3 pb-3 flex items-center gap-2" style={{ flexShrink: 0 }}>
                  <input
                    ref={inputRef}
                    value={msg}
                    onChange={e => setMsg(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
                    placeholder="Nhập tin nhắn..."
                    style={{
                      flex: 1, background: rgba('#FFFFFF', 0.04), border: `1px solid ${DS.border}`,
                      borderRadius: 10, padding: '8px 12px', color: DS.text, fontSize: 12,
                      outline: 'none', fontFamily: DS.body,
                    }}
                  />
                  <button onClick={handleSend}
                    style={{
                      width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: msg.trim() ? GRD.primary : rgba('#FFFFFF', 0.04),
                      border: 'none', cursor: msg.trim() ? 'pointer' : 'default',
                      color: msg.trim() ? '#fff' : DS.text5,
                    }}>
                    <Send size={14} />
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating button */}
      <motion.button
        onClick={() => setOpen(!open)}
        className="w-14 h-14 rounded-full flex items-center justify-center relative"
        style={{
          background: GRD.primary, border: 'none', cursor: 'pointer',
          boxShadow: `0 4px 24px ${rgba(DS.purple, 0.4)}, 0 0 0 4px ${rgba(DS.purple, 0.08)}`,
        }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
      >
        {open ? <X size={22} style={{ color: '#fff' }} /> : <MessageSquare size={22} style={{ color: '#fff' }} />}

        {/* Unread badge */}
        {unreadTotal > 0 && !open && (
          <motion.div
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: DS.red, boxShadow: `0 0 8px ${DS.red}` }}
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <span style={{ color: '#fff', fontSize: 9, fontFamily: DS.mono, fontWeight: 700 }}>{unreadTotal}</span>
          </motion.div>
        )}
      </motion.button>
    </div>
  );
}
