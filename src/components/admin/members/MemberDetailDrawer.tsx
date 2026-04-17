"use client";

import { motion, AnimatePresence } from "motion/react";
import { DS } from "@/lib/design-tokens";
import { X, Edit2, Info, ArrowRight, Shield, Award, Zap, Clock, CreditCard, ArrowDownRight, ArrowUpRight, Activity } from "lucide-react";
import { RANKS, getRankFromLevel, type RankKey } from "@/lib/rank/ranks";
import type { MemberExt } from "@/app/admin/members/types";
import { STATUS_CFG } from "@/app/admin/members/types";
import { 
  fmtLP, 
  fmtDate, 
  deptLabel, 
  deptColor, 
  capitalize, 
  xpPct 
} from "@/app/admin/members/utils";
import { useEffect } from "react";

export interface MemberDetailDrawerProps {
  isOpen: boolean;
  member: MemberExt | null;
  onClose: () => void;
  onEdit?: (m: MemberExt) => void;
}

export function MemberDetailDrawer({
  isOpen,
  member,
  onClose,
  onEdit,
}: MemberDetailDrawerProps) {
  
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  };

  useEffect(() => {
    if (isOpen) window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  if (!member) return null;

  const m = member;
  const rankKey = getRankFromLevel(m.level ?? 1);
  const cfg = RANKS[rankKey];
  const pct = xpPct(m.currentXp, m.maxXp);

  const skills = m.memberExpertise?.map((e) => e.name) ?? [];
  const roles = m.roles && m.roles.length > 0 ? m.roles : (m.systemRole ? [m.systemRole] : ["member"]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 99990, display: "flex", justifyContent: "flex-end" }}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: "absolute", inset: 0,
              background: "rgba(0, 0, 0, 0.6)",
              backdropFilter: "blur(4px)",
            }}
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            style={{
              width: "100%", maxWidth: 640,
              background: DS.bg, borderLeft: `1px solid ${DS.border}`,
              height: "100vh", display: "flex", flexDirection: "column",
              position: "relative", zIndex: 99991,
              boxShadow: "-10px 0 40px rgba(0,0,0,0.5)",
            }}
          >
            {/* Top Banner & Header */}
            <div style={{
              height: 160, width: "100%",
              background: `linear-gradient(135deg, ${cfg.color}33, ${cfg.color}11)`,
              borderBottom: `1px solid ${DS.border}`,
              position: "relative", flexShrink: 0,
            }}>
              {/* Blur accent */}
              <div style={{
                position: "absolute", top: -40, right: -40, width: 240, height: 240,
                borderRadius: "50%", background: `${cfg.color}22`, filter: "blur(60px)",
              }} />

              {/* Close & Action Buttons */}
              <div style={{ position: "absolute", top: 20, right: 24, display: "flex", gap: 12, zIndex: 10 }}>
                {onEdit && (
                  <button
                    onClick={() => { onClose(); onEdit(m); }}
                    style={{
                      background: DS.bgCard, border: `1px solid ${DS.border}`, color: DS.text,
                      padding: "8px 16px", borderRadius: 12, display: "flex", alignItems: "center", gap: 8,
                      fontFamily: DS.mono, fontSize: 13, cursor: "pointer", transition: "all 0.2s"
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = cfg.color)}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = DS.border)}
                  >
                    <Edit2 size={14} /> Chỉnh sửa
                  </button>
                )}
                <button
                  onClick={onClose}
                  style={{
                    background: "rgba(0,0,0,0.4)", border: "none", color: "#fff", cursor: "pointer",
                    padding: 8, display: "flex", alignItems: "center", borderRadius: "50%",
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Avatar & Rank Floating */}
              <div style={{ position: "absolute", bottom: -40, left: 32, display: "flex", alignItems: "flex-end", gap: 16 }}>
                <div style={{
                  width: 100, height: 100, borderRadius: 24,
                  backgroundColor: DS.bg, border: `4px solid ${DS.bg}`,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                  overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: DS.heading, fontSize: 32, color: cfg.color,
                }}>
                  {m.avatar ? (
                    <img src={m.avatar} alt={m.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : m.name.slice(0, 1).toUpperCase()}
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ 
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "4px 12px", borderRadius: 12, 
                    background: DS.bg, border: `1px solid ${cfg.color}55`,
                    color: cfg.color, fontFamily: DS.mono, fontSize: 13, fontWeight: 600,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                  }}>
                    {cfg.symbol} {cfg.label}
                  </div>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div style={{ flex: 1, overflowY: "auto", padding: "64px 32px 32px" }}>
              
              {/* Identity Header */}
              <div style={{ marginBottom: 32 }}>
                <h2 style={{ fontFamily: DS.heading, fontSize: 24, color: DS.text, margin: 0 }}>{m.name}</h2>
                <div style={{ fontFamily: DS.mono, fontSize: 14, color: DS.text3, marginTop: 4 }}>{m.email}</div>
                
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
                  {/* Status */}
                  <div style={{ 
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "4px 12px", borderRadius: 20,
                    backgroundColor: STATUS_CFG[m.status].color + "11",
                    border: `1px solid ${STATUS_CFG[m.status].color}33`,
                    fontFamily: DS.mono, fontSize: 11, color: STATUS_CFG[m.status].color
                  }}>
                    {STATUS_CFG[m.status].icon} {STATUS_CFG[m.status].label}
                  </div>
                  
                  {/* Department */}
                  <div style={{ 
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "4px 12px", borderRadius: 20,
                    backgroundColor: deptColor(m.team) + "11",
                    border: `1px solid ${deptColor(m.team)}33`,
                    fontFamily: DS.mono, fontSize: 11, color: deptColor(m.team)
                  }}>
                    {deptLabel(m.team)}
                  </div>
                </div>
              </div>

              {/* Progress & Level Section */}
              <div style={{ 
                background: DS.bgCard, borderRadius: 20, border: `1px solid ${DS.border}`, 
                padding: "24px", marginBottom: 32 
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div>
                    <span style={{ fontSize: 12, color: DS.text3, fontFamily: DS.mono, textTransform: "uppercase" }}>Cấp độ</span>
                    <div style={{ fontSize: 24, color: DS.text, fontFamily: DS.heading }}>Level {m.level}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: 12, color: DS.text3, fontFamily: DS.mono, textTransform: "uppercase" }}>Tích lũy</span>
                    <div style={{ fontSize: 16, color: cfg.color, fontFamily: DS.mono }}>{m.currentXp ?? 0} / {m.maxXp ?? 100} XP</div>
                  </div>
                </div>
                
                <div style={{ height: 10, borderRadius: 5, backgroundColor: DS.border, overflow: "hidden", position: "relative" }}>
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    style={{
                      height: "100%", 
                      background: `linear-gradient(90deg, ${cfg.color}88, ${cfg.color})`,
                      borderRadius: 5,
                    }} 
                  />
                </div>
                <div style={{ marginTop: 8, fontSize: 11, color: DS.text4, fontFamily: DS.mono, textAlign: "center" }}>
                  Cần thêm { (m.maxXp ?? 100) - (m.currentXp ?? 0) } XP để thăng hạng tiếp theo
                </div>
              </div>

              {/* Stats Highligts */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 32 }}>
                {[
                  { label: "LP Khả dụng", value: fmtLP(m.availableLp ?? 0), color: DS.amber, icon: <Zap size={14} /> },
                  { label: "LP Tạm khóa", value: fmtLP(m.lockedLp ?? 0), color: DS.text3, icon: <Clock size={14} /> },
                  { label: "Nhiệm vụ", value: String(m.missionsCompleted ?? 0), color: DS.green, icon: <Shield size={14} /> },
                ].map((stat, idx) => (
                  <div key={idx} style={{ 
                    background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: "16px" 
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, color: DS.text3, fontSize: 10, fontFamily: DS.mono, textTransform: "uppercase", marginBottom: 4 }}>
                      {stat.icon} {stat.label}
                    </div>
                    <div style={{ fontSize: 20, color: stat.color, fontFamily: DS.mono, fontWeight: 600 }}>{stat.value}</div>
                  </div>
                ))}
              </div>

              {/* Roles & Permissions */}
              <div style={{ marginBottom: 32 }}>
                <h4 style={{ fontSize: 13, color: DS.text3, fontFamily: DS.mono, textTransform: "uppercase", marginBottom: 12 }}>Phân quyền & Nhóm</h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {roles.map((r, i) => {
                    const roleColor = r === "admin" ? DS.blue : r === "hr" ? "#14B8A6" : r === "project_manager" ? "#EC4899" : DS.text3;
                    return (
                      <div key={i} style={{ 
                        padding: "6px 12px", borderRadius: 8, border: `1px solid ${roleColor}55`,
                        background: roleColor + "11", color: roleColor, fontFamily: DS.mono, fontSize: 12, display: "flex", alignItems: "center", gap: 6
                      }}>
                        <Shield size={12} /> {capitalize(r)}
                      </div>
                    );
                  })}
                  <div style={{ 
                    padding: "6px 12px", borderRadius: 8, border: `1px solid ${DS.blue}55`,
                    background: DS.blue + "11", color: DS.blue, fontFamily: DS.mono, fontSize: 12, display: "flex", alignItems: "center", gap: 6
                  }}>
                    <Award size={12} /> Chức danh: {m.role || "Nhân viên"}
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              {(m.bankName || m.bankAccount) && (
                <div style={{ marginBottom: 32 }}>
                  <h4 style={{ fontSize: 13, color: DS.text3, fontFamily: DS.mono, textTransform: "uppercase", marginBottom: 12 }}>Thông tin thanh toán (Off-System)</h4>
                  <div style={{ 
                    padding: "16px", borderRadius: 12, border: `1px solid ${DS.blue}33`,
                    background: `linear-gradient(135deg, ${DS.bgCard}, ${DS.blue}11)`, display: "flex", alignItems: "center", gap: 16
                  }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: DS.blue + "22", color: DS.blue, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <CreditCard size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, color: DS.text, fontFamily: DS.mono, fontWeight: 600 }}>{m.bankAccount}</div>
                      <div style={{ fontSize: 12, color: DS.text3, fontFamily: DS.mono, marginTop: 4 }}>
                        {m.bankName} {m.bankAccountName ? ` • ${m.bankAccountName}` : ""}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Skills Area */}
              <div style={{ marginBottom: 32 }}>
                <h4 style={{ fontSize: 13, color: DS.text3, fontFamily: DS.mono, textTransform: "uppercase", marginBottom: 12 }}>Kỹ năng sở trường</h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {skills.length > 0 ? skills.map((s, i) => (
                    <div key={i} style={{ 
                      padding: "6px 12px", borderRadius: 20, border: `1px solid ${DS.purple}44`,
                      background: DS.purple + "11", color: DS.purple, fontFamily: DS.mono, fontSize: 12
                    }}>
                      {s}
                    </div>
                  )) : (
                    <div style={{ fontSize: 13, color: DS.text4, fontStyle: "italic" }}>Chưa cập nhật kỹ năng...</div>
                  )}
                </div>
              </div>

              {/* Rank History Timeline */}
              <div>
                <h4 style={{ fontSize: 13, color: DS.text3, fontFamily: DS.mono, textTransform: "uppercase", marginBottom: 16 }}>Lịch sử thăng hạng</h4>
                {m.rankHistory && m.rankHistory.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {m.rankHistory.map((h, i) => {
                      const fromR = RANKS[h.from as RankKey] || RANKS.iron;
                      const toR = RANKS[h.to as RankKey] || RANKS.iron;
                      return (
                        <div key={i} style={{ 
                          display: "flex", alignItems: "center", gap: 16, padding: "12px", 
                          background: DS.bgCard, borderRadius: 12, border: `1px solid ${DS.border}` 
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <span style={{ fontSize: 16 }}>{fromR.symbol}</span>
                            <ArrowRight size={12} color={DS.text4} />
                            <span style={{ fontSize: 16 }}>{toR.symbol}</span>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, color: DS.text, fontFamily: DS.mono }}>{h.reason}</div>
                            <div style={{ fontSize: 10, color: DS.text4, fontFamily: DS.mono, marginTop: 2 }}>{fmtDate(h.date)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ 
                    padding: "20px", textAlign: "center", background: DS.bgCard, 
                    borderRadius: 12, border: `1px dotted ${DS.border}`, color: DS.text4, fontSize: 13 
                  }}>
                    Chưa có lịch sử thăng hạng
                  </div>
                )}
              </div>

              {/* LP Transactions Timeline */}
              <div style={{ marginTop: 32 }}>
                <h4 style={{ fontSize: 13, color: DS.text3, fontFamily: DS.mono, textTransform: "uppercase", marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
                  <Activity size={14} /> Lịch sử giao dịch LP
                </h4>
                {m.lpTransactions && m.lpTransactions.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {m.lpTransactions.map((tx: any, i: number) => {
                      const isPositive = tx.amount > 0;
                      const txColor = isPositive ? DS.green : DS.pink;
                      return (
                        <div key={tx.id || i} style={{ 
                          display: "flex", alignItems: "center", gap: 16, padding: "12px", 
                          background: DS.bgCard, borderRadius: 12, border: `1px solid ${DS.border}` 
                        }}>
                          <div style={{ padding: 8, borderRadius: "50%", background: txColor + "11", color: txColor }}>
                            {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, color: DS.text, fontFamily: DS.mono }}>{tx.description || tx.source || "Giao dịch LP"}</div>
                            <div style={{ fontSize: 10, color: DS.text4, fontFamily: DS.mono, marginTop: 4 }}>
                              {fmtDate(tx.createdAt)} • Trạng thái: {tx.status === "approved" ? "Hoàn tất" : tx.status}
                            </div>
                          </div>
                          <div style={{ fontSize: 14, fontFamily: DS.mono, color: txColor, fontWeight: 600 }}>
                            {isPositive ? "+" : ""}{fmtLP(tx.amount)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ 
                    padding: "20px", textAlign: "center", background: DS.bgCard, 
                    borderRadius: 12, border: `1px dotted ${DS.border}`, color: DS.text4, fontSize: 13 
                  }}>
                    Chưa có giao dịch LP nào
                  </div>
                )}
              </div>
            </div>
            
            {/* Footer */}
            <div style={{ 
              padding: "24px 32px", borderTop: `1px solid ${DS.border}`, 
              background: DS.bgCard, display: "flex", justifyContent: "space-between", alignItems: "center"
            }}>
              <div style={{ fontSize: 12, color: DS.text4, fontFamily: DS.mono }}>
                Tham gia: {m.joinedDate ? fmtDate(m.joinedDate) : "—"}
              </div>
              <button
                onClick={onClose}
                style={{
                  background: "transparent", border: "none", color: DS.blue,
                  fontFamily: DS.heading, fontSize: 14, cursor: "pointer", fontWeight: 600
                }}
              >
                Đóng hồ sơ
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
