import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { name, email, message } = await request.json();

  if (!name || !email || !message) {
    return NextResponse.json({ error: "Заполните все поля" }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_EMAIL;

  if (!apiKey || !to) {
    return NextResponse.json({ error: "Форма пока не настроена (нет RESEND_API_KEY / CONTACT_EMAIL)" }, { status: 500 });
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
      reply_to: email,
      subject: `EcoTown — сообщение от ${name}`,
      text: `Имя: ${name}\nEmail: ${email}\n\n${message}`,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    return NextResponse.json({ error: "Не удалось отправить письмо", detail }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
