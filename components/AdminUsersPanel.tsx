"use client";

import { useState } from "react";
import { Shield, ShieldCheck, User as UserIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { AdminUserRow } from "@/lib/types";

const ROLE_LABEL: Record<AdminUserRow["role"], string> = {
  user: "Волонтёр",
  moderator: "Модератор",
  admin: "Админ",
};

const ROLE_ORDER: AdminUserRow["role"][] = ["user", "moderator", "admin"];

/**
 * Список всех пользователей с переключателем роли.
 * Смена роли идёт через RPC admin_set_user_role — она сама проверяет на сервере,
 * что вызывающий действительно admin, так что даже если кто-то обойдёт эту кнопку
 * через devtools, без прав admin в базе запрос будет отклонён.
 */
export function AdminUsersPanel({ users: initialUsers, myId }: { users: AdminUserRow[]; myId: string }) {
  const supabase = createClient();
  const [users, setUsers] = useState(initialUsers);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      <div className="flex flex-col gap-2">
        {users.map((u) => (
          <div
            key={u.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-eco-200 bg-white p-3"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-eco-900">
                {u.display_name} {u.id === myId && <span className="text-xs text-eco-400">(это ты)</span>}
              </p>
              <p className="truncate text-xs text-eco-500">{u.email}</p>
            </div>

            <div className="flex items-center gap-1 rounded-lg bg-eco-50 p-1">
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
