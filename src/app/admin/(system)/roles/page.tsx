"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, Users, Key } from "lucide-react";

interface RoleData {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  level: number;
  isSystem: boolean;
  _count: { users: number; permissions: number };
  permissions: { id: string; resource: string; action: string; scope: string }[];
}

const RESOURCES = [
  "services", "projects", "orders", "messages", "users",
  "team", "testimonials", "packages", "settings", "audit_logs",
];
const ACTIONS = ["create", "read", "update", "delete"];

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<RoleData | null>(null);

  useEffect(() => {
    fetch("/api/admin/roles")
      .then((r) => r.json())
      .then((data) => setRoles(data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function hasPermission(role: RoleData, resource: string, action: string) {
    return role.permissions.some((p) => p.resource === resource && p.action === action);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-800/50" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Phân quyền (RBAC)</h1>
        <p className="text-sm text-slate-400">Quản lý vai trò và quyền hạn của hệ thống</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Role List */}
        <div className="space-y-3">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => setSelectedRole(role)}
              className={`w-full rounded-xl border p-4 text-left transition ${
                selectedRole?.id === role.id
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-slate-800 bg-slate-900/50 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
                  <ShieldCheck size={18} className="text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-white">{role.displayName}</p>
                  <p className="text-xs text-slate-500">{role.description}</p>
                </div>
              </div>
              <div className="mt-3 flex gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Users size={12} /> {role._count.users} users
                </span>
                <span className="flex items-center gap-1">
                  <Key size={12} /> {role._count.permissions} permissions
                </span>
              </div>
              {role.isSystem && (
                <span className="mt-2 inline-block rounded bg-yellow-500/10 px-1.5 py-0.5 text-[10px] text-yellow-400">
                  System role
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Permission Matrix */}
        <div className="lg:col-span-2">
          {selectedRole ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/50">
              <div className="border-b border-slate-800 px-5 py-4">
                <h2 className="font-semibold text-white">
                  Quyền hạn: {selectedRole.displayName}
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-400">
                        Module
                      </th>
                      {ACTIONS.map((action) => (
                        <th
                          key={action}
                          className="px-4 py-3 text-center text-xs font-semibold uppercase text-slate-400"
                        >
                          {action}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {RESOURCES.map((resource) => (
                      <tr key={resource} className="hover:bg-slate-800/30">
                        <td className="px-4 py-3 font-medium capitalize text-slate-300">
                          {resource.replace("_", " ")}
                        </td>
                        {ACTIONS.map((action) => {
                          const has = hasPermission(selectedRole, resource, action);
                          return (
                            <td key={action} className="px-4 py-3 text-center">
                              <span
                                className={`inline-block h-5 w-5 rounded ${
                                  has ? "bg-green-500/30 text-green-400" : "bg-slate-800 text-slate-600"
                                }`}
                              >
                                {has ? "✓" : ""}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-800 text-slate-500">
              Chọn một vai trò để xem quyền hạn
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
