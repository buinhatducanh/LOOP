"use client";

import { useState, useEffect, useCallback } from "react";
import { use } from "react";

interface FigmaDemo {
  id: string;
  title: string;
  figmaUrl: string;
  versionHash: string | null;
  status: string;
  rejectionNote: string | null;
  approvedAt: string | null;
  sentAt: string | null;
  createdAt: string;
  project?: {
    orderNumber: string;
    customerName: string;
  };
}

type ReviewStatus = "idle" | "submitting" | "submitted";

export default function FigmaReviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [demo, setDemo] = useState<FigmaDemo | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>("idle");
  const [rejectionReason, setRejectionReason] = useState("");
  const [error, setError] = useState("");

  const fetchDemo = useCallback(async () => {
    try {
      const res = await fetch(`/api/public/figma-review/${token}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Không tìm thấy demo");
      setDemo(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi khi tải demo");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchDemo(); }, [fetchDemo]);

  const approve = async () => {
    setReviewStatus("submitting");
    try {
      const res = await fetch(`/api/public/figma-review/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setReviewStatus("submitted");
      fetchDemo();
    } catch (err) {
      setReviewStatus("idle");
      alert(err instanceof Error ? err.message : "Lỗi");
    }
  };

  const reject = async () => {
    if (!rejectionReason.trim()) {
      alert("Vui lòng nhập lý do từ chối");
      return;
    }
    setReviewStatus("submitting");
    try {
      const res = await fetch(`/api/public/figma-review/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", reason: rejectionReason }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setReviewStatus("submitted");
      fetchDemo();
    } catch (err) {
      setReviewStatus("idle");
      alert(err instanceof Error ? err.message : "Lỗi");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a0f" }}>
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">🎨</div>
          <p style={{ color: "rgba(209,213,219,0.5)" }}>Đang tải thiết kế...</p>
        </div>
      </div>
    );
  }

  if (error || !demo) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a0f" }}>
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-xl font-bold text-white mb-2">Không tìm thấy</h1>
          <p style={{ color: "rgba(209,213,219,0.5)" }}>{error || "Link không hợp lệ hoặc đã hết hạn."}</p>
        </div>
      </div>
    );
  }

  const isApproved = demo.status === "approved" || demo.status === "approved_by_client";
  const isRejected = demo.status === "rejected";
  const isPending = demo.status === "pending";

  return (
    <div className="min-h-screen" style={{ background: "#0a0a0f" }}>
      {/* Header */}
      <div className="border-b" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">{demo.title}</h1>
            <p className="text-sm" style={{ color: "rgba(209,213,219,0.4)" }}>
              {demo.project ? `${demo.project.customerName} · ${demo.project.orderNumber}` : "—"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isApproved && (
              <span className="rounded-full px-4 py-1.5 text-sm font-medium"
                style={{ background: "rgba(16,185,129,0.15)", color: "#10B981" }}>
                ✓ Đã duyệt
              </span>
            )}
            {isRejected && (
              <span className="rounded-full px-4 py-1.5 text-sm font-medium"
                style={{ background: "rgba(239,68,68,0.15)", color: "#EF4444" }}>
                ✕ Cần sửa
              </span>
            )}
            {isPending && (
              <span className="rounded-full px-4 py-1.5 text-sm font-medium"
                style={{ background: "rgba(245,158,11,0.15)", color: "#F59E0B" }}>
                Chờ bạn duyệt
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Figma embed */}
      <div className="max-w-5xl mx-auto px-6 py-6">
        <div className="rounded-2xl border overflow-hidden"
          style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="h-[70vh] flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.01)" }}>
            <iframe
              src={`https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(demo.figmaUrl)}`}
              className="w-full h-full border-0"
              allowFullScreen
              title={demo.title}
            />
          </div>
          <div className="flex items-center justify-between px-6 py-4 border-t"
            style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-4">
              {demo.versionHash && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase" style={{ color: "rgba(209,213,219,0.3)" }}>version</span>
                  <code className="text-xs rounded px-2 py-0.5 font-mono"
                    style={{ background: "rgba(139,92,246,0.15)", color: "#A78BFA" }}>
                    {demo.versionHash?.slice(0, 8) ?? "—"}
                  </code>
                </div>
              )}
              <a
                href={`https://www.figma.com/embed?embed_host=loops&url=${encodeURIComponent(demo.figmaUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium underline underline-offset-2"
                style={{ color: "#A78BFA" }}
              >
                Mở trong Figma →
              </a>
            </div>
            {demo.approvedAt && (
              <p className="text-xs" style={{ color: "rgba(209,213,219,0.3)" }}>
                Đã duyệt: {new Date(demo.approvedAt).toLocaleDateString("vi-VN")}
              </p>
            )}
          </div>
        </div>

        {/* Rejection note */}
        {isRejected && demo.rejectionNote && (
          <div className="mt-4 p-4 rounded-xl border"
            style={{ background: "rgba(239,68,68,0.05)", borderColor: "rgba(239,68,68,0.2)" }}>
            <p className="text-sm font-medium mb-1" style={{ color: "#EF4444" }}>Lý do cần sửa:</p>
            <p className="text-sm" style={{ color: "rgba(209,213,219,0.7)" }}>{demo.rejectionNote}</p>
          </div>
        )}

        {/* Review actions */}
        {isPending && !reviewStatus && (
          <div className="mt-6 rounded-2xl border p-6"
            style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)" }}>
            <h2 className="text-lg font-bold text-white mb-1">Đánh giá thiết kế</h2>
            <p className="text-sm mb-5" style={{ color: "rgba(209,213,219,0.5)" }}>
              Bạn có hài lòng với thiết kế này không?
            </p>

            {/* Approve */}
            <div className="mb-4">
              <button onClick={approve}
                className="w-full rounded-xl py-4 text-base font-bold text-white transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}>
                ✓ Tôi hài lòng — Duyệt thiết kế
              </button>
            </div>

            {/* Reject */}
            <div>
              <p className="text-sm font-medium mb-2" style={{ color: "rgba(209,213,219,0.6)" }}>
                Cần chỉnh sửa — cho chúng tôi biết lý do:
              </p>
              <textarea
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                rows={3}
                placeholder="VD: Màu sắc chưa đúng, cần thêm trang giỏ hàng..."
                className="w-full rounded-xl border px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-red-400 mb-3"
                style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.1)" }}
              />
              <button onClick={reject}
                className="w-full rounded-xl py-3 text-sm font-medium text-red-400 border transition-all hover:bg-red-500/10"
                style={{ borderColor: "rgba(239,68,68,0.3)" }}>
                ✕ Gửi phản hồi &amp; yêu cầu chỉnh sửa
              </button>
            </div>
          </div>
        )}

        {/* Submitted confirmation */}
        {reviewStatus === "submitted" && (
          <div className="mt-6 rounded-2xl border p-6 text-center"
            style={{ background: "rgba(16,185,129,0.05)", borderColor: "rgba(16,185,129,0.2)" }}>
            <div className="text-5xl mb-3">✓</div>
            <h2 className="text-lg font-bold text-white mb-1">Cảm ơn bạn!</h2>
            <p className="text-sm" style={{ color: "rgba(209,213,219,0.6)" }}>
              Phản hồi của bạn đã được gửi. Đội ngũ sẽ liên hệ sớm.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
