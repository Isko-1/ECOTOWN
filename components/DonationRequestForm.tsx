"use client";

import { useState } from "react";
import { HandCoins } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

/**
 * Заявку на донат подаёт ТОЛЬКО волонтёр, уже взявший метку в работу — не автор метки.
 * Автор часто просто увидел мусор и не знает, что конкретно нужно для уборки (перчатки,
 * мешки, вывоз и т.д.), а волонтёр это уже понимает на месте.
 *
 * Показывать этот компонент в SpotPopup только при isVolunteer === true.
 */
export function DonationRequestForm({
  spotId,
  spotTitle,
  userId,
  requesterName,
  onDone,
}: {
  spotId: string;
  spotTitle: string;
  userId: string;
  requesterName: string;
  onDone: () => void;
}) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [purpose, setPurpose] = useState("");
  const [goal, setGoal] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const goalAmount = Number(goal);
    if (!goalAmount || goalAmount <= 0) {
      setError("Укажи сумму больше нуля");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      // RLS сам проверит, что userId реально есть в spot_volunteers для этой метки —
      // если нет, insert будет отклонён базой, даже если кто-то обойдёт эту форму через devtools.
      const { error: insertError } = await supabase.from("spot_donations").insert({
        spot_id: spotId,
        requested_by: userId,
        purpose_text: purpose,
        goal_amount: goalAmount,
        contact_phone: phone || null,
      });
      if (insertError) throw insertError;

      // Письмо админу — ошибка отправки не должна ломать создание заявки
      fetch("/api/donation-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spotId, spotTitle, purpose, goalAmount, requesterName, contactPhone: phone }),
      }).catch(() => {});

      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось отправить заявку");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <Button type="button" size="sm" variant="secondary" onClick={() => setOpen(true)}>
        <HandCoins size={14} /> Запросить донат
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-2 rounded-lg bg-eco-50 p-2.5">
      <div>
        <label className="mb-1 block text-xs font-medium text-eco-800">На что нужны деньги</label>
        <Textarea
          required
          rows={2}
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          placeholder="Например: перчатки, мешки для мусора, вывоз"
          className="text-xs"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-eco-800">Сколько нужно, ₸</label>
        <Input
          required
          type="number"
          min={1}
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="9000"
          className="text-xs"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-eco-800">Контактный телефон (Kaspi / WhatsApp)</label>
        <Input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+7 (705) 000-00-00"
          className="text-xs"
        />
      </div>
      <p className="text-[11px] leading-snug text-eco-500">
        Заявка уйдёт модератору — он проверит и подключит номер для перевода, это может занять время.
      </p>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={busy} className="flex-1">
          {busy ? "Отправляем…" : "Отправить заявку"}
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={() => setOpen(false)} disabled={busy}>
          Отмена
        </Button>
      </div>
    </form>
  );
}
