"use client";

import { useState } from "react";
import { Shield, ShieldCheck, User as UserIcon, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { AdminUserRow } from "@/lib/types";

const ROLE_LABEL: Record<AdminUserRow["role"], string> = {
  user: "Волонтёр",
  moderator: "Модератор",
  admin: "Админ",
};

const ROLE_ORDER: AdminUserRow["role"][] = ["user", "moderator", "admin"];

export function AdminUsersPanel({ users: initialUsers, myId }: { users: AdminUserRow[]; myId: string }) {
  const supabase = createClient();
  const [users, setUsers] = useState(initialUsers);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const filtered = users.filter((u) => {
    const q = query.toLowerCase();
    return (
      !q ||
      (u.display_name ?? "").toLowerCase().includes(q) ||
      (u.email ?? "").toLowerCase().includes(q)
    );
  });

  async function setRole(userId: string, role: AdminUserRow["role"]) {
    setBusyId(userId);
    setError(null);
    const { error: rpcError } = await supabase.rpc("admin_set_user_role", {
      target_user_id: userId,
      new_role: role,
    });
    setBusyId(null);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    setUsers((rows) => rows.map((u) => (u.id === userId ? { ...u, role } : u)));
  }

  return (
    <div>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {/* Поиск */}
      <div className="mb-4 relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-eco-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Поиск по имени или email…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-xl border border-eco-200 bg-eco-50 py-2 pl-9 pr-4 text-sm text-eco-900 placeholder-eco-400 focus:outline-none focus:ring-2 focus:ring-eco-500"
        />
      </div>

      <p className="mb-3 text-xs text-eco-500">
        Показано <span className="font-semibold text-eco-700">{filtered.length}</span> из{" "}
        <span className="font-semibold text-eco-700">{users.length}</span> пользователей
      </p>

      <div className="flex flex-col gap-2">
        {filtered.length === 0 && (
          <p className="py-6 text-center text-sm text-eco-400">Пользователи не найдены</p>
        )}
        {filtered.map((u) => (
          <div
            key={u.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-eco-200 bg-white p-3"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-eco-900 text-sm">
                {u.display_name || <span className="italic text-eco-400">Без имени</span>}
                {u.id === myId && <span className="ml-1 text-xs text-eco-400">(это ты)</span>}
              </p>
              <p className="truncate text-xs text-eco-500">{u.email}</p>
              {u.created_at && (
                <p className="text-[11px] text-eco-300 mt-0.5">
                  с {new Date(u.created_at).toLocaleDateString("ru-RU")}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1 rounded-lg bg-eco-50 p-1 shrink-0">
              {ROLE_ORDER.map((role) => (
                <button
                  key={role}
                  type="button"
                  disabled={busyId === u.id}
                  onClick={() => setRole(u.id, role)}
                  className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                    u.role === role ? "bg-eco-700 text-white" : "text-eco-600 hover:bg-eco-100"
                  }`}
                >
                  {role === "user" && <UserIcon size={12} />}
                  {role === "moderator" && <Shield size={12} />}
                  {role === "admin" && <ShieldCheck size={12} />}
                  {ROLE_LABEL[role]}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

