/**
 * QuestsTab — Customer/Staff quest board with daily check-in & events
 */
import { useState } from 'react';
import { motion } from 'motion/react';
import { Zap, Flame, Trophy, Calendar, Check, Star, Gift, Clock, Target, Users } from 'lucide-react';
import { DS, GRD } from '../layout/ds';
import { useAuthStore, type Quest } from '../../store/authStore';

const rgba = (hex: string, a: number) => {
  const h = hex.replace('#', '');
  return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`;
};

export function QuestsTab() {
  const { user, quests, events, dailyStreak, lastCheckIn, checkIn, completeQuest, getActiveEvents, getQuestsForRole } = useAuthStore();
  const [tab, setTab] = useState<'daily' | 'weekly' | 'achievements' | 'events'>('daily');

  const role = user?.role ?? 'client';
  const myQuests = getQuestsForRole(role);
  const activeEvents = getActiveEvents();
  const todayCheckedIn = lastCheckIn === new Date().toDateString();

  const dailyQuests = myQuests.filter(q => q.frequency === 'daily');
  const weeklyQuests = myQuests.filter(q => q.frequency === 'weekly' || q.frequency === 'monthly');
  const achievements = myQuests.filter(q => q.frequency === 'one_time');

  const completedToday = dailyQuests.filter(q => q.status === 'completed').length;
  const totalDailyLP = dailyQuests.reduce((s, q) => s + q.lpReward, 0);

  return (
    <div className="space-y-6">
      {/* Header with check-in */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.18em' }}>── NHIỆM VỤ & SỰ KIỆN</div>
          <div style={{ color: DS.text4, fontSize: 12, marginTop: 4 }}>Hoàn thành nhiệm vụ để nhận LP thưởng</div>
        </div>

        {/* Daily check-in button */}
        <motion.button
          onClick={() => !todayCheckedIn && checkIn()}
          className="flex items-center gap-3 px-5 py-3 rounded-xl"
          style={{
            background: todayCheckedIn ? rgba(DS.green, 0.08) : GRD.primary,
            border: todayCheckedIn ? `1px solid ${rgba(DS.green, 0.2)}` : 'none',
            color: todayCheckedIn ? DS.green : '#fff',
            cursor: todayCheckedIn ? 'default' : 'pointer',
            boxShadow: todayCheckedIn ? 'none' : `0 0 20px ${rgba(DS.purple, 0.3)}`,
            fontSize: 13, fontWeight: 700,
          }}
          whileHover={todayCheckedIn ? {} : { scale: 1.03 }}
          whileTap={todayCheckedIn ? {} : { scale: 0.97 }}
        >
          {todayCheckedIn ? <Check size={16} /> : <Flame size={16} />}
          {todayCheckedIn ? 'Đã điểm danh!' : 'Điểm danh hôm nay'}
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: rgba('#FFFFFF', todayCheckedIn ? 0 : 0.15) }}>
            <Flame size={11} style={{ color: todayCheckedIn ? DS.amber : '#FFD700' }} />
            <span style={{ fontSize: 11, fontFamily: DS.mono }}>{dailyStreak} ngày</span>
          </div>
        </motion.button>
      </div>

      {/* Streak & Progress */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
          <Flame size={18} style={{ color: '#F59E0B', marginBottom: 8 }} />
          <div style={{ color: '#F59E0B', fontFamily: DS.heading, fontSize: 22, fontWeight: 700 }}>{dailyStreak}</div>
          <div style={{ color: DS.text4, fontSize: 11 }}>Streak liên tục</div>
        </div>
        <div className="p-4 rounded-2xl" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
          <Target size={18} style={{ color: DS.blue, marginBottom: 8 }} />
          <div style={{ color: DS.blue, fontFamily: DS.heading, fontSize: 22, fontWeight: 700 }}>{completedToday}/{dailyQuests.length}</div>
          <div style={{ color: DS.text4, fontSize: 11 }}>Nhiệm vụ hôm nay</div>
        </div>
        <div className="p-4 rounded-2xl" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
          <Zap size={18} style={{ color: DS.amber, marginBottom: 8 }} />
          <div style={{ color: DS.amber, fontFamily: DS.heading, fontSize: 22, fontWeight: 700 }}>{totalDailyLP}</div>
          <div style={{ color: DS.text4, fontSize: 11 }}>LP có thể nhận</div>
        </div>
        <div className="p-4 rounded-2xl" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
          <Trophy size={18} style={{ color: DS.purple, marginBottom: 8 }} />
          <div style={{ color: DS.purple, fontFamily: DS.heading, fontSize: 22, fontWeight: 700 }}>{achievements.filter(a => a.status === 'completed').length}/{achievements.length}</div>
          <div style={{ color: DS.text4, fontSize: 11 }}>Thành tựu</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {[
          { id: 'daily' as const, label: 'Hằng ngày', count: dailyQuests.length },
          { id: 'weekly' as const, label: 'Tuần/Tháng', count: weeklyQuests.length },
          { id: 'achievements' as const, label: 'Thành tựu', count: achievements.length },
          { id: 'events' as const, label: 'Sự kiện', count: activeEvents.length },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="px-3 py-2 rounded-lg whitespace-nowrap transition-all duration-150"
            style={{
              background: tab === t.id ? rgba(DS.blue, 0.1) : 'transparent',
              border: tab === t.id ? `1px solid ${rgba(DS.blue, 0.2)}` : '1px solid transparent',
              color: tab === t.id ? DS.blue : DS.text4, cursor: 'pointer', fontSize: 12, fontWeight: 600,
            }}>
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {/* Quest list */}
      {tab !== 'events' ? (
        <div className="space-y-2">
          {(tab === 'daily' ? dailyQuests : tab === 'weekly' ? weeklyQuests : achievements).map((q, i) => {
            const done = q.status === 'completed';
            const pct = (q.progress / q.target) * 100;
            return (
              <motion.div key={q.id} className="flex items-center gap-4 p-4 rounded-xl"
                style={{ background: done ? rgba(DS.green, 0.03) : DS.bgCard, border: `1px solid ${done ? rgba(DS.green, 0.15) : DS.border}`, opacity: done ? 0.7 : 1 }}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: done ? 0.7 : 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: rgba(q.color, done ? 0.05 : 0.1), fontSize: 20 }}>
                  {done ? <Check size={18} style={{ color: DS.green }} /> : q.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span style={{ color: done ? DS.text4 : DS.text, fontSize: 13, fontWeight: 600, textDecoration: done ? 'line-through' : 'none' }}>{q.title}</span>
                  </div>
                  <div style={{ color: DS.text5, fontSize: 11, marginBottom: 4 }}>{q.description}</div>
                  {/* Progress bar */}
                  {q.target > 1 && (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 rounded-full overflow-hidden" style={{ height: 4, background: DS.border }}>
                        <motion.div style={{ height: '100%', borderRadius: 4, background: done ? DS.green : q.color }}
                          initial={{ width: '0%' }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} />
                      </div>
                      <span style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, flexShrink: 0 }}>{q.progress}/{q.target}</span>
                    </div>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="flex items-center gap-1 mb-1">
                    <Zap size={11} style={{ color: DS.amber }} />
                    <span style={{ color: DS.amber, fontSize: 12, fontFamily: DS.mono, fontWeight: 700 }}>+{q.lpReward}</span>
                  </div>
                  <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono }}>+{q.xpReward} XP</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* Events */
        <div className="space-y-4">
          {activeEvents.length === 0 ? (
            <div className="text-center py-12 rounded-2xl" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
              <Calendar size={40} style={{ color: DS.text5, margin: '0 auto 12px' }} />
              <div style={{ color: DS.text3, fontSize: 14, fontWeight: 600 }}>Chưa có sự kiện nào</div>
              <div style={{ color: DS.text5, fontSize: 12 }}>Các sự kiện sẽ xuất hiện khi admin kích hoạt</div>
            </div>
          ) : activeEvents.map(ev => (
            <motion.div key={ev.id} className="rounded-2xl overflow-hidden"
              style={{ background: DS.bgCard, border: `1px solid ${rgba(ev.color, 0.2)}` }}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <div className="p-5" style={{ background: `linear-gradient(135deg, ${rgba(ev.color, 0.1)}, transparent)` }}>
                <div className="flex items-center gap-3 mb-3">
                  <span style={{ fontSize: 32 }}>{ev.icon}</span>
                  <div>
                    <div style={{ color: DS.text, fontSize: 16, fontWeight: 700 }}>{ev.title}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 rounded" style={{ background: rgba(DS.green, 0.12), color: DS.green, fontSize: 9, fontFamily: DS.mono, fontWeight: 700 }}>● LIVE</span>
                      <span className="px-2 py-0.5 rounded" style={{ background: rgba(ev.color, 0.12), color: ev.color, fontSize: 9, fontFamily: DS.mono }}>LP x{ev.lpBonus}</span>
                    </div>
                  </div>
                </div>
                <div style={{ color: DS.text3, fontSize: 13, lineHeight: 1.6 }}>{ev.description}</div>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="flex items-center gap-1.5" style={{ color: DS.text4, fontSize: 11 }}>
                    <Calendar size={12} /> {ev.startDate} → {ev.endDate}
                  </span>
                  <span className="flex items-center gap-1.5" style={{ color: DS.text4, fontSize: 11 }}>
                    <Users size={12} /> {ev.participants}/{ev.maxParticipants} tham gia
                  </span>
                </div>
                <div className="rounded-full overflow-hidden" style={{ height: 5, background: DS.border }}>
                  <motion.div style={{ height: '100%', borderRadius: 4, background: `linear-gradient(90deg, ${ev.color}, ${rgba(ev.color, 0.6)})` }}
                    initial={{ width: '0%' }} animate={{ width: `${(ev.participants / ev.maxParticipants) * 100}%` }} transition={{ duration: 1 }} />
                </div>
                {/* Rewards */}
                <div className="flex gap-2 flex-wrap">
                  {ev.rewards.map(r => (
                    <div key={r.rank} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                      style={{ background: rgba(ev.color, 0.06), border: `1px solid ${rgba(ev.color, 0.12)}` }}>
                      <Trophy size={11} style={{ color: ev.color }} />
                      <span style={{ color: DS.text3, fontSize: 11 }}>{r.label}:</span>
                      <span style={{ color: DS.amber, fontSize: 11, fontFamily: DS.mono, fontWeight: 700 }}>+{r.lp.toLocaleString()} LP</span>
                    </div>
                  ))}
                </div>
                <button className="w-full py-2.5 rounded-xl"
                  style={{ background: `linear-gradient(135deg, ${ev.color}, ${rgba(ev.color, 0.7)})`, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, boxShadow: `0 0 16px ${rgba(ev.color, 0.3)}` }}>
                  <Gift size={14} className="inline mr-2" /> Tham gia sự kiện
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
