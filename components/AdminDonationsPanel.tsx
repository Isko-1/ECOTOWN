"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Phone,
  Copy,
  ExternalLink,
  Search,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Sparkles,
  RefreshCw,
  Check,
  Ban,
  MessageSquare,
  BadgeCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { SpotDonation, Spot, Profile, AppSettings, DonationTransaction } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";

export type DonationWithDetails = SpotDonation & {
  spots: Pick<Spot, "id" | "title"> | null;
  profiles: Pick<Profile, "id" | "display_name" | "phone" | "avatar_url"> | null;
  donation_transactions?: DonationTransaction[];
};

interface AdminDonationsPanelProps {
  initialDonations: DonationWithDetails[];
  initialSettings: AppSettings | null;
  currentUserId: string;
}

type TabType = "all" | "pending" | "approved" | "completed" | "rejected";

export function AdminDonationsPanel({
  initialDonations,
  initialSettings,
  currentUserId,
}: AdminDonationsPanelProps) {
  const supabase = createClient();

  const [donations, setDonations] = useState<DonationWithDetails[]>(initialDonations);
  const [settings, setSettings] = useState<AppSettings | null>(initialSettings);
  const [activeTab, setActiveTab] = useState<TabType>("pending");
  const [searchQuery, setSearchQuery] = useState("");

  // Состояния для редактора Kaspi-номера
  const [editingKaspi, setEditingKaspi] = useState(false);
  const [kaspiInput, setKaspiInput] = useState(settings?.kaspi_number ?? "");
  const [kaspiBusy, setKaspiBusy] = useState(false);
  const [kaspiSaved, setKaspiSaved] = useState(false);

  // Состояние модального окна добавления перевода
  const [selectedDonationForTx, setSelectedDonationForTx] = useState<DonationWithDetails | null>(null);
  const [txAmount, setTxAmount] = useState("");
  const [txNote, setTxNote] = useState("");
  const [txBusy, setTxBusy] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);

  // Развернутые истории транзакций по id заявки
  const [expandedTx, setExpandedTx] = useState<Record<string, boolean>>({});

  // Скопированные телефоны
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Движок действий
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);

  // Подсчет количества по статусам
  const counts = {
    pending: donations.filter((d) => d.status === "pending").length,
    approved: donations.filter((d) => d.status === "approved").length,
    completed: donations.filter((d) => d.status === "completed").length,
    rejected: donations.filter((d) => d.status === "rejected").length,
    all: donations.length,
  };

  // Фильтрация заявок
  const filteredDonations = donations.filter((item) => {
    // Таб-фильтр
    if (activeTab !== "all" && item.status !== activeTab) return false;

    // Поисковый запрос
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const spotTitle = item.spots?.title?.toLowerCase() ?? "";
    const name = item.profiles?.display_name?.toLowerCase() ?? "";
    const phoneNum = (item.contact_phone || item.profiles?.phone || "").toLowerCase();
    const purpose = item.purpose_text.toLowerCase();

    return spotTitle.includes(q) || name.includes(q) || phoneNum.includes(q) || purpose.includes(q);
  });

  // Одобрение заявки
  async function handleApprove(id: string) {
    setActionBusyId(id);
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from("spot_donations")
        .update({ status: "approved", approved_at: now })
        .eq("id", id);

      if (error) throw error;

      setDonations((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: "approved", approved_at: now } : d))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Не удалось одобрить заявку");
    } finally {
      setActionBusyId(null);
    }
  }

  // Отклонение заявки
  async function handleReject(id: string) {
    if (!confirm("Вы уверены, что хотите отклонить эту заявку?")) return;
    setActionBusyId(id);
    try {
      const { error } = await supabase
        .from("spot_donations")
        .update({ status: "rejected" })
        .eq("id", id);

      if (error) throw error;

      setDonations((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: "rejected" } : d))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Не удалось отклонить заявку");
    } finally {
      setActionBusyId(null);
    }
  }

  // Сохранение настроек Kaspi
  async function handleSaveKaspi(e: React.FormEvent) {
    e.preventDefault();
    setKaspiBusy(true);
    setKaspiSaved(false);
    try {
      const { error } = await supabase
        .from("app_settings")
        .update({ kaspi_number: kaspiInput || null, updated_at: new Date().toISOString() })
        .eq("id", true);

      if (error) throw error;

      setSettings((prev) => (prev ? { ...prev, kaspi_number: kaspiInput } : null));
      setEditingKaspi(false);
      setKaspiSaved(true);
      setTimeout(() => setKaspiSaved(false), 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Не удалось сохранить номер Kaspi");
    } finally {
      setKaspiBusy(false);
    }
  }

  // Внесение перевода
  async function handleAddTransaction(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDonationForTx) return;

    const amountNum = Number(txAmount);
    if (!amountNum || amountNum <= 0) {
      setTxError("Введите сумму больше 0 ₸");
      return;
    }

    setTxBusy(true);
    setTxError(null);

    try {
      const { data: newTx, error: txErr } = await supabase
        .from("donation_transactions")
        .insert({
          donation_id: selectedDonationForTx.id,
          amount: amountNum,
          recorded_by: currentUserId,
          note: txNote || null,
        })
        .select()
        .single();

      if (txErr) throw txErr;

      // Обновляем локальное состояние заявки (сумму и транзакции)
      setDonations((prev) =>
        prev.map((d) => {
          if (d.id !== selectedDonationForTx.id) return d;
          const newCollected = d.collected_amount + amountNum;
          const newStatus = newCollected >= d.goal_amount ? "completed" : d.status;
          const existingTxs = d.donation_transactions ?? [];
          return {
            ...d,
            collected_amount: newCollected,
            status: newStatus,
            donation_transactions: [newTx as DonationTransaction, ...existingTxs],
          };
        })
      );

      setSelectedDonationForTx(null);
      setTxAmount("");
      setTxNote("");
    } catch (err) {
      setTxError(err instanceof Error ? err.message : "Ошибка при сохранении перевода");
    } finally {
      setTxBusy(false);
    }
  }

  // Копирование телефона
  function handleCopyPhone(phoneStr: string, key: string) {
    navigator.clipboard.writeText(phoneStr);
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const toggleTxHistory = (id: string) => {
    setExpandedTx((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      {/* 1. Блок сводки и общего Kaspi номера */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Карточка 1: Настройки Kaspi */}
        <div className="md:col-span-2 rounded-2xl border border-eco-100 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <CreditCard size={20} />
              </div>
              <div>
                <h3 className="font-display font-semibold text-eco-900">Главный реквизит Kaspi</h3>
                <p className="text-xs text-eco-500">
                  Этот номер видят пользователи в деталях одобренных меток для перевода средств
                </p>
              </div>
            </div>
            {!editingKaspi && (
              <Button size="sm" variant="secondary" onClick={() => setEditingKaspi(true)}>
                Изменить
              </Button>
            )}
          </div>

          {editingKaspi ? (
            <form onSubmit={handleSaveKaspi} className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                value={kaspiInput}
                onChange={(e) => setKaspiInput(e.target.value)}
                placeholder="+7 (777) 000-00-00"
                className="text-sm font-medium"
              />
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={kaspiBusy}>
                  {kaspiBusy ? "Сохранение…" : "Сохранить"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setEditingKaspi(false);
                    setKaspiInput(settings?.kaspi_number ?? "");
                  }}
                >
                  Отмена
                </Button>
              </div>
            </form>
          ) : (
            <div className="mt-3 flex items-center gap-3">
              <span className="font-mono text-lg font-bold text-eco-900">
                {settings?.kaspi_number || "Номер не указан"}
              </span>
              {settings?.kaspi_number && (
                <button
                  type="button"
                  onClick={() => handleCopyPhone(settings.kaspi_number!, "kaspi-global")}
                  className="inline-flex items-center gap-1 rounded-lg bg-eco-50 px-2.5 py-1 text-xs font-medium text-eco-700 hover:bg-eco-100"
                >
                  {copiedId === "kaspi-global" ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  {copiedId === "kaspi-global" ? "Скопировано" : "Копировать"}
                </button>
              )}
              {kaspiSaved && <span className="text-xs font-medium text-emerald-600">✓ Сохранено</span>}
            </div>
          )}
        </div>

        {/* Карточка 2: Счётчики статусов */}
        <div className="rounded-2xl border border-eco-100 bg-white p-5 shadow-sm flex flex-col justify-between">
          <h3 className="font-display font-semibold text-eco-900 text-sm">Статистика заявок</h3>
          <div className="mt-3 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl bg-amber-50 p-2">
              <span className="text-xl font-bold text-amber-700">{counts.pending}</span>
              <p className="text-[11px] font-medium text-amber-800">⏳ Ожидают</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-2">
              <span className="text-xl font-bold text-emerald-700">{counts.approved}</span>
              <p className="text-[11px] font-medium text-emerald-800">✅ Активны</p>
            </div>
            <div className="rounded-xl bg-blue-50 p-2">
              <span className="text-xl font-bold text-blue-700">{counts.completed}</span>
              <p className="text-[11px] font-medium text-blue-800">🎯 Завершено</p>
            </div>
            <div className="rounded-xl bg-rose-50 p-2">
              <span className="text-xl font-bold text-rose-700">{counts.rejected}</span>
              <p className="text-[11px] font-medium text-rose-800">❌ Отклонено</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Табы и Живой Поиск */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-eco-100 bg-white p-3 shadow-sm">
        {/* Кнопки-табы */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveTab("pending")}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
              activeTab === "pending"
                ? "bg-amber-500 text-white shadow-sm"
                : "bg-eco-50 text-eco-700 hover:bg-eco-100"
            }`}
          >
            ⏳ На рассмотрении ({counts.pending})
          </button>
          <button
            onClick={() => setActiveTab("approved")}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
              activeTab === "approved"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-eco-50 text-eco-700 hover:bg-eco-100"
            }`}
          >
            ✅ Активные ({counts.approved})
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
              activeTab === "completed"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-eco-50 text-eco-700 hover:bg-eco-100"
            }`}
          >
            🎯 Завершённые ({counts.completed})
          </button>
          <button
            onClick={() => setActiveTab("rejected")}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
              activeTab === "rejected"
                ? "bg-rose-600 text-white shadow-sm"
                : "bg-eco-50 text-eco-700 hover:bg-eco-100"
            }`}
          >
            ❌ Отклоненные ({counts.rejected})
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
              activeTab === "all"
                ? "bg-eco-800 text-white shadow-sm"
                : "bg-eco-50 text-eco-700 hover:bg-eco-100"
            }`}
          >
            Все ({counts.all})
          </button>
        </div>

        {/* Поиск */}
        <div className="relative min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-eco-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по названию, имени, номеру…"
            className="w-full rounded-xl border border-eco-200 py-1.5 pl-9 pr-3 text-xs text-eco-900 placeholder:text-eco-400 focus:border-eco-500 focus:outline-none"
          />
        </div>
      </div>

      {/* 3. Список заявок */}
      {filteredDonations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-eco-200 bg-white p-12 text-center">
          <p className="text-sm font-medium text-eco-600">Заявок в этой категории не найдено</p>
          <p className="mt-1 text-xs text-eco-400">Попробуйте выбрать другой фильтр или изменить поисковый запрос.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDonations.map((item) => {
            const phoneNum = item.contact_phone || item.profiles?.phone;
            const progressPercent = Math.min(
              100,
              Math.round((item.collected_amount / item.goal_amount) * 100)
            );
            const isBusy = actionBusyId === item.id;
            const isTxExpanded = expandedTx[item.id] ?? false;
            const transactionsList = item.donation_transactions ?? [];

            return (
              <div
                key={item.id}
                className="overflow-hidden rounded-2xl border border-eco-100 bg-white shadow-sm transition hover:shadow-md"
              >
                {/* Верхняя панель карточки */}
                <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between border-b border-eco-50">
                  <div>
                    {/* Метка и статус */}
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-display text-base font-bold text-eco-900">
                        {item.spots?.title ?? "Метка без названия"}
                      </h4>
                      <Link
                        href={`/map?spotId=${item.spot_id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-xs font-medium text-eco-600 hover:text-eco-800 underline"
                      >
                        На карте <ExternalLink size={12} />
                      </Link>
                      <StatusBadge status={item.status} />
                    </div>

                    {/* Автор заявки и контакты */}
                    <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-eco-600">
                      <span className="font-medium text-eco-900">
                        Заявитель: {item.profiles?.display_name ?? "Аноним"}
                      </span>

                      {phoneNum ? (
                        <div className="flex items-center gap-1.5 bg-eco-50 px-2 py-0.5 rounded-lg border border-eco-100">
                          <Phone size={12} className="text-eco-500" />
                          <span className="font-mono font-semibold text-eco-900">{phoneNum}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyPhone(phoneNum, item.id)}
                            className="p-1 hover:text-eco-900 text-eco-500 transition"
                            title="Скопировать номер"
                          >
                            {copiedId === item.id ? (
                              <Check size={13} className="text-emerald-600" />
                            ) : (
                              <Copy size={13} />
                            )}
                          </button>
                          <a
                            href={`https://wa.me/${phoneNum.replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 text-emerald-600 hover:text-emerald-700 font-bold"
                            title="Написать в WhatsApp"
                          >
                            WA
                          </a>
                        </div>
                      ) : (
                        <span className="text-eco-400 italic">Номер телефона не указан</span>
                      )}
                      <span className="text-eco-400">
                        Подана: {new Date(item.created_at).toLocaleDateString("ru-RU")}
                      </span>
                    </div>
                  </div>

                  {/* Цель и собранная сумма */}
                  <div className="sm:text-right bg-eco-50/70 p-3 rounded-xl border border-eco-100 min-w-[170px]">
                    <div className="text-xs text-eco-500">Собрано / Цель</div>
                    <div className="font-display font-bold text-base text-eco-900">
                      {item.collected_amount.toLocaleString("ru-RU")} ₸ / {item.goal_amount.toLocaleString("ru-RU")} ₸
                    </div>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-eco-200">
                      <div
                        className="h-full bg-gradient-to-r from-eco-500 to-emerald-500 transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <div className="mt-1 text-[11px] font-semibold text-eco-600 text-right">
                      {progressPercent}% собрано
                    </div>
                  </div>
                </div>

                {/* Описание цели */}
                <div className="px-5 py-3 bg-eco-50/30">
                  <span className="text-xs font-semibold text-eco-700">На что нужны деньги: </span>
                  <p className="inline text-xs text-eco-900 leading-relaxed">{item.purpose_text}</p>
                </div>

                {/* Нижняя панель действий */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white border-t border-eco-50">
                  <div className="flex items-center gap-2">
                    {transactionsList.length > 0 && (
                      <button
                        type="button"
                        onClick={() => toggleTxHistory(item.id)}
                        className="flex items-center gap-1 text-xs font-medium text-eco-700 hover:text-eco-900 bg-eco-50 px-3 py-1.5 rounded-lg border border-eco-200"
                      >
                        📜 Переводы ({transactionsList.length})
                        {isTxExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Кнопки для PENDING */}
                    {item.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(item.id)}
                          disabled={isBusy}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <CheckCircle2 size={15} /> Одобрить
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleReject(item.id)}
                          disabled={isBusy}
                          className="text-rose-600 border-rose-200 hover:bg-rose-50"
                        >
                          <XCircle size={15} /> Отклонить
                        </Button>
                      </>
                    )}

                    {/* Кнопка для APPROVED (Активные) */}
                    {item.status === "approved" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedDonationForTx(item);
                            setTxAmount("");
                            setTxNote("");
                            setTxError(null);
                          }}
                          className="bg-eco-800 hover:bg-eco-900 text-white"
                        >
                          <Plus size={15} /> Внести перевод
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleReject(item.id)}
                          disabled={isBusy}
                          className="text-rose-600 border-rose-200 hover:bg-rose-50"
                        >
                          Отклонить
                        </Button>
                      </>
                    )}

                    {/* Кнопки для REJECTED / COMPLETED */}
                    {(item.status === "rejected" || item.status === "completed") && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleApprove(item.id)}
                        disabled={isBusy}
                        className="text-eco-700"
                      >
                        <RefreshCw size={13} /> Вернуть в работу
                      </Button>
                    )}
                  </div>
                </div>

                {/* Выпадающий список историй переводов */}
                {isTxExpanded && (
                  <div className="bg-eco-50/80 p-4 border-t border-eco-100">
                    <h5 className="text-xs font-bold text-eco-800 mb-2">История зафиксированных поступлений:</h5>
                    {transactionsList.length === 0 ? (
                      <p className="text-xs text-eco-500">Поступлений пока не зафиксировано.</p>
                    ) : (
                      <ul className="divide-y divide-eco-200/60 text-xs">
                        {transactionsList.map((tx) => (
                          <li key={tx.id} className="py-2 flex items-center justify-between">
                            <div>
                              <span className="font-bold text-emerald-700">+{tx.amount.toLocaleString("ru-RU")} ₸</span>
                              {tx.note && <span className="ml-2 text-eco-600">— {tx.note}</span>}
                            </div>
                            <span className="text-[11px] text-eco-400">
                              {new Date(tx.created_at).toLocaleString("ru-RU")}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Модальное окно добавления перевода */}
      {selectedDonationForTx && (
        <Modal
          open={!!selectedDonationForTx}
          onOpenChange={(open) => !open && setSelectedDonationForTx(null)}
          title="Фиксация пришедшего доната"
        >
          <form onSubmit={handleAddTransaction} className="space-y-4">
            <p className="text-xs text-eco-600">
              Метка: <strong className="text-eco-900">{selectedDonationForTx.spots?.title}</strong>
              <br />
              Осталось до цели:{" "}
              <strong>
                {(
                  selectedDonationForTx.goal_amount - selectedDonationForTx.collected_amount
                ).toLocaleString("ru-RU")}{" "}
                ₸
              </strong>
            </p>

            <div>
              <label className="mb-1 block text-xs font-semibold text-eco-800">
                Сумма перевода (₸) <span className="text-rose-500">*</span>
              </label>
              <Input
                type="number"
                required
                min={1}
                value={txAmount}
                onChange={(e) => setTxAmount(e.target.value)}
                placeholder="5000"
                autoFocus
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-eco-800">
                Примечание / Имя отправителя (необязательно)
              </label>
              <Input
                value={txNote}
                onChange={(e) => setTxNote(e.target.value)}
                placeholder="Например: Перевод от Армана в Kaspi"
              />
            </div>

            {txError && <p className="text-xs text-rose-600 font-medium">{txError}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setSelectedDonationForTx(null)}
                disabled={txBusy}
              >
                Отмена
              </Button>
              <Button type="submit" size="sm" disabled={txBusy} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {txBusy ? "Сохраняем…" : "Зафиксировать ₸"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: SpotDonation["status"] }) {
  switch (status) {
    case "pending":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
          <Clock size={12} /> На рассмотрении
        </span>
      );
    case "approved":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
          <BadgeCheck size={12} /> Активен
        </span>
      );
    case "completed":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-bold text-blue-800">
          <Sparkles size={12} /> Сбор завершен
        </span>
      );
    case "rejected":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-800">
          <Ban size={12} /> Отклонено
        </span>
      );
  }
}