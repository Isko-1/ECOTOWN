import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`donation-request:${ip}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Слишком много запросов, попробуйте позже" }, { status: 429 });
  }

  const { spotId, spotTitle, purpose, goalAmount, requesterName } = await request.json();

  if (!spotId || !spotTitle || !purpose || !goalAmount) {
    return NextResponse.json({ error: "Не хватает данных о заявке" }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_EMAIL;

  if (!apiKey || !to) {
    // Не мешаем отправить заявку, если письмо не настроено — просто не отправляем
    return NextResponse.json({ ok: true, warning: "email не настроен" });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

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
        `Волонтёр: ${requesterName || "не указано"}`,
        `Сумма: ${goalAmount} ₸`,
        "",
        "На что нужны деньги:",
        purpose,
        "",
        `Одобрить/отклонить и внести поступления: ${siteUrl}/admin`,
      ].join("\n"),
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    return NextResponse.json({ error: "Не удалось отправить письмо", detail }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
