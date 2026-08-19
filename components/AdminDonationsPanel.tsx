"use client";

import type { SpotDonation, Spot, Profile, AppSettings } from "@/lib/types";

type PendingRow = SpotDonation & {
  spots: Pick<Spot, "id" | "title"> | null;
  profiles: Pick<Profile, "display_name"> | null;
};

interface AdminDonationsPanelProps {
  pending: PendingRow[];
  active: PendingRow[];
  settings: AppSettings | null;
}

export function AdminDonationsPanel({
  pending,
  active,
  settings,
}: AdminDonationsPanelProps) {
  return (
    <div className="mt-6 space-y-6">
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-eco-900">
          Заявки на донаты ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">Нет новых заявок.</p>
        ) : (
          <ul className="mt-2 divide-y">
            {pending.map((item) => (
              <li key={item.id} className="py-2">
                <p className="text-sm font-medium">
                  {item.spots?.title ?? "Метка без названия"} — {item.amount} ₸
                </p>
                <p className="text-xs text-gray-500">
                  От: {item.profiles?.display_name ?? "Аноним"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-eco-900">
          Активные и завершенные сборы ({active.length})
        </h2>
        {active.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">Нет активных сборов.</p>
        ) : (
          <ul className="mt-2 divide-y">
            {active.map((item) => (
              <li key={item.id} className="py-2">
                <p className="text-sm font-medium">
                  {item.spots?.title ?? "Метка без названия"} [{item.status}]
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}