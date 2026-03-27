"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { qk } from "@/lib/query/provider";
import { adminApi } from "@/lib/api/client";
import { DS, GRD } from "@/lib/design-tokens";
import { Plus, Edit2, Search, RefreshCw, Crown, Zap } from "lucide-react";

type Member = {
  id: string;
  slug: string;
  name: string;
  role: string;
  image?: string;
  isActive: boolean;
  isFeatured: boolean;
  rank?: string;
  level?: number;
  lpBalance?: number;
};

const RANK_COLORS: Record<string, { color: string; bg: string }> = {
  Diamond: { color: "#60A5FA", bg: "rgba(96,165,250,0.12)" },
  Gold:    { color: "#FBBF24", bg: "rgba(251,191,36,0.12)" },
  Silver:  { color: "#9CA3AF", bg: "rgba(156,163,175,0.1)" },
  Bronze:  { color: "#CD7F32", bg: "rgba(205,127,50,0.1)" },
};

function MemberRow({ member }: { member: Member }) {
  const qc = useQueryClient();
  const rCfg = RANK_COLORS[member.rank ?? ""] ?? { color: DS.text4, bg: "transparent" };

  const toggleActive = useMutation({
    mutationFn: async () => {
      await adminApi.put(`/api/admin/team/${member.id}`, { isActive: !member.isActive });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.adminMembers() }),
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}
    >
      {/* Avatar */}
      <div style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", background: "#111827", flexShrink: 0, border: `2px solid ${rCfg.color}30` }}>
        {member.image ? (
          <img src={member.image} alt={member.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: DS.text5, fontSize: "1rem", fontWeight: 700 }}>
            {member.name.charAt(0)}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <p style={{ color: DS.text, fontWeight: 600, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {member.name}
          </p>
          {member.isFeatured && <Crown size={11} style={{ color: DS.amber, flexShrink: 0 }} />}
        </div>
        <p style={{ color: DS.blue, fontSize: 11, fontFamily: DS.mono }}>{member.role}</p>
      </div>

      {/* Rank + LP */}
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        {member.rank && (
          <span style={{ background: rCfg.bg, border: `1px solid ${rCfg.color}40`, color: rCfg.color, padding: "3px 10px", borderRadius: 9999, fontSize: 10, fontFamily: DS.mono, fontWeight: 700, display: "flex", alignItems: "center", gap: 3 }}>
            {member.rank === "Diamond" ? <Crown size={10} /> : <Zap size={10} />}
            {member.rank}
          </span>
        )}
        {member.level && (
          <span style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)", color: "#FBBF24", padding: "3px 10px", borderRadius: 9999, fontSize: 10, fontFamily: DS.mono, fontWeight: 700 }}>
            LV{member.level}
          </span>
        )}
      </div>

      {/* Active toggle */}
      <button
        onClick={() => toggleActive.mutate()}
        style={{
          padding: "4px 10px", borderRadius: 9999,
          border: `1px solid ${member.isActive ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.4)"}`,
          background: member.isActive ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
          color: member.isActive ? DS.green : DS.red,
          fontSize: 10, fontFamily: DS.mono, cursor: "pointer", fontWeight: 600, flexShrink: 0,
        }}
      >
        {member.isActive ? "Active" : "Inactive"}
      </button>

      {/* Actions */}
      <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
        <button style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 8, padding: "5px 10px", cursor: "pointer", color: DS.blue, display: "flex", alignItems: "center" }}>
          <Edit2 size={13} />
        </button>
      </div>
    </motion.div>
  );
}

export default function MembersTabPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading, isFetching } = useQuery({
    queryKey: qk.adminMembers({ page, limit: 20, search }),
    queryFn: async () => {
      const res = await adminApi.get<{ data: Member[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
        "/api/admin/team",
        { params: { page, limit: 20, ...(search ? { search } : {}) } }
      );
      return res;
    },
  });

  const members = data?.data ?? [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: DS.heading, fontSize: 20, fontWeight: 800, color: DS.text, marginBottom: 2 }}>Thành viên</h2>
          <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono }}>{pagination?.total ?? 0} thành viên</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => qc.invalidateQueries({ queryKey: qk.adminMembers({ page }) })}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, color: DS.text3, cursor: "pointer", fontSize: 12, fontFamily: DS.mono }}
          >
            <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} /> Làm mới
          </button>
          <button
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: GRD.primary, color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 700 }}
          >
            <Plus size={14} /> Thêm thành viên
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: DS.text4 }} />
        <input
          type="text"
          placeholder="Tìm theo tên, vai trò..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{ width: "100%", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, padding: "8px 12px 8px 36px", color: DS.text, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: DS.body }}
        />
      </div>

      {/* Loading */}
      {isLoading && (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
          <div style={{ width: 32, height: 32, border: `2px solid ${DS.border}`, borderTop: `2px solid ${DS.blue}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
      )}

      {/* List */}
      {!isLoading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {members.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: DS.text4, fontSize: 14 }}>Chưa có thành viên nào</div>
          ) : (
            members.map((m) => <MemberRow key={m.id} member={m} />)
          )}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${page === p ? DS.blue : DS.border}`, background: page === p ? "rgba(59,130,246,0.1)" : "transparent", color: page === p ? DS.blue : DS.text4, cursor: "pointer", fontSize: 13, fontFamily: DS.mono }}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
