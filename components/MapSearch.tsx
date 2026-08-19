"use client";

import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

export function MapSearch({ onFound }: { onFound: (lat: number, lng: number, label: string) => void }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);

    try {
      // Дописываем город, чтобы поиск не улетал за пределы Орала
      const q = encodeURIComponent(`${query}, Уральск, Казахстан`);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${q}`);
      const data: NominatimResult[] = await res.json();

      if (data.length === 0) {
        setError("Ничего не найдено");
        return;
      }

      onFound(parseFloat(data[0].lat), parseFloat(data[0].lon), data[0].display_name);
    } catch {
      setError("Не удалось выполнить поиск");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 items-center gap-2">
      <div className="relative flex-1 max-w-xs">
        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-eco-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Улица, район…"
          className="pl-8"
        />
      </div>
      <Button type="submit" size="sm" variant="secondary" disabled={loading}>
        {loading ? <Loader2 size={14} className="animate-spin" /> : "Найти"}
      </Button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </form>
  );
}
