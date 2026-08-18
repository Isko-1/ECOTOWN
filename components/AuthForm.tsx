"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: { data: { display_name: displayName || email.split("@")[0] } },
          });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/map");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
      {mode === "register" && (
        <div className="flex flex-col gap-1">
          <label htmlFor="displayName" className="text-sm font-medium text-eco-800">Имя волонтёра</label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Как тебя видят на карте"
          />
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium text-eco-800">Email</label>
        <Input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium text-eco-800">Пароль</label>
        <Input
          id="password"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Минимум 6 символов"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={loading} className="mt-2">
        {loading ? "Секунду…" : mode === "login" ? "Войти" : "Зарегистрироваться"}
      </Button>

      <p className="text-center text-sm text-eco-600">
        {mode === "login" ? (
          <>Нет аккаунта? <Link href="/register" className="font-medium text-eco-800 underline">Зарегистрироваться</Link></>
        ) : (
          <>Уже с нами? <Link href="/login" className="font-medium text-eco-800 underline">Войти</Link></>
        )}
      </p>
    </form>
  );
}
