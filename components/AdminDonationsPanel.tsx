"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { SpotDonation, Spot, Profile, AppSettings } from "@/lib/types";

type Row = SpotDonation & { spots: Pick<Spot, "id" | "title"> | null; profiles: Pick<Profile, "display_name"> | null };

export function AdminDonationsPanel({
  pending,
  active,
  settings,
}: {
  pending: Row[];
  active: Row[];
  settings: AppSettings | null;
}) {
  const supabase = createClient();
  const [pendingRows, setPendingRows] = useState(pending);
  const [activeRows, setActiveRows] = useState(active);
  const [kaspiNumber, setKaspiNumber] = useState(settings?.kaspi_number ?? "");
  const [savingSettings, setSavingSettings] = useState(false);
  const [amounts, setAmounts] = useState<Record<string, string>>({});

  async function approve(id: string) {
    await supabase.from("spot_donations").update({ status: "approved", approved_at: new Date().toISOString() }).eq("id", id);
    const row = pendingRows.find((r) => r.id === id);
    setPendingRows((rows) => rows.filter((r) => r.id !== id));
    if (row) setActiveRows((rows) => [{ ...row, status: "approved" }, ...rows]);
  }

  async function reject(id: string) {
    await supabase.from("spot_donations").update({ status: "rejected" }).eq("id", id);
    setPendingRows((rows) => rows.filter((r) => r.id !== id));
  }

  async function addTransaction(donationId: string) {
    const amount = Number(amounts[donationId]);
    if (!amount || amount <= 0) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase.from("donation_transactions").insert({
      donation_id: donationId,
      amount,
      recorded_by: user?.id,
    });
    setAmounts((a) => ({ ...a, [donationId]: "" }));
    setActiveRows((rows) =>
      rows.map((r) =>
        r.id === donationId
          ? {
              ...r,
              collected_amount: r.collected_amount + amount,
              status: r.collected_amount + amount >= r.goal_amount ? "completed" : r.status,
            }
          : r
      )
    );
  }

  async function saveSettings() {
    setSavingSettings(true);
    await supabase.from("app_settings").update({ kaspi_number: kaspiNumber }).eq("id", true);
    setSavingSettings(false);
  }

  return (
    <div className="mt-8 flex flex-col gap-10">
      <section>
        <h2 className="font-display text-lg font-semibold text-eco-900">
          Заявки на рассмотрении ({pendingRows.length})
        </h2>
        {pendingRows.length === 0 && <p className="mt-2 text-sm text-eco-500">Пока пусто.</p>}
        <div className="mt-3 flex flex-col gap-3">
          {pendingRows.map((row) => (
            <div key={row.id} className="rounded-xl border border-eco-200 bg-white p-4">
              <a href={`/map?spot=${row.spot_id}`} className="font-medium text-eco-800 underline">
                {row.spots?.title ?? "Метка"}
              </a>
              <p className="mt-1 text-sm text-eco-600">
                Волонтёр: {row.profiles?.display_name ?? "неизвестно"} · нужно {row.goal_amount.toLocaleString("ru-RU")} ₸
              </p>
              <p className="mt-1 text-sm text-eco-700">{row.purpose_text}</p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={() => approve(row.id)}>
                  Одобрить
                </Button>
                <Button size="sm" variant="secondary" onClick={() => reject(row.id)}>
                  Отклонить
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold text-eco-900">Активные и завершённые сборы</h2>
        {activeRows.length === 0 && <p className="mt-2 text-sm text-eco-500">Пока пусто.</p>}
        <div className="mt-3 flex flex-col gap-3">
          {activeRows.map((row) => (
            <div key={row.id} className="rounded-xl border border-eco-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <a href={`/map?spot=${row.spot_id}`} className="font-medium text-eco-800 underline">
                  {row.spots?.title ?? "Метка"}
                </a>
                <span className="text-xs text-eco-500">
                  {row.status === "completed" ? "Цель достигнута" : "Собирается"}
                </span>
              </div>
              <p className="mt-1 text-sm text-eco-600">
                Собрано {row.collected_amount.toLocaleString("ru-RU")} ₸ из {row.goal_amount.toLocaleString("ru-RU")} ₸
              </p>
              {row.status === "approved" && (
                <div className="mt-2 flex gap-2">
                  <Input
                    type="number"
                    placeholder="Сумма поступления, ₸"
                    value={amounts[row.id] ?? ""}
                    onChange={(e) => setAmounts((a) => ({ ...a, [row.id]: e.target.value }))}
                    className="max-w-[180px]"
                  />
                  <Button size="sm" onClick={() => addTransaction(row.id)}>
                    Внести поступление
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold text-eco-900">Настройки</h2>
        <div className="mt-3 flex max-w-sm items-end gap-2">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-eco-800">Номер Kaspi (виден всем донорам)</label>
            <Input value={kaspiNumber} onChange={(e) => setKaspiNumber(e.target.value)} placeholder="+7 777 ..." />
          </div>
          <Button onClick={saveSettings} disabled={savingSettings}>
            {savingSettings ? "Сохраняем…" : "Сохранить"}
          </Button>
        </div>
      </section>
    </div>
  );
}
