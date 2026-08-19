"use client";

import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Send, MessageCircle, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import type { SpotMessage } from "@/lib/types";

type MessageWithProfile = SpotMessage & {
  profiles: { display_name: string; avatar_url: string | null } | null;
};

// ─── Skeleton loader для сообщений ───────────────────────────────────────────

function MessageSkeleton() {
  return (
    <div className="flex gap-3 animate-pulse">
      <div className="h-7 w-7 shrink-0 rounded-full bg-eco-100" />
      <div className="flex-1 space-y-1.5">
        <div className="flex gap-2">
          <div className="h-3 w-20 rounded bg-eco-100" />
          <div className="h-3 w-14 rounded bg-eco-100" />
        </div>
        <div className="h-3 w-full rounded bg-eco-100" />
        <div className="h-3 w-3/4 rounded bg-eco-100" />
      </div>
    </div>
  );
}

// ─── Основной компонент ───────────────────────────────────────────────────────

interface SpotChatProps {
  spotId: string;
  spotTitle: string;
  userId: string | null;
  // inline=true — встроенный в sidebar (нет Dialog-обёртки)
  // inline=false (или не указан) — отдельный выдвижной Dialog (обратная совместимость)
  inline?: boolean;
  // Пропсы Dialog-режима (используются только когда inline=false)
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SpotChat({
  spotId,
  spotTitle,
  userId,
  inline = false,
  open,
  onOpenChange,
}: SpotChatProps) {
  // В inline-режиме чат всегда "открыт" — монтируется при переключении таба
  const isOpen = inline ? true : (open ?? false);

  const [supabase] = useState(() => createClient());
  const [messages, setMessages] = useState<MessageWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [sendError, setSendError] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Загрузка сообщений + realtime подписка ───────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    async function loadMessages() {
      setLoadError(false);
      const { data, error } = await supabase
        .from("spot_messages")
        .select("*, profiles(display_name, avatar_url)")
        .eq("spot_id", spotId)
        .order("created_at", { ascending: true });

      if (cancelled) return;

      if (error) {
        setLoadError(true);
        setLoading(false);
        return;
      }

      setMessages((data ?? []) as unknown as MessageWithProfile[]);
      setLoading(false);
    }

    setLoading(true);
    loadMessages();

    const channel = supabase
      .channel(`spot_messages_${spotId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "spot_messages", filter: `spot_id=eq.${spotId}` },
        () => loadMessages()
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, spotId]);

  // ── Прокрутка вниз при новых сообщениях ─────────────────────────────────
  useEffect(() => {
    if (loading) return;
    // Небольшая задержка, чтобы DOM успел отрисоваться
    const timer = setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
    return () => clearTimeout(timer);
  }, [messages, loading]);

  // ── Фокус на инпут при открытии ─────────────────────────────────────────
  useEffect(() => {
    if (isOpen && !loading) {
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, loading]);

  // ── Отправка сообщения ───────────────────────────────────────────────────
  async function handleSend() {
    if (!userId || !text.trim()) return;
    setSending(true);
    setSendError(false);
    try {
      const { error } = await supabase
        .from("spot_messages")
        .insert({ spot_id: spotId, user_id: userId, message: text.trim() });
      if (error) throw error;
      setText("");
    } catch {
      setSendError(true);
    } finally {
      setSending(false);
    }
  }

  // ── Тело чата (переиспользуется в обоих режимах) ─────────────────────────
  const chatBody = (
    <>
      {/* Область сообщений */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {loading ? (
          // Skeleton loader вместо текста
          <div className="space-y-4 pt-2">
            <MessageSkeleton />
            <MessageSkeleton />
            <MessageSkeleton />
          </div>
        ) : loadError ? (
          // Состояние ошибки загрузки
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-eco-400 py-8">
            <AlertCircle size={28} className="text-red-400" />
            <p className="text-sm">Не удалось загрузить сообщения</p>
            <button
              onClick={() => { setLoading(true); setLoadError(false); }}
              className="flex items-center gap-1.5 text-xs font-medium text-eco-600 hover:text-eco-800 underline"
            >
              <RefreshCw size={12} /> Попробовать снова
            </button>
          </div>
        ) : messages.length === 0 ? (
          // Пустой чат
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-eco-400 py-8">
            <MessageCircle size={28} />
            <p className="text-sm">Пока нет сообщений — начните обсуждение первым</p>
          </div>
        ) : (
          // Список сообщений
          messages.map((m) => (
            <div key={m.id} className="flex gap-2.5">
              {/* Аватар с инициалом */}
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-eco-600 text-xs font-semibold text-white">
                {(m.profiles?.display_name ?? "?").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-semibold text-eco-900 truncate">
                    {m.profiles?.display_name ?? "Волонтёр"}
                  </span>
                  <span className="shrink-0 text-[11px] text-eco-400">
                    {new Date(m.created_at).toLocaleString("ru-RU", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-eco-800 break-words">{m.message}</p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Поле ввода */}
      <div className="border-t border-eco-100 p-3">
        {sendError && (
          <p className="mb-2 flex items-center gap-1.5 text-xs text-red-600">
            <AlertCircle size={12} /> Не удалось отправить. Попробуйте снова.
          </p>
        )}
        {userId ? (
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <input
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Написать сообщение…"
              maxLength={500}
              className="flex-1 min-w-0 rounded-full border border-eco-200 px-4 py-2 text-sm outline-none focus:border-eco-500 focus:ring-2 focus:ring-eco-200 transition-shadow"
            />
            <Button size="sm" disabled={sending || !text.trim()} type="submit" aria-label="Отправить">
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </Button>
          </form>
        ) : (
          <p className="text-center text-sm text-eco-600">
            <Link href="/login" className="font-medium underline">Войдите</Link>, чтобы написать сообщение
          </p>
        )}
      </div>
    </>
  );

  // ── Inline-режим (встроен в sidebar) ────────────────────────────────────────
  if (inline) {
    return (
      <div className="flex h-full flex-col">
        {chatBody}
      </div>
    );
  }

  // ── Dialog-режим (обратная совместимость, если где-то ещё используется) ─────
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        {/* z-[1100] — выше Leaflet (z-700+), ниже Modal (z-[1101]) */}
        <Dialog.Overlay className="fixed inset-0 z-[1100] bg-black/30 data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out" />
        <Dialog.Content
          className={[
            "fixed right-0 top-0 z-[1101] flex h-full w-full max-w-sm flex-col bg-white shadow-xl",
            "focus:outline-none",
            // Анимация через tailwindcss-animate
            "data-[state=open]:animate-slide-in-right",
            "data-[state=closed]:animate-slide-out-right",
          ].join(" ")}
        >
          <div className="flex items-center justify-between border-b border-eco-100 px-4 py-3">
            <Dialog.Title className="font-display text-sm font-semibold text-eco-900">
              Обсуждение: {spotTitle}
            </Dialog.Title>
            <Dialog.Close className="rounded-full p-1 text-eco-700 hover:bg-eco-50 transition-colors">
              <X size={18} />
              <span className="sr-only">Закрыть</span>
            </Dialog.Close>
          </div>
          {chatBody}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
