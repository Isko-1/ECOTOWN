"use client";

import { Star } from "lucide-react";
import type { SpotStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const statusOptions: { value: SpotStatus; label: string; activeClass: string }[] = [
  { value: "new", label: "Новые", activeClass: "bg-red-600 text-white border-red-600" },
  { value: "in_progress", label: "В работе", activeClass: "bg-amber-500 text-white border-amber-500" },
  { value: "done", label: "Закрытые", activeClass: "bg-eco-600 text-white border-eco-600" },
];

export function MapFilters({
  statusFilter,
  onStatusFilterChange,
  minDifficulty,
  onMinDifficultyChange,
  maxDifficulty,
  onMaxDifficultyChange,
}: {
  statusFilter: Set<SpotStatus>;
  onStatusFilterChange: (next: Set<SpotStatus>) => void;
  minDifficulty: number;
  onMinDifficultyChange: (value: number) => void;
  maxDifficulty: number;
  onMaxDifficultyChange: (value: number) => void;
}) {
  function toggleStatus(value: SpotStatus) {
    const next = new Set(statusFilter);
    if (next.has(value)) {
      next.delete(value);
    } else {
      next.add(value);
    }
    onStatusFilterChange(next);
  }

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-eco-100 bg-white px-4 py-2">
      <div className="flex flex-wrap gap-1.5">
        {statusOptions.map((opt) => {
          const active = statusFilter.has(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggleStatus(opt.value)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                active ? opt.activeClass : "border-eco-200 text-eco-600 hover:bg-eco-50"
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-eco-500">Сложность от:</span>
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => {
              const value = i + 1;
              return (
                <button
                  key={value}
                  type="button"
                  aria-label={`От сложности ${value}`}
                  onClick={() => {
                    const next = minDifficulty === value ? 1 : value;
                    onMinDifficultyChange(next);
                    // нижняя граница не может быть выше верхней — подтягиваем верхнюю вместе с ней
                    if (next > maxDifficulty) onMaxDifficultyChange(next);
                  }}
                >
                  <Star
                    size={16}
                    className={value <= minDifficulty ? "fill-amber-500 text-amber-500" : "text-eco-200"}
                  />
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-eco-500">до:</span>
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => {
              const value = i + 1;
              return (
                <button
                  key={value}
                  type="button"
                  aria-label={`До сложности ${value}`}
                  onClick={() => {
                    const next = maxDifficulty === value ? 5 : value;
                    onMaxDifficultyChange(next);
                    // верхняя граница не может быть ниже нижней — подтягиваем нижнюю вместе с ней
                    if (next < minDifficulty) onMinDifficultyChange(next);
                  }}
                >
                  <Star
                    size={16}
                    className={value <= maxDifficulty ? "fill-amber-500 text-amber-500" : "text-eco-200"}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
