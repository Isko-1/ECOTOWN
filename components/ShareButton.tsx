"use client";

import { useState } from "react";
import { Share2, Copy, Check, Send, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function ShareButton({
  spotTitle,
  spotId,
  className = "",
}: {
  spotTitle: string;
  spotId: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const getShareUrl = () => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/map?spot=${spotId}`;
    }
    return "";
  };

  const shareUrl = getShareUrl();
  const shareText = `Присоединяйся к уборке в Орале! Метка: «${spotTitle}» на EcoTown:`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `EcoTown — ${spotTitle}`,
          text: shareText,
          url: shareUrl,
        });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  };

  const openShareWindow = async (url: string) => {
    const shared = await handleNativeShare();
    if (!shared) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs font-medium text-eco-700"
      >
        <Share2 size={14} />
        Поделиться
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-xl border border-eco-100 bg-white p-2 shadow-xl animate-in fade-in zoom-in-95">
            <p className="px-2 py-1 text-[11px] font-medium text-eco-400 uppercase tracking-wider">
              Поделиться меткой
            </p>

            <button
              type="button"
              onClick={handleCopy}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-eco-800 hover:bg-eco-50 transition-colors"
            >
              {copied ? (
                <Check size={15} className="text-eco-600" />
              ) : (
                <Copy size={15} className="text-eco-500" />
              )}
              {copied ? "Ссылка скопирована!" : "Скопировать ссылку"}
            </button>

            <button
              type="button"
              onClick={() =>
                openShareWindow(
                  `https://api.whatsapp.com/send?text=${encodeURIComponent(
                    `${shareText} ${shareUrl}`
                  )}`
                )
              }
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-eco-800 hover:bg-eco-50 transition-colors"
            >
              <PhoneCall size={15} className="text-green-600" />
              WhatsApp
            </button>

            <button
              type="button"
              onClick={() =>
                openShareWindow(
                  `https://t.me/share/url?url=${encodeURIComponent(
                    shareUrl
                  )}&text=${encodeURIComponent(shareText)}`
                )
              }
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-eco-800 hover:bg-eco-50 transition-colors"
            >
              <Send size={15} className="text-blue-500" />
              Telegram
            </button>
          </div>
        </>
      )}
    </div>
  );
}
