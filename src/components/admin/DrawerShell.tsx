"use client";

/**
 * DrawerShell — reusable slide-in drawer for admin panels
 * Used by: web_packages, services, and other admin CRUD pages
 */
import { motion } from "motion/react";
import { X } from "lucide-react";
import { DS } from "@/lib/design-tokens";

interface DrawerShellProps {
  children: React.ReactNode;
  title: string;
  onClose: () => void;
}

export function DrawerShell({ children, title, onClose }: DrawerShellProps) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000, display: "flex", justifyContent: "flex-end",
    }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
           onClick={onClose} />
      <motion.div
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        style={{
          position: "relative", width: 560, height: "100%", overflowY: "auto",
          background: DS.bgCard, borderLeft: `1px solid ${DS.border}`,
          display: "flex", flexDirection: "column",
        }}
      >
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", borderBottom: `1px solid ${DS.border}`,
          position: "sticky", top: 0, background: DS.bgCard, zIndex: 1,
        }}>
          <span style={{ fontFamily: DS.heading, fontSize: 16, fontWeight: 700, color: DS.text }}>{title}</span>
          <button onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer", color: DS.text3, padding: 4,
          }}><X size={18} /></button>
        </div>
        <div style={{ padding: 20, flex: 1 }}>{children}</div>
      </motion.div>
    </div>
  );
}
