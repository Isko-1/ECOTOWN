"use client";

import { Wallet, Copy, Check, Clock } from "lucide-react";
import { useState } from "react";
import type { SpotDonation } from "@/lib/types";

/**
 * Показывает текущее состояние доната по метке.
 * - pending: заявка отправлена, ждёт модератора — номер и сумма ещё не видны.
 * - approved/completed: показываем цель, шкалу прогресса, номер Kaspi.
 * Комиссия — это ПРЕДУПРЕЖДЕНИЕ донору, а не реально удерживаемая сумма
 * (Kaspi P2P не умеет резать проценты автоматически).
 */
export function DonationProgress({
  donation,
  kaspiNumber,
  commissionPercent,
}: {
  donation: SpotDonation;
  kaspiNumber: string | null;
  commissionPercent: number;
}) {
  const [copied, setCopied] = useState(false);

  if (donation.status === "pending") {
    return (
      <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-eco-50 px-2.5 py-2 text-xs text-eco-700">
        <Clock size={13} />
        Донат подключается
      </div>
    );
  }

  if (donation.status === "rejected") {
    return null;
  }

  const percent = Math.min(100, Math.round((donation.collected_amount / donation.goal_amount) * 100));

  async function copyPhone() {
    if (!kaspiNumber) return;
    await navigator.clipboard.writeText(kaspiNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="mt-2 rounded-lg bg-eco-50 px-2.5 py-2 text-xs text-eco-800">
      <p className="flex items-center gap-1 font-medium">
        <Wallet size={13} /> {donation.purpose_text}
      </p>

      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-eco-100">
        <div className="h-full rounded-full bg-eco-600" style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-1 text-[11px] text-eco-500">
        Собрано {donation.collected_amount.toLocaleString("ru-RU")} ₸ из{" "}
        {donation.goal_amount.toLocaleString("ru-RU")} ₸
        {donation.status === "completed" && " — цель достигнута"}
      </p>

      {kaspiNumber && donation.status === "approved" && (
        <>
          <button
            type="button"
            onClick={copyPhone}
            className="mt-1.5 flex w-full items-center justify-between gap-2 rounded-md border border-eco-200 bg-white px-2 py-1.5 text-left hover:bg-eco-100"
          >
            <span>
              Kaspi: <span className="font-semibold">{kaspiNumber}</span>
            </span>
            {copied ? <Check size={13} className="text-eco-600" /> : <Copy size={13} className="text-eco-400" />}
          </button>
          <p className="mt-1 text-[10px] leading-snug text-eco-400">
            Комиссия сервиса ~{commissionPercent}% — учти её при переводе.
          </p>
        </>
      )}
    </div>
  );
}
