"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, message }),
    });

    if (res.ok) {
      setStatus("sent");
      setName("");
      setEmail("");
      setMessage("");
    } else {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <p className="mt-8 rounded-xl bg-eco-50 px-4 py-3 text-center text-eco-800">
        Сообщение отправлено — ответим в ближайшее время.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4 text-left">
      <Input required placeholder="Имя" value={name} onChange={(e) => setName(e.target.value)} />
      <Input required type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <Textarea
        required
        rows={4}
        placeholder="Сообщение"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      {status === "error" && (
        <p className="text-sm text-red-600">Не получилось отправить. Попробуй ещё раз чуть позже.</p>
      )}
      <Button type="submit" disabled={status === "sending"} className="self-start">
        {status === "sending" ? "Отправляем…" : "Отправить"}
      </Button>
    </form>
  );
}
