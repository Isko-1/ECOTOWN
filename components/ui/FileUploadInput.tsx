"use client";

import { useEffect, useState } from "react";
import { UploadCloud, Camera, Check, X } from "lucide-react";

interface FileUploadInputProps {
  label: string;
  accept?: string;
  file: File | null;
  currentUrl?: string | null;
  onChange: (file: File | null) => void;
  required?: boolean;
}

export function FileUploadInput({
  label,
  accept = "image/*",
  file,
  currentUrl,
  onChange,
}: FileUploadInputProps) {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreview(null);
    }
  }, [file]);

  const displayImage = preview || currentUrl;

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-eco-800 uppercase tracking-wide">
        {label}
      </label>

      <div className="relative">
        <label className="group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-eco-200/90 bg-eco-50/40 p-3.5 text-center transition-all hover:border-eco-500 hover:bg-eco-50/80 active:scale-[0.99]">
          <input
            type="file"
            accept={accept}
            className="sr-only"
            onChange={(e) => onChange(e.target.files?.[0] ?? null)}
          />

          {displayImage ? (
            <div className="relative w-full overflow-hidden rounded-xl border border-eco-100 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={displayImage}
                alt="Предпросмотр фото"
                className="h-36 w-full object-cover rounded-xl transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-eco-950/40 backdrop-blur-xs opacity-0 transition-opacity group-hover:opacity-100">
                <span className="rounded-xl bg-white/95 px-3 py-1.5 text-xs font-bold text-eco-900 shadow-md flex items-center gap-1.5">
                  <Camera size={15} className="text-eco-600" /> Изменить фотографию
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-2">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-xs border border-eco-200/60 text-eco-600 transition-transform group-hover:scale-110">
                <UploadCloud size={22} />
              </div>
              <div>
                <span className="text-xs font-bold text-eco-800 group-hover:text-eco-950">
                  Выберите снимки с устройства
                </span>
                <p className="text-[11px] text-eco-500 mt-0.5">
                  Нажмите сюда для загрузки (JPG, PNG, WEBP)
                </p>
              </div>
            </div>
          )}
        </label>

        {file && (
          <div className="mt-2 flex items-center justify-between rounded-xl bg-eco-100/70 px-3 py-1.5 text-xs text-eco-800">
            <span className="flex items-center gap-1.5 font-medium truncate max-w-[200px]">
              <Check size={14} className="text-eco-600 shrink-0" /> {file.name}
            </span>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="text-eco-500 hover:text-red-600 font-semibold p-1"
              title="Удалить выбранный файл"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
