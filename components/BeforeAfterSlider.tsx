"use client";

import { useState, useRef, useCallback } from "react";
import { SlidersHorizontal } from "lucide-react";

export function BeforeAfterSlider({
  beforeUrl,
  afterUrl,
  beforeLabel = "До уборки",
  afterLabel = "После уборки",
}: {
  beforeUrl: string;
  afterUrl: string;
  beforeLabel?: string;
  afterLabel?: string;
}) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    let percentage = (x / rect.width) * 100;
    if (percentage < 0) percentage = 0;
    if (percentage > 100) percentage = 100;
    setSliderPosition(percentage);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX);
    }
  }, [handleMove]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      handleMove(e.clientX);
    }
  }, [isDragging, handleMove]);

  return (
    <div
      ref={containerRef}
      className="relative h-64 w-full select-none overflow-hidden rounded-2xl border border-eco-200 bg-eco-950 shadow-inner md:h-72"
      onMouseMove={handleMouseMove}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
      onTouchMove={handleTouchMove}
    >
      {/* Фото ПОСЛЕ (основа) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={afterUrl}
        alt={afterLabel}
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />
      <span className="absolute bottom-3 right-3 z-10 rounded-full bg-black/50 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
        {afterLabel}
      </span>

      {/* Фото ДО (наложение со свойством clip-path) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={beforeUrl}
          alt={beforeLabel}
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />
        <span className="absolute bottom-3 left-3 z-10 rounded-full bg-black/50 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
          {beforeLabel}
        </span>
      </div>

      {/* Разделительный ползунок */}
      <div
        className="absolute top-0 bottom-0 z-20 w-1 cursor-ew-resize bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)]"
        style={{ left: `${sliderPosition}%` }}
        onMouseDown={() => setIsDragging(true)}
      >
        <div className="absolute top-1/2 -left-4 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-eco-600 text-white shadow-lg transition-transform hover:scale-110 active:scale-95">
          <SlidersHorizontal size={16} />
        </div>
      </div>

      {/* Ползунок в виде прозрачного Range Input для идеального touch/click UX */}
      <input
        type="range"
        min="0"
        max="100"
        value={sliderPosition}
        onChange={(e) => setSliderPosition(Number(e.target.value))}
        className="absolute inset-0 z-30 h-full w-full cursor-ew-resize opacity-0"
        aria-label="Слайдер сравнения фото До и После"
      />
    </div>
  );
}
