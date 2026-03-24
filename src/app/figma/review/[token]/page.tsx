"use client";

import { useState, useEffect } from "react";

interface FigmaDemo {
  id: string;
  title: string;
  figmaUrl: string;
  embedUrl: string | null;
  version: number;
  status: string;
  revisionCount: number;
  rejectedReason: string | null;
  feedback: Array<{ by: string; at: string; message: string; type: string }>;
  sentAt: string | null;
  order: {
    id: string;
    orderNumber: string;
    customerName: string;
    customerEmail: string;
  };
}

export default function FigmaReviewPage({ params }: { params: Promise<{ token: string }> }) {
  const [demo, setDemo] = useState<FigmaDemo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    params.then(p => setToken(p.token));
  }, [params]);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/public/figma/review/${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); }
        else { setDemo(d.data); }
      })
      .catch(() => setError("Không thể tải trang review."))
      .finally(() => setLoading(false));
  }, [token]);

  const submitReview = async (action: "approve" | "reject") => {
    if (!demo || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/public/figma/review/${demo.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, comment }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); }
      else { setSubmitted(true); }
    } catch {
      setError("Lỗi khi gửi. Vui lòng thử lại.");
    } finally { setSubmitting(false); }
  };

  if (loading) return <ReviewSkeleton />;
  if (error) return <ErrorState message={error} />;
  if (!demo) return <ErrorState message="Không tìm thấy trang review." />;
  if (submitted) return <SuccessState name={demo.order.customerName} />;

  const isPending = demo.status === "pending" || demo.status === "approved_by_client";
  const isApproved = demo.status === "approved";
  const isRejected = demo.status === "rejected";

  return (
    <div style={{ background: "#09090f", minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(9,11,20,0.98)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: 0 }}>
              {demo.title}
            </h1>
            <p style={{ fontSize: 13, color: "rgba(209,213,219,0.5)", margin: "4px 0 0" }}>
              {demo.order.customerName} · Version {demo.version}
              {demo.revisionCount > 0 && <span style={{ color: "#F59E0B" }}> · Revision #{demo.revisionCount}</span>}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {isPending && (
              <span style={{ borderRadius: "9999px", padding: "6px 16px", fontSize: 12, fontWeight: 600,
                background: "rgba(245,158,11,0.15)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.3)" }}>
                ⏳ Chờ phản hồi của bạn
              </span>
            )}
            {isApproved && (
              <span style={{ borderRadius: "9999px", padding: "6px 16px", fontSize: 12, fontWeight: 600,
                background: "rgba(16,185,129,0.15)", color: "#10B981", border: "1px solid rgba(16,185,129,0.3)" }}>
                ✓ Đã duyệt
              </span>
            )}
            {isRejected && (
              <span style={{ borderRadius: "9999px", padding: "6px 16px", fontSize: 12, fontWeight: 600,
                background: "rgba(239,68,68,0.15)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.3)" }}>
                ✕ Cần chỉnh sửa
              </span>
            )}
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px" }}>
        {/* Rejected reason banner */}
        {demo.rejectedReason && (
          <div style={{ borderRadius: 12, padding: "16px 20px", marginBottom: 24,
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#EF4444", margin: "0 0 6px" }}>
              Lý do cần chỉnh sửa:
            </p>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", margin: 0 }}>{demo.rejectedReason}</p>
          </div>
        )}

        {/* Feedback thread */}
        {demo.feedback && demo.feedback.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: "rgba(209,213,219,0.6)", marginBottom: 12 }}>
              Lịch sử phản hồi
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {demo.feedback.map((f, i) => (
                <div key={i} style={{ borderRadius: 8, padding: "12px 16px",
                  background: f.type === "client-approve" ? "rgba(16,185,129,0.08)"
                    : f.type === "client-reject" ? "rgba(239,68,68,0.08)"
                    : "rgba(255,255,255,0.04)",
                  border: `1px solid ${f.type === "client-approve" ? "rgba(16,185,129,0.2)" : f.type === "client-reject" ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.08)"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{f.by}</span>
                    <span style={{ fontSize: 12, color: "rgba(209,213,219,0.4)" }}>
                      {new Date(f.at).toLocaleString("vi-VN")}
                    </span>
                  </div>
                  <p style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", margin: 0 }}>{f.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Figma Embed */}
        <div style={{ borderRadius: 16, overflow: "hidden", marginBottom: 24, border: "1px solid rgba(255,255,255,0.08)" }}>
          {demo.embedUrl ? (
            <iframe
              src={demo.embedUrl}
              style={{ width: "100%", height: "70vh", border: "none" }}
              allowFullScreen
              title={demo.title}
            />
          ) : (
            <div style={{ height: "50vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.02)" }}>
              <p style={{ fontSize: 16, fontWeight: 600, color: "rgba(209,213,219,0.6)", marginBottom: 12 }}>Xem thiết kế trên Figma</p>
              <a href={demo.figmaUrl} target="_blank" rel="noopener noreferrer"
                style={{ borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 600,
                  background: "#1abb9c", color: "#fff", textDecoration: "none" }}>
                Mở Figma →
              </a>
            </div>
          )}
        </div>

        {/* Review actions */}
        {isPending && (
          <div style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", padding: 24,
            background: "rgba(255,255,255,0.02)" }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 6 }}>
              Đánh giá thiết kế này
            </h2>
            <p style={{ fontSize: 14, color: "rgba(209,213,219,0.5)", marginBottom: 20 }}>
              Vui lòng cho chúng tôi biết ý kiến của bạn để đội ngũ có thể điều chỉnh.
            </p>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Nhận xét của bạn (tuỳ chọn)..."
              rows={4}
              style={{ width: "100%", borderRadius: 8, padding: 12, fontSize: 14, color: "#fff",
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                outline: "none", resize: "vertical", fontFamily: "inherit", marginBottom: 16,
                boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => submitReview("approve")}
                disabled={submitting}
                style={{ flex: 1, borderRadius: 8, padding: "14px 24px", fontSize: 15, fontWeight: 700,
                  background: "#10B981", color: "#fff", border: "none", cursor: submitting ? "not-allowed" : "pointer",
                  opacity: submitting ? 0.6 : 1, transition: "all 0.2s" }}>
                {submitting ? "Đang gửi..." : "✓ Chấp nhận thiết kế"}
              </button>
              <button
                onClick={() => submitReview("reject")}
                disabled={submitting}
                style={{ flex: 1, borderRadius: 8, padding: "14px 24px", fontSize: 15, fontWeight: 700,
                  background: "transparent", color: "#EF4444", border: "1px solid rgba(239,68,68,0.4)",
                  cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.6 : 1,
                  transition: "all 0.2s" }}>
                {submitting ? "Đang gửi..." : "✕ Cần chỉnh sửa"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewSkeleton() {
  return (
    <div style={{ background: "#09090f", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 16 }}>Đang tải trang review...</p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div style={{ background: "#09090f", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
      <p style={{ color: "#EF4444", fontSize: 18, fontWeight: 700 }}>⚠ {message}</p>
      <a href="/" style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>← Quay về trang chủ</a>
    </div>
  );
}

function SuccessState({ name }: { name: string }) {
  return (
    <div style={{ background: "#09090f", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(16,185,129,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>
        ✓
      </div>
      <h1 style={{ color: "#10B981", fontSize: 24, fontWeight: 800, margin: 0 }}>Cảm ơn {name}!</h1>
      <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 16, maxWidth: 400, textAlign: "center" }}>
        Phản hồi của bạn đã được ghi nhận. Đội ngũ LOOP sẽ liên hệ trong thời gian sớm nhất.
      </p>
    </div>
  );
}
