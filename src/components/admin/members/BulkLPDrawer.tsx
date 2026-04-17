"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { DS } from "@/lib/design-tokens";
import { X, Check, ArrowUpRight, ArrowDownRight, Info, Zap, Users } from "lucide-react";
import type { MemberExt } from "@/app/admin/members/types";

interface BulkLPDrawerProps {
  isOpen: boolean;
  members: MemberExt[];
  onClose: () => void;
  onSubmit: (members: MemberExt[], amount: number, description: string) => void;
  isMutating: boolean;
}

export function BulkLPDrawer({
  isOpen,
  members,
  onClose,
  onSubmit,
  isMutating,
}: BulkLPDrawerProps) {
  const [mode, setMode] = useState<"award" | "deduct">("award");
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const PRESETS = [500, 1000, 2000, 5000];

  useEffect(() => {
    if (isOpen) {
      setAmount("");
      setDescription("");
      setError("");
      setMode("award");
    }
  }, [isOpen]);

  if (members.length === 0) return null;

  const num = parseInt(amount) || 0;
  const totalImpact = num * members.length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!num || num <= 0) {
      setError("Vui lòng nhập số LP hợp lệ");
      return;
    }
    
    onSubmit(
      members,
      mode === "award" ? num : -num,
      description.trim() || `Điều chỉnh LP hàng loạt (${mode}) cho ${members.length} thành viên`
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: "fixed", inset: 0,
              backgroundColor: "rgba(0,0,0,0.4)",
              backdropFilter: "blur(4px)",
              zIndex: 1000,
            }}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            style={{
              position: "fixed", top: 0, right: 0, bottom: 0,
              width: "100%", maxWidth: 420,
              backgroundColor: DS.bgCard,
              borderLeft: `1px solid ${DS.border}`,
              boxShadow: "-10px 0 30px rgba(0,0,0,0.2)",
              zIndex: 1001,
              display: "flex", flexDirection: "column",
            }}
          >
            {/* Header */}
            <div style={{ padding: "24px", borderBottom: `1px solid ${DS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontFamily: DS.heading, color: DS.text }}>Điều chỉnh LP hàng loạt</h2>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                  <Users size={14} color={DS.blue} />
                  <span style={{ fontSize: 13, color: DS.blue, fontWeight: 600 }}>{members.length} thành viên</span>
                </div>
              </div>
              <button onClick={onClose} style={{ background: "transparent", border: "none", color: DS.text3, cursor: "pointer", padding: 8 }}>
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                
                {/* Selected Members Summary */}
                <div style={{ display: "flex", gap: -8, overflowX: "auto", padding: "4px 0", paddingLeft: 8 }}>
                  {members.map((m, i) => (
                    <div 
                      key={m.id} 
                      title={m.name}
                      style={{ 
                        width: 32, height: 32, borderRadius: "50%", 
                        border: `2px solid ${DS.bgCard}`,
                        marginLeft: i === 0 ? 0 : -12,
                        backgroundColor: DS.bg,
                        overflow: "hidden",
                        flexShrink: 0,
                        zIndex: 10 - i,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
                      }}
                    >
                      {m.avatar ? <img src={m.avatar} alt={m.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: DS.text3 }}>
                          {m.name.slice(0, 1)}
                        </div>
                      )}
                    </div>
                  ))}
                  {members.length > 8 && (
                    <div style={{ width: 32, height: 32, borderRadius: "50%", border: `2px solid ${DS.bgCard}`, marginLeft: -12, backgroundColor: DS.border, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: DS.text3, zIndex: 0 }}>
                      +{members.length - 8}
                    </div>
                  )}
                </div>

                {/* Mode Selector */}
                <div style={{ display: "flex", background: DS.bg, padding: "4px", borderRadius: 12, border: `1px solid ${DS.border}` }}>
                  {[
                    { id: "award", label: "Thưởng", color: DS.green, icon: <ArrowUpRight size={14} /> },
                    { id: "deduct", label: "Trừ", color: DS.red, icon: <ArrowDownRight size={14} /> }
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      type="button"
                      onClick={() => { setMode(btn.id as any); setAmount(""); }}
                      style={{
                        flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        padding: "10px", borderRadius: 8, border: "none",
                        backgroundColor: mode === btn.id ? btn.color : "transparent",
                        color: mode === btn.id ? "#fff" : DS.text3,
                        fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
                      }}
                    >
                      {btn.icon}
                      {btn.label}
                    </button>
                  ))}
                </div>

                {/* Amount Input */}
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontSize: 12, fontFamily: DS.mono, color: DS.text3, textTransform: "uppercase" }}>Số LP mỗi người</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0"
                      style={{
                        width: "100%", padding: "16px", borderRadius: 12,
                        backgroundColor: DS.bg, border: `1px solid ${DS.border}`,
                        color: mode === "award" ? DS.green : DS.red,
                        fontSize: 24, fontWeight: 700, fontFamily: DS.mono,
                        outline: "none", textAlign: "center"
                      }}
                    />
                    <Zap size={16} style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", color: DS.amber }} />
                  </div>

                  {/* Presets */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                    {PRESETS.map(v => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setAmount(String(v))}
                        style={{
                          flex: 1, minWidth: "60px", padding: "8px", borderRadius: 8,
                          border: `1px solid ${amount === String(v) ? (mode === "award" ? DS.green : DS.red) : DS.border}`,
                          background: amount === String(v) ? (mode === "award" ? DS.green : DS.red) + "22" : DS.bg,
                          color: amount === String(v) ? (mode === "award" ? DS.green : DS.red) : DS.text2,
                          fontSize: 12, fontWeight: 600, cursor: "pointer",
                        }}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Total Impact Card */}
                <div style={{ padding: "20px", borderRadius: 16, background: `linear-gradient(135deg, ${DS.bg} 0%, ${DS.bgCard} 100%)`, border: `1px solid ${DS.border}`, position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: -10, right: -10, opacity: 0.1, color: mode === "award" ? DS.green : DS.red }}>
                    {mode === "award" ? <ArrowUpRight size={80} /> : <ArrowDownRight size={80} />}
                  </div>
                  
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <span style={{ fontSize: 12, color: DS.text3 }}>Tổng số thành viên</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: DS.text2 }}>{members.length}</span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderTop: `1px dashed ${DS.border}` }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: DS.text }}>Tổng số LP {mode === "award" ? "cấp ra" : "trừ đi"}</span>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: mode === "award" ? DS.green : DS.red }}>
                        {mode === "award" ? "+" : "-"}{totalImpact.toLocaleString()} LP
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontSize: 12, fontFamily: DS.mono, color: DS.text3, textTransform: "uppercase" }}>Lý do / Ghi chú</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Lý do điều chỉnh hàng loạt..."
                    rows={3}
                    style={{
                      width: "100%", padding: "12px", borderRadius: 12,
                      backgroundColor: DS.bg, border: `1px solid ${DS.border}`,
                      color: DS.text, fontSize: 13, outline: "none", resize: "none"
                    }}
                  />
                </div>

                {error && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px", borderRadius: 8, background: DS.red + "11", border: `1px solid ${DS.red}33`, color: DS.red, fontSize: 13 }}>
                    <Info size={14} />
                    {error}
                  </div>
                )}
              </form>
            </div>

            {/* Footer */}
            <div style={{ padding: "24px", borderTop: `1px solid ${DS.border}`, display: "flex", gap: 12 }}>
              <button 
                onClick={onClose}
                disabled={isMutating}
                style={{ flex: 1, padding: "12px", borderRadius: 12, border: `1px solid ${DS.border}`, background: "transparent", color: DS.text2, fontSize: 14, fontWeight: 600, cursor: "pointer" }}
              >
                Hủy
              </button>
              <button 
                onClick={handleSubmit}
                disabled={isMutating || !num || num <= 0}
                style={{
                  flex: 2, padding: "12px", borderRadius: 12, border: "none",
                  background: isMutating ? DS.text4 : (mode === "award" ? DS.green : DS.red),
                  color: "#fff", fontSize: 14, fontWeight: 600, 
                  cursor: isMutating || !num || num <= 0 ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8
                }}
              >
                {isMutating ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Check size={18} /></motion.div> : <Check size={18} />}
                Ghi nhận hàng loạt
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
