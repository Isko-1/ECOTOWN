"use client";

import { Download } from "lucide-react";
import type { Spot } from "@/lib/types";
import { Button } from "@/components/ui/Button";

function formatIcsDate(date: Date) {
  return date.toISOString().replace(/-|:|\.\d\d\d/g, "");
}

export function IcsExportButton({ spot }: { spot: Spot }) {
  if (!spot.event_date) return null;

  const handleDownload = () => {
    const startDate = new Date(spot.event_date!);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//EcoTown Uralsk//Subbotnik//RU",
      "METHOD:REQUEST",
      "BEGIN:VEVENT",
      `UID:spot-${spot.id}@ecotown.kz`,
      `DTSTAMP:${formatIcsDate(new Date())}`,
      `DTSTART:${formatIcsDate(startDate)}`,
      `DTEND:${formatIcsDate(endDate)}`,
      `SUMMARY:Субботник EcoTown: ${spot.title.replace(/\n/g, " ")}`,
      `DESCRIPTION:${spot.description.replace(/\n/g, " ")}`,
      `LOCATION:Уральск (Координаты: ${spot.lat.toFixed(5)}\\, ${spot.lng.toFixed(5)})`,
      "STATUS:CONFIRMED",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `subbotnik-${spot.id.slice(0, 6)}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={handleDownload}
      className="text-xs border-eco-200 text-eco-800 hover:bg-eco-50 gap-1.5"
      title="Скачать файл события для Apple Calendar / Outlook (.ics)"
    >
      <Download size={14} className="text-eco-600" />
      <span>Скачать .ics (Apple/Outlook)</span>
    </Button>
  );
}
