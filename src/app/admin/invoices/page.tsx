"use client";

/**
 * Invoices + Expenses Admin Page — /admin/invoices
 * Section A: Invoices (income / expense)
 * Section B: Expenses
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { adminApi } from "@/lib/api/client";
import { DS } from "@/lib/design-tokens";
import {
  X, Plus, Edit2, Trash2, Eye, Search, ChevronLeft, ChevronRight,
  Receipt, TrendingUp, AlertTriangle, CheckCircle2,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type LineItem = {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

type Invoice = {
  id: string;
  invoiceNumber: string;
  orderId: string | null;
  customerId: string | null;
  type: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  status: string;
  dueDate: string | null;
  paidAt: string | null;
  paidMethod: string | null;
  description: string | null;
  note: string | null;
  createdAt: string;
  lineItems: LineItem[];
  order?: { id: string; customerName: string } | null;
};

type InvoiceFormData = {
  invoiceNumber: string;
  orderId: string;
  customerId: string;
  type: string;
  amount: string;
  taxAmount: string;
  totalAmount: string;
  currency: string;
  status: string;
  dueDate: string;
  paidMethod: string;
  description: string;
  note: string;
  lineItems: LineItem[];
  autoGenerate: boolean;
};

type Expense = {
  id: string;
  category: string;
  description: string;
  amount: number;
  currency: string;
  date: string;
  vendor: string | null;
  receiptUrl: string | null;
  status: string;
  approvedBy: string | null;
  approvedAt: string | null;
  note: string | null;
  createdAt: string;
};

type ExpenseFormData = {
  category: string;
  description: string;
  amount: string;
  currency: string;
  date: string;
  vendor: string;
  receiptUrl: string;
  note: string;
};

// ── Config ────────────────────────────────────────────────────────────────────

const INV_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft:   { label: "Bản nháp",    color: DS.text4,      bg: "rgba(148,163,184,0.12)" },
  sent:    { label: "Đã gửi",      color: DS.gold,       bg: "rgba(230,199,95,0.12)" },
  paid:    { label: "Đã thanh toán", color: DS.green,     bg: "rgba(124,181,160,0.12)" },
  overdue: { label: "Quá hạn",     color: DS.red,        bg: "rgba(204,51,68,0.12)" },
  cancelled: { label: "Đã hủy",    color: DS.gray500,    bg: "rgba(113,113,122,0.12)" },
};

const EXP_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: "Chờ duyệt",  color: DS.gold,    bg: "rgba(230,199,95,0.12)" },
  approved:  { label: "Đã duyệt",   color: DS.green,   bg: "rgba(124,181,160,0.12)" },
  rejected:  { label: "Từ chối",    color: DS.red,     bg: "rgba(204,51,68,0.12)" },
  reimbursed:{ label: "Hoàn tiền",  color: DS.cosmicCyan, bg: "rgba(98,197,235,0.12)" },
};

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  software:  { label: "Phần mềm", color: DS.cosmicBlue,    bg: "rgba(79,125,243,0.12)" },
  hardware:   { label: "Phần cứng", color: DS.cosmicPurple, bg: "rgba(107,61,245,0.12)" },
  marketing:  { label: "Marketing", color: DS.gold,         bg: "rgba(230,199,95,0.12)" },
  salary:     { label: "Lương",    color: DS.green,         bg: "rgba(124,181,160,0.12)" },
  office:     { label: "Văn phòng", color: DS.text4,        bg: "rgba(148,163,184,0.12)" },
  travel:     { label: "Công tác", color: DS.cosmicCyan,   bg: "rgba(98,197,235,0.12)" },
  other:      { label: "Khác",     color: DS.text4,         bg: "rgba(148,163,184,0.12)" },
};

const CATEGORIES = ["software", "hardware", "marketing", "salary", "office", "travel", "other"];
const EXP_STATUSES = ["pending", "approved", "rejected", "reimbursed"];
const INV_TYPES = ["income", "expense"];
const EMPTY_LINE_ITEM: LineItem = { description: "", quantity: 1, unitPrice: 0, totalPrice: 0 };

const EMPTY_INV_FORM: InvoiceFormData = {
  invoiceNumber: "", orderId: "", customerId: "", type: "income",
  amount: "", taxAmount: "0", totalAmount: "", currency: "VND",
  status: "draft", dueDate: "", paidMethod: "", description: "", note: "",
  lineItems: [{ ...EMPTY_LINE_ITEM }],
  autoGenerate: true,
};

const EMPTY_EXP_FORM: ExpenseFormData = {
  category: "other", description: "", amount: "",
  currency: "VND", date: new Date().toISOString().slice(0, 10),
  vendor: "", receiptUrl: "", note: "",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmtVND = (n: number | null | undefined) => {
  if (n == null) return "—";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency", currency: "VND", maximumFractionDigits: 0,
  }).format(n);
};

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("vi-VN") : "—";

function inputStyle(): React.CSSProperties {
  return {
    width: "100%",
    background: DS.bg,
    border: `1px solid ${DS.border}`,
    borderRadius: 8,
    padding: "0.5rem 0.75rem",
    color: DS.text,
    fontSize: 13,
    fontFamily: DS.body,
    outline: "none",
    boxSizing: "border-box",
  };
}

function btnStyle(bg: string, color = "#fff"): React.CSSProperties {
  return {
    background: bg,
    border: "none",
    borderRadius: 8,
    padding: "0.5rem 1.25rem",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: DS.body,
    color,
  };
}

// ── Status Badge ─────────────────────────────────────────────────────────────

function InvStatusBadge({ status }: { status: string }) {
  const cfg = INV_STATUS_CONFIG[status] ?? { label: status, color: DS.text4, bg: "rgba(148,163,184,0.12)" };
  return <span style={{ color: cfg.color, background: cfg.bg, borderRadius: 6, padding: "2px 10px", fontSize: 11, fontWeight: 600, fontFamily: DS.mono, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>{cfg.label}</span>;
}

function ExpStatusBadge({ status }: { status: string }) {
  const cfg = EXP_STATUS_CONFIG[status] ?? { label: status, color: DS.text4, bg: "rgba(148,163,184,0.12)" };
  return <span style={{ color: cfg.color, background: cfg.bg, borderRadius: 6, padding: "2px 10px", fontSize: 11, fontWeight: 600, fontFamily: DS.mono, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>{cfg.label}</span>;
}

function CategoryBadge({ category }: { category: string }) {
  const cfg = CATEGORY_CONFIG[category] ?? { label: category, color: DS.text4, bg: "rgba(148,163,184,0.12)" };
  return <span style={{ color: cfg.color, background: cfg.bg, borderRadius: 6, padding: "2px 10px", fontSize: 11, fontWeight: 600, fontFamily: DS.mono, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>{cfg.label}</span>;
}

// ── Invoice Modal ─────────────────────────────────────────────────────────────

function InvoiceModal({
  invoice, orders, onClose, onSave,
}: {
  invoice?: Invoice;
  orders?: Record<string, unknown>[];
  onClose: () => void;
  onSave: (data: InvoiceFormData) => void;
}) {
  const [form, setForm] = useState<InvoiceFormData>(
    invoice
      ? {
          invoiceNumber: invoice.invoiceNumber,
          orderId: invoice.orderId ?? "",
          customerId: invoice.customerId ?? "",
          type: invoice.type,
          amount: String(invoice.amount),
          taxAmount: String(invoice.taxAmount),
          totalAmount: String(invoice.totalAmount),
          currency: invoice.currency,
          status: invoice.status,
          dueDate: invoice.dueDate ? invoice.dueDate.slice(0, 10) : "",
          paidMethod: invoice.paidMethod ?? "",
          description: invoice.description ?? "",
          note: invoice.note ?? "",
          lineItems: invoice.lineItems.length > 0
            ? invoice.lineItems.map(li => ({
                id: li.id, description: li.description,
                quantity: li.quantity, unitPrice: li.unitPrice, totalPrice: li.totalPrice,
              }))
            : [{ ...EMPTY_LINE_ITEM }],
          autoGenerate: false,
        }
      : EMPTY_INV_FORM
  );

  const set = (k: keyof InvoiceFormData, v: string | LineItem[]) =>
    setForm(f => ({ ...f, [k]: v } as InvoiceFormData));

  const updateLine = (idx: number, patch: Partial<LineItem>) => {
    const items = form.lineItems.map((item, i) => {
      if (i !== idx) return item;
      const updated = { ...item, ...patch };
      updated.totalPrice = updated.quantity * updated.unitPrice;
      return updated;
    });
    setForm(f => ({ ...f, lineItems: items }));
  };

  const subtotal = form.lineItems.reduce((s, li) => s + li.totalPrice, 0);
  const taxAmount = parseInt(form.taxAmount, 10) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.lineItems[0]?.description.trim() && !invoice) return;
    onSave(form);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
        style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: "1.5rem", width: "100%", maxWidth: 720, maxHeight: "90vh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <h2 style={{ color: DS.text, fontSize: "1.1rem", fontWeight: 700, fontFamily: DS.heading }}>
            {invoice ? "Sửa Hóa đơn" : "Tạo Hóa đơn mới"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: DS.text4 }}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.875rem" }}>
            <Field label="Loại">
              <select value={form.type} onChange={e => set("type", e.target.value)} style={inputStyle()}>
                <option value="income">Thu (Income)</option>
                <option value="expense">Chi (Expense)</option>
              </select>
            </Field>
            <Field label="Số hóa đơn">
              <input value={form.invoiceNumber} onChange={e => set("invoiceNumber", e.target.value)}
                style={inputStyle()} placeholder={form.autoGenerate ? "Tự động" : "INV-202604-0001"} />
            </Field>
            <Field label="Trạng thái">
              <select value={form.status} onChange={e => set("status", e.target.value)} style={inputStyle()}>
                {Object.entries(INV_STATUS_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Đơn hàng">
            <select value={form.orderId} onChange={e => set("orderId", e.target.value)} style={inputStyle()}>
              <option value="">— Chọn đơn hàng —</option>
              {orders?.map((o: Record<string, unknown>) => (
                <option key={o.id as string} value={o.id as string}>{(o.customerName as string) ?? (o.id as string)}</option>
              ))}
            </select>
          </Field>

          {/* Line items */}
          <div>
            <label style={{ color: DS.text3, fontSize: 12, fontWeight: 600, marginBottom: 6, display: "block", fontFamily: DS.mono }}>Dòng chi tiết</label>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "0.5rem" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${DS.border}` }}>
                  {["Mô tả", "SL", "Đơn giá", "Thành tiền", ""].map((h, i) => (
                    <th key={h} style={{ padding: "0.375rem 0.5rem", color: DS.text4, fontSize: 10, fontWeight: 600, fontFamily: DS.mono, letterSpacing: "0.06em", textTransform: "uppercase", textAlign: i === 1 || i === 2 ? "right" : "left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {form.lineItems.map((li, idx) => (
                  <tr key={idx} style={{ borderBottom: `1px solid ${DS.border}40` }}>
                    <td style={{ padding: "0.25rem 0.25rem" }}>
                      <input value={li.description} onChange={e => updateLine(idx, { description: e.target.value })}
                        style={{ ...inputStyle(), fontSize: 12 }} placeholder="Mô tả dịch vụ..." />
                    </td>
                    <td style={{ padding: "0.25rem 0.25rem", textAlign: "right" }}>
                      <input type="number" value={li.quantity} onChange={e => updateLine(idx, { quantity: parseInt(e.target.value, 10) || 0 })}
                        style={{ ...inputStyle(), fontSize: 12, width: 60, textAlign: "right" }} min="1" />
                    </td>
                    <td style={{ padding: "0.25rem 0.25rem", textAlign: "right" }}>
                      <input type="number" value={li.unitPrice} onChange={e => updateLine(idx, { unitPrice: parseInt(e.target.value, 10) || 0 })}
                        style={{ ...inputStyle(), fontSize: 12, width: 100, textAlign: "right" }} min="0" />
                    </td>
                    <td style={{ padding: "0.25rem 0.5rem", textAlign: "right", color: DS.gold, fontSize: 12, fontWeight: 600, fontFamily: DS.mono }}>
                      {fmtVND(li.totalPrice)}
                    </td>
                    <td style={{ padding: "0.25rem 0.25rem" }}>
                      <button type="button" onClick={() => setForm(f => ({ ...f, lineItems: f.lineItems.filter((_, i) => i !== idx) }))}
                        style={{ background: "none", border: "none", cursor: "pointer", color: DS.red, fontSize: 16, lineHeight: 1 }}>×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button type="button" onClick={() => setForm(f => ({ ...f, lineItems: [...f.lineItems, { ...EMPTY_LINE_ITEM }] }))}
              style={{ background: "none", border: `1px dashed ${DS.border}`, borderRadius: 6, padding: "0.25rem 0.75rem", color: DS.text4, fontSize: 12, cursor: "pointer", width: "100%" }}>
              + Thêm dòng
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.875rem" }}>
            <Field label="Thuế (VND)">
              <input type="number" value={form.taxAmount} onChange={e => set("taxAmount", e.target.value)}
                style={inputStyle()} placeholder="0" min="0" />
            </Field>
            <Field label="Tổng cộng">
              <div style={{ ...inputStyle(), background: `${DS.cosmicPurple}15`, color: DS.cosmicPurple, fontWeight: 700, display: "flex", alignItems: "center" }}>
                {fmtVND(subtotal + taxAmount)}
              </div>
            </Field>
            <Field label="Hạn thanh toán">
              <input type="date" value={form.dueDate} onChange={e => set("dueDate", e.target.value)} style={inputStyle()} />
            </Field>
          </div>

          <Field label="Ghi chú">
            <textarea value={form.note} onChange={e => set("note", e.target.value)}
              style={{ ...inputStyle(), minHeight: 60, resize: "vertical" }} placeholder="Ghi chú..." />
          </Field>

          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.25rem" }}>
            <button type="button" onClick={onClose} style={{ ...btnStyle("#374151"), color: DS.text3 }}>Hủy</button>
            <button type="submit" style={{ ...btnStyle(DS.cosmicPurple), color: DS.text }}>
              {invoice ? "Lưu thay đổi" : "Tạo hóa đơn"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ── Expense Modal ─────────────────────────────────────────────────────────────

function ExpenseModal({
  expense, onClose, onSave,
}: {
  expense?: Expense;
  onClose: () => void;
  onSave: (data: ExpenseFormData) => void;
}) {
  const [form, setForm] = useState<ExpenseFormData>(
    expense
      ? {
          category: expense.category,
          description: expense.description,
          amount: String(expense.amount),
          currency: expense.currency,
          date: expense.date ? expense.date.slice(0, 10) : "",
          vendor: expense.vendor ?? "",
          receiptUrl: expense.receiptUrl ?? "",
          note: expense.note ?? "",
        }
      : EMPTY_EXP_FORM
  );

  const set = (k: keyof ExpenseFormData, v: string) =>
    setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description.trim()) return;
    onSave(form);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
        style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: "1.5rem", width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <h2 style={{ color: DS.text, fontSize: "1.1rem", fontWeight: 700, fontFamily: DS.heading }}>
            {expense ? "Sửa Chi phí" : "Tạo Chi phí mới"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: DS.text4 }}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
            <Field label="Danh mục *" required>
              <select value={form.category} onChange={e => set("category", e.target.value)} style={inputStyle()}>
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{(CATEGORY_CONFIG[c] ?? { label: c }).label}</option>
                ))}
              </select>
            </Field>
            <Field label="Số tiền (VND) *" required>
              <input type="number" value={form.amount} onChange={e => set("amount", e.target.value)}
                style={inputStyle()} placeholder="VD: 500000" min="1" required />
            </Field>
          </div>

          <Field label="Mô tả *" required>
            <input value={form.description} onChange={e => set("description", e.target.value)}
              style={inputStyle()} placeholder="VD: Licenses Figma Annual" required />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
            <Field label="Nhà cung cấp">
              <input value={form.vendor} onChange={e => set("vendor", e.target.value)}
                style={inputStyle()} placeholder="VD: Google, AWS..." />
            </Field>
            <Field label="Ngày chi">
              <input type="date" value={form.date} onChange={e => set("date", e.target.value)} style={inputStyle()} />
            </Field>
          </div>

          <Field label="URL chứng từ">
            <input value={form.receiptUrl} onChange={e => set("receiptUrl", e.target.value)}
              style={inputStyle()} placeholder="https://..." />
          </Field>

          <Field label="Ghi chú">
            <textarea value={form.note} onChange={e => set("note", e.target.value)}
              style={{ ...inputStyle(), minHeight: 60, resize: "vertical" }} placeholder="Ghi chú..." />
          </Field>

          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.25rem" }}>
            <button type="button" onClick={onClose} style={{ ...btnStyle("#374151"), color: DS.text3 }}>Hủy</button>
            <button type="submit" style={{ ...btnStyle(DS.cosmicPurple), color: DS.text }}>
              {expense ? "Lưu thay đổi" : "Tạo chi phí"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ── Field ─────────────────────────────────────────────────────────────────────

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label style={{ color: DS.text3, fontSize: 12, fontWeight: 600, marginBottom: 4, display: "block", fontFamily: DS.mono }}>
        {label}{required && <span style={{ color: DS.pink }}> *</span>}
      </label>
      {children}
    </div>
  );
}

function tinyBtn(color: string): React.CSSProperties {
  return {
    background: "transparent",
    border: `1px solid ${color}40`,
    borderRadius: 6,
    padding: "4px 8px",
    color,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    fontSize: 12,
  };
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function InvoicesPage() {
  const qc = useQueryClient();

  // Invoices state
  const [invTab, setInvTab] = useState<"income" | "expense">("income");
  const [invStatusFilter, setInvStatusFilter] = useState("all");
  const [invPage, setInvPage] = useState(1);

  // Expenses state
  const [expCategoryFilter, setExpCategoryFilter] = useState("all");
  const [expStatusFilter, setExpStatusFilter] = useState("all");
  const [expPage, setExpPage] = useState(1);

  // Modals
  const [showInvModal, setShowInvModal] = useState(false);
  const [modalInvoice, setModalInvoice] = useState<Invoice | undefined>(undefined);
  const [showExpModal, setShowExpModal] = useState(false);
  const [modalExpense, setModalExpense] = useState<Expense | undefined>(undefined);

  // Queries
  const { data: invData, isLoading: invLoading } = useQuery({
    queryKey: ["admin", "invoices", invTab, invStatusFilter, invPage],
    queryFn: () => {
      const params: Record<string, string | number> = { limit: 20, page: invPage };
      params.type = invTab;
      if (invStatusFilter !== "all") params.status = invStatusFilter;
      return adminApi.get<{ data: Invoice[]; pagination: { total: number; page: number; totalPages: number } }>(
        "/api/admin/invoices", { params }
      );
    },
  });

  const { data: ordersData } = useQuery({
    queryKey: ["admin", "orders", "all"],
    queryFn: () => adminApi.get<{ data: Record<string, unknown>[] }>("/api/admin/orders", { params: { limit: 200 } }),
  });

  const { data: expData, isLoading: expLoading } = useQuery({
    queryKey: ["admin", "expenses", expCategoryFilter, expStatusFilter, expPage],
    queryFn: () => {
      const params: Record<string, string | number> = { limit: 20, page: expPage };
      if (expCategoryFilter !== "all") params.category = expCategoryFilter;
      if (expStatusFilter !== "all") params.status = expStatusFilter;
      return adminApi.get<{ data: Expense[]; pagination: { total: number; page: number; totalPages: number } }>(
        "/api/admin/expenses", { params }
      );
    },
  });

  const invoices = invData?.data ?? [];
  const invPagination = invData?.pagination ?? { total: 0, page: 1, totalPages: 1 };
  const expenses = expData?.data ?? [];
  const expPagination = expData?.pagination ?? { total: 0, page: 1, totalPages: 1 };

  // Mutations
  const invCreateMut = useMutation({
    mutationFn: (data: InvoiceFormData) => adminApi.post("/api/admin/invoices", {
      type: data.type,
      orderId: data.orderId || undefined,
      customerId: data.customerId || undefined,
      amount: parseInt(data.amount, 10) || 0,
      taxAmount: parseInt(data.taxAmount, 10) || 0,
      totalAmount: (parseInt(data.amount, 10) || 0) + (parseInt(data.taxAmount, 10) || 0),
      status: data.status,
      dueDate: data.dueDate || undefined,
      paidMethod: data.paidMethod || undefined,
      description: data.description || undefined,
      note: data.note || undefined,
      autoGenerate: data.autoGenerate,
      lineItems: data.lineItems.filter(li => li.description.trim()),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "invoices"] }); setShowInvModal(false); },
  });

  const invUpdateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: InvoiceFormData }) => adminApi.put(`/api/admin/invoices/${id}`, {
      type: data.type,
      orderId: data.orderId || undefined,
      customerId: data.customerId || undefined,
      amount: parseInt(data.amount, 10) || 0,
      taxAmount: parseInt(data.taxAmount, 10) || 0,
      totalAmount: (parseInt(data.amount, 10) || 0) + (parseInt(data.taxAmount, 10) || 0),
      status: data.status,
      dueDate: data.dueDate || undefined,
      paidMethod: data.paidMethod || undefined,
      description: data.description || undefined,
      note: data.note || undefined,
      lineItems: data.lineItems.filter(li => li.description.trim()),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "invoices"] }); setShowInvModal(false); },
  });

  const invDeleteMut = useMutation({
    mutationFn: (id: string) => adminApi.delete(`/api/admin/invoices/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "invoices"] }),
  });

  const invMarkPaidMut = useMutation({
    mutationFn: (id: string) => adminApi.put(`/api/admin/invoices/${id}`, { status: "paid" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "invoices"] }),
  });

  const expCreateMut = useMutation({
    mutationFn: (data: ExpenseFormData) => adminApi.post("/api/admin/expenses", {
      category: data.category,
      description: data.description,
      amount: parseInt(data.amount, 10),
      currency: data.currency,
      date: data.date,
      vendor: data.vendor || undefined,
      receiptUrl: data.receiptUrl || undefined,
      note: data.note || undefined,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "expenses"] }); setShowExpModal(false); },
  });

  const expUpdateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ExpenseFormData }) => adminApi.put(`/api/admin/expenses/${id}`, {
      category: data.category,
      description: data.description,
      amount: parseInt(data.amount, 10),
      currency: data.currency,
      date: data.date,
      vendor: data.vendor || undefined,
      receiptUrl: data.receiptUrl || undefined,
      note: data.note || undefined,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "expenses"] }); setShowExpModal(false); },
  });

  const expDeleteMut = useMutation({
    mutationFn: (id: string) => adminApi.delete(`/api/admin/expenses/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "expenses"] }),
  });

  const expActionMut = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) =>
      adminApi.patch(`/api/admin/expenses/${id}`, { action }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "expenses"] }),
  });

  // Stats
  const invStats = {
    totalIssued: invoices.length,
    totalPaid: invoices.filter(i => i.status === "paid").length,
    totalOutstanding: invoices.filter(i => i.status === "sent").length,
    overdueCount: invoices.filter(i => i.status === "overdue").length,
  };

  const thisMonth = new Date().toISOString().slice(0, 7);
  const expThisMonth = expenses.filter(e => e.date?.startsWith(thisMonth)).reduce((s, e) => s + e.amount, 0);
  const pendingExpenses = expenses.filter(e => e.status === "pending").length;

  return (
    <div style={{ padding: "1.5rem", maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ color: DS.text, fontSize: "1.4rem", fontWeight: 800, fontFamily: DS.heading }}>Hóa đơn & Chi phí</h1>
          <p style={{ color: DS.text4, fontSize: 13, marginTop: 2 }}>Quản lý hóa đơn thu/chi và chi phí vận hành</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={() => { setModalInvoice(undefined); setShowInvModal(true); }}
            style={{ ...btnStyle(DS.cosmicPurple), display: "flex", alignItems: "center", gap: 6, color: DS.text }}>
            <Plus size={16} /> Hóa đơn
          </button>
          <button onClick={() => { setModalExpense(undefined); setShowExpModal(true); }}
            style={{ ...btnStyle(DS.bg, DS.text), border: `1px solid ${DS.border}`, display: "flex", alignItems: "center", gap: 6 }}>
            <Plus size={16} /> Chi phí
          </button>
        </div>
      </div>

      {/* ─── SECTION A: INVOICES ─────────────────────────────────────────── */}
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ color: DS.text2, fontSize: "1rem", fontWeight: 700, fontFamily: DS.heading, marginBottom: "0.875rem" }}>
          Hóa đơn
        </h2>

        {/* Inv type tabs + status */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.875rem", flexWrap: "wrap" }}>
          {INV_TYPES.map(t => (
            <button key={t} onClick={() => { setInvTab(t as "income" | "expense"); setInvPage(1); }}
              style={{
                background: invTab === t ? (t === "income" ? DS.green : DS.red) : DS.bgCard,
                border: `1px solid ${invTab === t ? (t === "income" ? DS.green : DS.red) : DS.border}`,
                borderRadius: 8, padding: "0.3rem 1rem",
                color: invTab === t ? DS.bg : DS.text4,
                fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: DS.body,
              }}>
              {t === "income" ? "Thu (Income)" : "Chi (Expense)"}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <select value={invStatusFilter} onChange={e => { setInvStatusFilter(e.target.value); setInvPage(1); }}
            style={{ ...inputStyle(), width: "auto", fontSize: 12 }}>
            {["all", "draft", "sent", "paid", "overdue", "cancelled"].map(s => (
              <option key={s} value={s}>{(INV_STATUS_CONFIG[s] ?? { label: s }).label}</option>
            ))}
          </select>
        </div>

        {/* Inv stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem", marginBottom: "1rem" }}>
          {[
            { label: "Đã phát hành", value: invStats.totalIssued, color: DS.text },
            { label: "Đã thanh toán", value: invStats.totalPaid, color: DS.green },
            { label: "Chờ thanh toán", value: invStats.totalOutstanding, color: DS.gold },
            { label: "Quá hạn", value: invStats.overdueCount, color: DS.red },
          ].map(s => (
            <div key={s.label} style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, padding: "0.625rem 1rem" }}>
              <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>{s.label}</div>
              <div style={{ color: s.color, fontSize: "1.3rem", fontWeight: 700, fontFamily: DS.heading }}>{invLoading ? "—" : s.value}</div>
            </div>
          ))}
        </div>

        {/* Invoice table */}
        <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${DS.border}` }}>
                {["Số hóa đơn", "Loại", "Tổng tiền", "Thuế", "Thành tiền", "Trạng thái", "Hạn TT", "Thao tác"].map(h => (
                  <th key={h} style={{ padding: "0.625rem 1rem", textAlign: "left", color: DS.text4, fontSize: 11, fontWeight: 600, fontFamily: DS.mono, letterSpacing: "0.06em", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invLoading ? (
                <tr><td colSpan={8} style={{ padding: "2rem", textAlign: "center", color: DS.text4 }}>Đang tải...</td></tr>
              ) : invoices.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: "2rem", textAlign: "center", color: DS.text4 }}>Chưa có hóa đơn nào</td></tr>
              ) : invoices.map(inv => (
                <tr key={inv.id} style={{ borderBottom: `1px solid ${DS.border}`, transition: "background 0.1s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <div style={{ color: DS.text2, fontSize: 12, fontWeight: 600, fontFamily: DS.mono }}>{inv.invoiceNumber}</div>
                    {inv.order && <div style={{ color: DS.text4, fontSize: 11, marginTop: 2 }}>ĐH: {inv.order.customerName ?? inv.order.id}</div>}
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <span style={{ color: inv.type === "income" ? DS.green : DS.red, background: `${inv.type === "income" ? DS.green : DS.red}15`, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600, fontFamily: DS.mono }}>
                      {inv.type === "income" ? "Thu" : "Chi"}
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem 1rem", color: DS.text3, fontSize: 12, fontFamily: DS.mono }}>{fmtVND(inv.amount)}</td>
                  <td style={{ padding: "0.75rem 1rem", color: DS.text3, fontSize: 12, fontFamily: DS.mono }}>{fmtVND(inv.taxAmount)}</td>
                  <td style={{ padding: "0.75rem 1rem", color: DS.gold, fontSize: 12, fontWeight: 600, fontFamily: DS.mono }}>{fmtVND(inv.totalAmount)}</td>
                  <td style={{ padding: "0.75rem 1rem" }}><InvStatusBadge status={inv.status} /></td>
                  <td style={{ padding: "0.75rem 1rem", color: inv.dueDate && new Date(inv.dueDate) < new Date() && inv.status !== "paid" ? DS.red : DS.text3, fontSize: 12 }}>{fmtDate(inv.dueDate)}</td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <div style={{ display: "flex", gap: 4 }}>
                      {inv.status !== "paid" && inv.status !== "cancelled" && (
                        <button onClick={() => invMarkPaidMut.mutate(inv.id)}
                          style={{ ...tinyBtn(DS.green), color: DS.green }} title="Đánh dấu đã thanh toán">
                          <CheckCircle2 size={13} />
                        </button>
                      )}
                      <button onClick={() => { setModalInvoice(inv); setShowInvModal(true); }}
                        style={{ ...tinyBtn(DS.cosmicPurple), color: DS.cosmicPurple }}><Edit2 size={13} /></button>
                      {inv.status === "draft" && (
                        <button onClick={() => { if (confirm("Xóa hóa đơn này?")) invDeleteMut.mutate(inv.id); }}
                          style={{ ...tinyBtn(DS.red), color: DS.red }}><Trash2 size={13} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Inv pagination */}
        {invPagination.totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.875rem" }}>
            <span style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono }}>Trang {invPagination.page} / {invPagination.totalPages}</span>
            <div style={{ display: "flex", gap: 4 }}>
              <button onClick={() => setInvPage(p => Math.max(1, p - 1))} disabled={invPage <= 1} style={{ ...tinyBtn(DS.border), color: DS.text3 }}><ChevronLeft size={14} /></button>
              <button onClick={() => setInvPage(p => Math.min(invPagination.totalPages, p + 1))} disabled={invPage >= invPagination.totalPages} style={{ ...tinyBtn(DS.border), color: DS.text3 }}><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: DS.border, margin: "1.5rem 0" }} />

      {/* ─── SECTION B: EXPENSES ─────────────────────────────────────────── */}
      <div>
        <h2 style={{ color: DS.text2, fontSize: "1rem", fontWeight: 700, fontFamily: DS.heading, marginBottom: "0.875rem" }}>
          Chi phí vận hành
        </h2>

        {/* Expense filters */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.875rem", flexWrap: "wrap" }}>
          <select value={expCategoryFilter} onChange={e => { setExpCategoryFilter(e.target.value); setExpPage(1); }}
            style={{ ...inputStyle(), width: "auto", fontSize: 12 }}>
            <option value="all">Tất cả danh mục</option>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{(CATEGORY_CONFIG[c] ?? { label: c }).label}</option>
            ))}
          </select>
          <select value={expStatusFilter} onChange={e => { setExpStatusFilter(e.target.value); setExpPage(1); }}
            style={{ ...inputStyle(), width: "auto", fontSize: 12 }}>
            <option value="all">Tất cả trạng thái</option>
            {EXP_STATUSES.map(s => (
              <option key={s} value={s}>{(EXP_STATUS_CONFIG[s] ?? { label: s }).label}</option>
            ))}
          </select>
        </div>

        {/* Expense stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginBottom: "1rem" }}>
          {[
            { label: "Chi tháng này", value: fmtVND(expThisMonth), color: DS.gold },
            { label: "Chờ duyệt", value: pendingExpenses, color: DS.gold },
            { label: "Đã duyệt", value: expenses.filter(e => e.status === "approved").length, color: DS.green },
          ].map(s => (
            <div key={s.label} style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, padding: "0.625rem 1rem" }}>
              <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>{s.label}</div>
              <div style={{ color: s.color, fontSize: "1.2rem", fontWeight: 700, fontFamily: DS.heading }}>{expLoading ? "—" : s.value}</div>
            </div>
          ))}
        </div>

        {/* Expense table */}
        <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${DS.border}` }}>
                {["Mô tả", "Danh mục", "Nhà cung cấp", "Số tiền", "Ngày", "Trạng thái", "Thao tác"].map(h => (
                  <th key={h} style={{ padding: "0.625rem 1rem", textAlign: "left", color: DS.text4, fontSize: 11, fontWeight: 600, fontFamily: DS.mono, letterSpacing: "0.06em", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {expLoading ? (
                <tr><td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: DS.text4 }}>Đang tải...</td></tr>
              ) : expenses.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: DS.text4 }}>Chưa có chi phí nào</td></tr>
              ) : expenses.map(exp => (
                <tr key={exp.id} style={{ borderBottom: `1px solid ${DS.border}`, transition: "background 0.1s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <div style={{ color: DS.text2, fontSize: 13, fontWeight: 600 }}>{exp.description}</div>
                    {exp.note && <div style={{ color: DS.text4, fontSize: 11, marginTop: 2 }}>{exp.note.slice(0, 60)}</div>}
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}><CategoryBadge category={exp.category} /></td>
                  <td style={{ padding: "0.75rem 1rem", color: DS.text3, fontSize: 12 }}>{exp.vendor ?? "—"}</td>
                  <td style={{ padding: "0.75rem 1rem", color: DS.gold, fontSize: 13, fontWeight: 600, fontFamily: DS.mono }}>{fmtVND(exp.amount)}</td>
                  <td style={{ padding: "0.75rem 1rem", color: DS.text3, fontSize: 12 }}>{fmtDate(exp.date)}</td>
                  <td style={{ padding: "0.75rem 1rem" }}><ExpStatusBadge status={exp.status} /></td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <div style={{ display: "flex", gap: 4 }}>
                      {exp.status === "pending" && (
                        <>
                          <button onClick={() => expActionMut.mutate({ id: exp.id, action: "approve" })}
                            style={{ ...tinyBtn(DS.green), color: DS.green }} title="Duyệt"><CheckCircle2 size={13} /></button>
                          <button onClick={() => expActionMut.mutate({ id: exp.id, action: "reject" })}
                            style={{ ...tinyBtn(DS.red), color: DS.red }} title="Từ chối"><AlertTriangle size={13} /></button>
                        </>
                      )}
                      {exp.status === "pending" && (
                        <button onClick={() => { setModalExpense(exp); setShowExpModal(true); }}
                          style={{ ...tinyBtn(DS.cosmicPurple), color: DS.cosmicPurple }}><Edit2 size={13} /></button>
                      )}
                      {exp.status !== "approved" && (
                        <button onClick={() => { if (confirm("Xóa chi phí này?")) expDeleteMut.mutate(exp.id); }}
                          style={{ ...tinyBtn(DS.red), color: DS.red }}><Trash2 size={13} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Exp pagination */}
        {expPagination.totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.875rem" }}>
            <span style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono }}>Trang {expPagination.page} / {expPagination.totalPages}</span>
            <div style={{ display: "flex", gap: 4 }}>
              <button onClick={() => setExpPage(p => Math.max(1, p - 1))} disabled={expPage <= 1} style={{ ...tinyBtn(DS.border), color: DS.text3 }}><ChevronLeft size={14} /></button>
              <button onClick={() => setExpPage(p => Math.min(expPagination.totalPages, p + 1))} disabled={expPage >= expPagination.totalPages} style={{ ...tinyBtn(DS.border), color: DS.text3 }}><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showInvModal && (
          <InvoiceModal
            invoice={modalInvoice}
            orders={ordersData?.data}
            onClose={() => setShowInvModal(false)}
            onSave={data => {
              if (modalInvoice) invUpdateMut.mutate({ id: modalInvoice.id, data });
              else invCreateMut.mutate(data);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showExpModal && (
          <ExpenseModal
            expense={modalExpense}
            onClose={() => setShowExpModal(false)}
            onSave={data => {
              if (modalExpense) expUpdateMut.mutate({ id: modalExpense.id, data });
              else expCreateMut.mutate(data);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
