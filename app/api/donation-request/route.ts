import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { spotId, spotTitle, goal, creatorName } = await request.json();

  if (!spotId || !spotTitle || !goal) {
    return NextResponse.json({ error: "Не хватает данных о метке" }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_EMAIL;

  if (!apiKey || !to) {
    // Не мешаем создать метку, если письмо не настроено — просто не отправляем
    return NextResponse.json({ ok: true, warning: "email не настроен" });
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "EcoTown <onboarding@resend.dev>",
      to,
      subject: `EcoTown — заявка на донат: «${spotTitle}»`,
      text: [
        `Метка: ${spotTitle} (id: ${spotId})`,
        `Автор: ${creatorName ?? "неизвестно"}`,
        "",
        "Цель доната:",
        goal,
        "",
        "Чтобы подключить приём донатов — впиши свой Kaspi-номер в колонку donation_kaspi_number этой строки в таблице spots (Supabase Table Editor).",
      ].join("\n"),
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    return NextResponse.json({ error: "Не удалось отправить письмо", detail }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
