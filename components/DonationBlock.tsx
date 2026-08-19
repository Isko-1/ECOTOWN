"use client";

import { useState } from "react";
import { Wallet, Copy, Check } from "lucide-react";

const KASPI_NAME = process.env.NEXT_PUBLIC_KASPI_NAME;
const KASPI_PHONE = process.env.NEXT_PUBLIC_KASPI_PHONE;

/** Блок доната — показывается только для меток со сложностью 4–5. */
export function DonationBlock() {
  const [copied, setCopied] = useState(false);

  if (!KASPI_PHONE) return null;

  async function copyPhone() {
    await navigator.clipboard.writeText(KASPI_PHONE!);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="mt-2 rounded-lg bg-eco-50 px-2.5 py-2 text-xs text-eco-800">
      <p className="flex items-center gap-1 font-medium">
        <Wallet size={13} /> Сложная уборка — можно поддержать донатом
      </p>
      <button
        type="button"
        onClick={copyPhone}
        className="mt-1.5 flex w-full items-center justify-between gap-2 rounded-md border border-eco-200 bg-white px-2 py-1.5 text-left hover:bg-eco-100"
      >
        <span>
          Kaspi: <span className="font-semibold">{KASPI_PHONE}</span>
          {KASPI_NAME && <span className="text-eco-500"> · {KASPI_NAME}</span>}
        </span>
        {copied ? <Check size={13} className="text-eco-600" /> : <Copy size={13} className="text-eco-400" />}
      </button>
      <p className="mt-1.5 text-[11px] leading-snug text-eco-500">
        Хочешь, чтобы донаты по своей метке шли на свой номер? Напиши через форму на{" "}
        <a href="/#contact" className="underline">
          главной странице
        </a>{" "}
        — укажи ник, подключим вручную.
      </p>
    </div>
  );
}
