"use client";

import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Send, MessageCircle } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import type { SpotMessage } from "@/lib/types";

type MessageWithProfile = SpotMessage & {
  profiles: { display_name: string; avatar_url: string | null } | null;
};

export function SpotChat({
  spotId,
  spotTitle,
  userId,
  open,
  onOpenChange,
}: {
  spotId: string;
  spotTitle: string;
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [supabase] = useState(() => createClient());
  const [messages, setMessages] = useState<MessageWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function loadMessages() {
      const { data } = await supabase
        .from("spot_messages")
        .select("*, profiles(display_name, avatar_url)")
        .eq("spot_id", spotId)
        .order("created_at", { ascending: true });

      if (!cancelled) {
        setMessages((data ?? []) as unknown as MessageWithProfile[]);
        setLoading(false);
      }
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
  }, [open, spotId, supabase]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!userId || !text.trim()) return;
    setSending(true);
    await supabase.from("spot_messages").insert({ spot_id: spotId, user_id: userId, message: text.trim() });
    setText("");
    setSending(false);
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex h-[70vh] w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl bg-white shadow-xl focus:outline-none">
          <div className="flex items-center justify-between border-b border-eco-100 px-4 py-3">
            <Dialog.Title className="font-display text-sm font-semibold text-eco-900">
              Обсуждение: {spotTitle}
            </Dialog.Title>
            <Dialog.Close className="rounded-full p-1 text-eco-700 hover:bg-eco-50">
              <X size={18} />
              <span className="sr-only">Закрыть</span>
            </Dialog.Close>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {loading ? (
              <p className="text-center text-sm text-eco-400">Загрузка…</p>
            ) : messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-eco-400">
                <MessageCircle size={28} />
                <p className="text-sm">Пока нет сообщений — начните обсуждение первым</p>
              </div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className="flex gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-eco-600 text-xs font-semibold text-white">
                    {(m.profiles?.display_name ?? "?").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-semibold text-eco-900">
                        {m.profiles?.display_name ?? "Волонтёр"}
                      </span>
                      <span className="text-[11px] text-eco-400">
                        {new Date(m.created_at).toLocaleString("ru-RU", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-eco-800">{m.message}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-eco-100 p-3">
            {userId ? (
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
              >
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Написать сообщение…"
                  className="flex-1 rounded-full border border-eco-200 px-4 py-2 text-sm outline-none focus:border-eco-500"
                />
                <Button size="sm" disabled={sending || !text.trim()} type="submit">
                  <Send size={16} />
                </Button>
              </form>
            ) : (
              <p className="text-center text-sm text-eco-600">
                <Link href="/login" className="font-medium underline">Войдите</Link>, чтобы написать сообщение
              </p>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
