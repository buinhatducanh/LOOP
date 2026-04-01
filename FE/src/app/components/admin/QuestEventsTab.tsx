/**
 * QuestEventsTab — Admin management for Quests & Company Events
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Star, Calendar, Users, Zap, Plus, Edit3, Trash2, Check, X,
  Clock, Trophy, Target, Gift, ChevronDown, Flame,
} from 'lucide-react';
import { DS, GRD } from '../layout/ds';
import { useAuthStore, type Quest, type CompanyEvent } from '../../store/authStore';

const rgba = (hex: string, a: number) => {
  const h = hex.replace('#', '');
  return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`;
};

const FREQ_LABELS: Record<string, { label: string; color: string }> = {
  daily: { label: 'Hằng ngày', color: '#F59E0B' },
  weekly: { label: 'Hằng tuần', color: DS.blue },
  monthly: { label: 'Hằng tháng', color: DS.purple },
  one_time: { label: 'Một lần', color: DS.cyan },
  event: { label: 'Sự kiện', color: DS.green },
};

const CAT_LABELS: Record<string, string> = {
  engagement: '🔄 Tương tác', project: '📋 Dự án', social: '🤝 Xã hội',
  learning: '📖 Học tập', achievement: '🏆 Thành tựu',
};

export function QuestEventsTab() {
  const { quests, events, addQuest, updateQuest, deleteQuest, addEvent, updateEvent, deleteEvent } = useAuthStore();
  const [tab, setTab] = useState<'quests' | 'events'>('quests');
  const [editQuest, setEditQuest] = useState<Quest | null>(null);

  const questStats = {
    total: quests.length,
    active: quests.filter(q => q.status === 'available' || q.status === 'in_progress').length,
    completed: quests.filter(q => q.status === 'completed').length,
    totalLP: quests.reduce((s, q) => s + q.lpReward, 0),
  };

  return (
    <div className="space-y-4">
      {/* Tab switch */}
      <div className="flex items-center gap-2">
        {[
          { id: 'quests' as const, label: 'Nhiệm vụ', icon: <Target size={14} />, count: quests.length },
          { id: 'events' as const, label: 'Sự kiện', icon: <Calendar size={14} />, count: events.length },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-150"
            style={{
              background: tab === t.id ? rgba(DS.blue, 0.1) : 'transparent',
              border: tab === t.id ? `1.5px solid ${rgba(DS.blue, 0.3)}` : `1px solid ${DS.border}`,
              color: tab === t.id ? DS.blue : DS.text4, cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}>
            {t.icon} {t.label}
            <span style={{ fontSize: 10, fontFamily: DS.mono, background: rgba(tab === t.id ? DS.blue : '#FFFFFF', 0.1), padding: '1px 6px', borderRadius: 5 }}>{t.count}</span>
          </button>
        ))}
      </div>

      {tab === 'quests' ? (
        <div className="space-y-4">
          {/* Quest stats */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            {[
              { label: 'Tổng nhiệm vụ', value: questStats.total, color: DS.blue, icon: <Target size={16} /> },
              { label: 'Đang hoạt động', value: questStats.active, color: DS.green, icon: <Flame size={16} /> },
              { label: 'Đã hoàn thành', value: questStats.completed, color: DS.purple, icon: <Trophy size={16} /> },
              { label: 'Tổng LP phát', value: `${(questStats.totalLP / 1000).toFixed(1)}K`, color: DS.amber, icon: <Zap size={16} /> },
            ].map(s => (
              <div key={s.label} className="p-4 rounded-2xl" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: rgba(s.color, 0.12) }}>
                  <span style={{ color: s.color }}>{s.icon}</span>
                </div>
                <div style={{ color: s.color, fontFamily: DS.heading, fontSize: 20, fontWeight: 700 }}>{s.value}</div>
                <div style={{ color: DS.text4, fontSize: 11 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Quest list by frequency */}
          {(['daily', 'weekly', 'monthly', 'one_time'] as const).map(freq => {
            const items = quests.filter(q => q.frequency === freq);
            if (!items.length) return null;
            const fl = FREQ_LABELS[freq];
            return (
              <div key={freq}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full" style={{ background: fl.color }} />
                  <span style={{ color: fl.color, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.12em' }}>{fl.label.toUpperCase()} ({items.length})</span>
                </div>
                <div className="space-y-2">
                  {items.map(q => (
                    <motion.div key={q.id} className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}
                      initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: rgba(q.color, 0.12), fontSize: 18 }}>
                        {q.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span style={{ color: DS.text, fontSize: 13, fontWeight: 600 }}>{q.title}</span>
                          <span className="px-1.5 py-0.5 rounded" style={{ background: rgba(q.color, 0.1), color: q.color, fontSize: 8, fontFamily: DS.mono }}>
                            {q.status === 'completed' ? '✓ XONG' : q.status === 'in_progress' ? `${q.progress}/${q.target}` : 'AVAILABLE'}
                          </span>
                        </div>
                        <div style={{ color: DS.text4, fontSize: 11 }}>{q.description}</div>
                        <div className="flex items-center gap-3 mt-1">
                          <span style={{ color: DS.amber, fontSize: 10, fontFamily: DS.mono }}>+{q.lpReward} LP</span>
                          <span style={{ color: DS.cyan, fontSize: 10, fontFamily: DS.mono }}>+{q.xpReward} XP</span>
                          <span style={{ color: DS.text5, fontSize: 9 }}>{CAT_LABELS[q.category]}</span>
                          <span style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono }}>Roles: {q.forRoles.join(', ')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => deleteQuest(q.id)} style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', color: DS.text5 }}
                          onMouseEnter={e => { e.currentTarget.style.color = DS.red; }} onMouseLeave={e => { e.currentTarget.style.color = DS.text5; }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Events */
        <div className="space-y-4">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {events.map(ev => (
              <motion.div key={ev.id} className="rounded-2xl overflow-hidden"
                style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                {/* Header */}
                <div className="p-5 relative" style={{ background: `linear-gradient(135deg, ${rgba(ev.color, 0.12)}, transparent)` }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span style={{ fontSize: 24 }}>{ev.icon}</span>
                        <div>
                          <div style={{ color: DS.text, fontSize: 15, fontWeight: 700 }}>{ev.title}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 rounded" style={{ background: ev.active ? rgba(DS.green, 0.12) : rgba(DS.text4, 0.1), color: ev.active ? DS.green : DS.text4, fontSize: 9, fontFamily: DS.mono, fontWeight: 700 }}>
                              {ev.active ? '● ACTIVE' : '○ SẮP TỚI'}
                            </span>
                            <span className="px-1.5 py-0.5 rounded" style={{ background: rgba(ev.color, 0.1), color: ev.color, fontSize: 9, fontFamily: DS.mono }}>
                              LP x{ev.lpBonus}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => updateEvent(ev.id, { active: !ev.active })}
                      className="px-3 py-1.5 rounded-lg"
                      style={{ background: rgba(ev.active ? DS.red : DS.green, 0.08), border: `1px solid ${rgba(ev.active ? DS.red : DS.green, 0.2)}`, color: ev.active ? DS.red : DS.green, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                      {ev.active ? 'Kết thúc' : 'Kích hoạt'}
                    </button>
                  </div>
                  <div style={{ color: DS.text3, fontSize: 12, lineHeight: 1.6, marginTop: 8 }}>{ev.description}</div>
                </div>

                <div className="p-5 space-y-3">
                  {/* Dates */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} style={{ color: DS.text5 }} />
                      <span style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono }}>{ev.startDate} → {ev.endDate}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users size={12} style={{ color: DS.text5 }} />
                      <span style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono }}>{ev.participants}/{ev.maxParticipants}</span>
                    </div>
                  </div>

                  {/* Participation bar */}
                  <div className="rounded-full overflow-hidden" style={{ height: 4, background: DS.border }}>
                    <motion.div style={{ height: '100%', borderRadius: 4, background: ev.color }}
                      initial={{ width: '0%' }} animate={{ width: `${(ev.participants / ev.maxParticipants) * 100}%` }}
                      transition={{ duration: 1 }} />
                  </div>

                  {/* Rewards */}
                  <div>
                    <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: '0.12em', marginBottom: 6 }}>PHẦN THƯỞNG</div>
                    <div className="flex gap-2 flex-wrap">
                      {ev.rewards.map(r => (
                        <div key={r.rank} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                          style={{ background: rgba(ev.color, 0.06), border: `1px solid ${rgba(ev.color, 0.15)}` }}>
                          <Trophy size={10} style={{ color: ev.color }} />
                          <span style={{ color: DS.text3, fontSize: 10 }}>{r.label}</span>
                          <span style={{ color: DS.amber, fontSize: 10, fontFamily: DS.mono, fontWeight: 700 }}>+{r.lp.toLocaleString()} LP</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <button style={{ flex: 1, background: rgba(ev.color, 0.08), border: `1px solid ${rgba(ev.color, 0.2)}`, borderRadius: 10, padding: '8px 0', cursor: 'pointer', color: ev.color, fontSize: 12, fontWeight: 600 }}>
                      <Edit3 size={12} className="inline mr-1" /> Chỉnh sửa
                    </button>
                    <button onClick={() => deleteEvent(ev.id)}
                      style={{ padding: '8px 14px', borderRadius: 10, background: rgba(DS.red, 0.06), border: `1px solid ${rgba(DS.red, 0.15)}`, cursor: 'pointer', color: DS.red }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
