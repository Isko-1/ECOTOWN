"use client";

import { useState } from "react";

/** Переключатель между разделами админки. Контент обеих вкладок рендерится сервером
 *  и передаётся сюда как готовые узлы — здесь только переключение видимости. */
export function AdminTabs({
  donationsAndUsers,
  stats,
}: {
  donationsAndUsers: React.ReactNode;
  stats: React.ReactNode;
}) {
  const [tab, setTab] = useState<"main" | "stats">("main");

  return (
    <div className="mt-6">
      <div className="flex gap-1 border-b border-eco-100">
        <TabButton active={tab === "main"} onClick={() => setTab("main")} label="Донаты и пользователи" />
        <TabButton active={tab === "stats"} onClick={() => setTab("stats")} label="Статистика" />
      </div>
      <div className="mt-6">{tab === "main" ? donationsAndUsers : stats}</div>
    </div>
  );
}

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={[
        "-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
        active ? "border-eco-600 text-eco-800" : "border-transparent text-eco-500 hover:text-eco-700",
      ].join(" ")}
    >
      {label}
    </button>
  );
}
