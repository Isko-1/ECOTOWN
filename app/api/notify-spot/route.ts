import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp, escapeHtml } from "@/lib/rateLimit";

/**
 * POST /api/notify-spot
 * Отправляет письмо администратору (CONTACT_EMAIL) при создании новой метки.
 * Вызывается из AddSpotForm.tsx — ошибка отправки не блокирует создание метки.
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`notify-spot:${ip}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Слишком много запросов, попробуйте позже" }, { status: 429 });
  }

  const { spotTitle, spotId, description, difficulty, lat, lng, creatorName } =
    await request.json();

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_EMAIL;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  // Если email не настроен — тихо возвращаем успех (не блокируем UX)
  if (!apiKey || !to) {
    return NextResponse.json({ ok: true, warning: "email не настроен" });
  }

  const stars = "★".repeat(difficulty ?? 1) + "☆".repeat(5 - (difficulty ?? 1));
  const mapLink = `${siteUrl}/map`;

  // spotTitle/creatorName/description приходят от пользователя — экранируем перед
  // вставкой в HTML письма, иначе это XSS/HTML-инъекция в почтовый клиент админа
  const safeTitle = escapeHtml(String(spotTitle ?? ""));
  const safeCreator = escapeHtml(String(creatorName ?? "Аноним"));
  const safeDescription = escapeHtml(String(description ?? ""));

  const html = `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
  <div style="background:#2c7936;padding:20px 24px;border-radius:12px 12px 0 0">
    <h1 style="color:#fff;margin:0;font-size:20px">🗺️ Новая метка на карте EcoTown</h1>
  </div>
  <div style="border:1px solid #dcf0dd;border-top:none;padding:24px;border-radius:0 0 12px 12px">
    <h2 style="color:#1c3f22;margin-top:0">${safeTitle}</h2>
    <p style="color:#25602d"><strong>Создал:</strong> ${safeCreator}</p>
    <p style="color:#25602d"><strong>Сложность:</strong> ${stars} (${difficulty}/5)</p>
    <p style="color:#25602d"><strong>Координаты:</strong> ${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}</p>
    <p style="color:#25602d"><strong>Описание:</strong></p>
    <blockquote style="border-left:3px solid #3c9646;margin:0;padding:8px 16px;color:#204c27;background:#f0f9f0;border-radius:4px">
      ${safeDescription}
    </blockquote>
    <div style="margin-top:20px">
      <a href="${mapLink}" style="display:inline-block;background:#2c7936;color:#fff;padding:10px 20px;border-radius:20px;text-decoration:none;font-weight:bold">
        Открыть карту →
      </a>
    </div>
    <p style="color:#5cb166;font-size:12px;margin-top:20px">
      ID метки: ${spotId} · EcoTown — волонтёрская платформа Орала
    </p>
  </div>
</div>`;

  const text = [
    `🗺️ Новая метка на карте EcoTown`,
    ``,
    `Название: ${spotTitle}`,
    `Создал: ${creatorName || "Аноним"}`,
    `Сложность: ${difficulty}/5`,
    `Координаты: ${lat}, ${lng}`,
    ``,
    `Описание: ${description}`,
    ``,
    `Открыть карту: ${mapLink}`,
    `ID метки: ${spotId}`,
  ].join("\n");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "EcoTown <onboarding@resend.dev>",
      to,
      subject: `🗺️ Новая метка: «${spotTitle}»`,
      html,
      text,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    return NextResponse.json({ error: "Не удалось отправить письмо", detail }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
