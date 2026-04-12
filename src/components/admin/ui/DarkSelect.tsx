"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface Option {
 value: string;
 label: string;
 color?: string;
}

interface DarkSelectProps {
 value: string;
 onChange: (value: string) => void;
 options: Option[];
 placeholder?: string;
 disabled?: boolean;
 style?: React.CSSProperties;
 triggerStyle?: React.CSSProperties;
}

/**
 * Dark-themed custom select dropdown.
 * Renders as a button-triggered dropdown with dark styling.
 * Fixes the native <select> white-on-white bug on Windows/macOS.
 */
export function DarkSelect({
 value,
 onChange,
 options,
 placeholder = "— Chọn —",
 disabled,
 style,
 triggerStyle,
}: DarkSelectProps) {
 const [open, setOpen] = useState(false);
 const ref = useRef<HTMLDivElement>(null);

 const selected = options.find((o) => o.value === value);
 const selectedColor = selected?.color;

 // Close on outside click
 useEffect(() => {
 const handler = (e: MouseEvent) => {
 if (ref.current && !ref.current.contains(e.target as Node)) {
 setOpen(false);
 }
 };
 document.addEventListener("mousedown", handler);
 return () => document.removeEventListener("mousedown", handler);
 }, []);

  return (
 <div ref={ref} style={{ position: "relative", width: "100%", ...style }}>
 {/* Trigger button */}
 <button
 type="button"
 onClick={() => !disabled && setOpen((v) => !v)}
 disabled={disabled}
 style={{
 width: "100%",
 padding: "7px 10px",
 borderRadius: 8,
 border: open
 ? `1px solid ${selectedColor ?? "rgba(255,255,255,0.3)"}`
 : "1px solid rgba(255,255,255,0.1)",
 background: selectedColor
 ? `${selectedColor}15`
 : "rgba(255,255,255,0.04)",
 color: selectedColor ?? "#E2E8F0",
 fontFamily: "var(--font-mono, monospace)",
 fontSize: 11,
 cursor: disabled ? "not-allowed" : "pointer",
 display: "flex",
 alignItems: "center",
 justifyContent: "space-between",
 gap: 6,
 opacity: disabled ? 0.5 : 1,
 outline: "none",
 transition: "border-color 0.15s",
 ...triggerStyle,
 }}
 >
 <span>
 {selected?.label ?? (
 <span style={{ color: "#7A8A9E", fontStyle: "italic" }}>
 {placeholder}
 </span>
 )}
 </span>
 {open ? (
 <ChevronUp size={13} />
 ) : (
 <ChevronDown size={13} />
 )}
 </button>

  {/* Dropdown */}
 {open && (
 <div
 style={{
 position: "absolute",
 top: "calc(100% + 4px)",
 left: 0,
 right: 0,
 zIndex: 9999,
 background: "#111827",
 border: "1px solid rgba(255,255,255,0.1)",
 borderRadius: 10,
 boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
 overflow: "hidden",
 maxHeight: 240,
 overflowY: "auto",
 }}
 >
 {options.map((opt) => {
 const isActive = opt.value === value;
 return (
 <button
 key={opt.value}
 type="button"
 onClick={() => {
 onChange(opt.value);
 setOpen(false);
 }}
 style={{
 width: "100%",
 padding: "8px 12px",
 background: isActive
 ? opt.color
 ? `${opt.color}22`
 : "rgba(255,255,255,0.08)"
 : "transparent",
 border: "none",
 borderBottom: "1px solid rgba(255,255,255,0.04)",
 color: opt.color ?? "#E2E8F0",
 fontFamily: "var(--font-mono, monospace)",
 fontSize: 11,
 cursor: "pointer",
 textAlign: "left",
 display: "flex",
 alignItems: "center",
 justifyContent: "space-between",
 gap: 6,
 transition: "background 0.1s",
 }}
 onMouseEnter={(e) => {
 if (!isActive) {
 (e.currentTarget as HTMLButtonElement).style.background =
 "rgba(255,255,255,0.06)";
 }
 }}
 onMouseLeave={(e) => {
 if (!isActive) {
 (e.currentTarget as HTMLButtonElement).style.background =
 "transparent";
 }
 }}
 >
 {opt.label}
 {isActive && (
 <span style={{ fontSize: 10, opacity: 0.6 }}>✓</span>
 )}
 </button>
 );
 })}
 </div>
 )}
 </div>
 );
}
