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
  const [googleLoading, setGoogleLoading] = useState(false);

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

  async function handleGoogleSignIn() {
    setError(null);
    setGoogleLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/map` },
    });

    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
    // On success Supabase redirects to Google, so no further action needed here.
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

      <div className="flex items-center gap-3 text-xs text-eco-500">
        <span className="h-px flex-1 bg-eco-200" />
        или
        <span className="h-px flex-1 bg-eco-200" />
      </div>

      <Button
        type="button"
        variant="secondary"
        disabled={googleLoading}
        onClick={handleGoogleSignIn}
      >
        <GoogleIcon className="h-4 w-4" />
        {googleLoading ? "Секунду…" : "Продолжить с Google"}
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

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.66-.22-2.45H12v4.63h6.47c-.28 1.5-1.13 2.77-2.4 3.62v3h3.88c2.27-2.09 3.57-5.17 3.57-8.8Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.93l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.26v3.1C3.24 21.3 7.28 24 12 24Z" />
      <path fill="#FBBC05" d="M5.27 14.26a7.2 7.2 0 0 1 0-4.52v-3.1H1.26a12 12 0 0 0 0 10.72l4.01-3.1Z" />
      <path fill="#EA4335" d="M12 4.75c1.76 0 3.35.6 4.6 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0 7.28 0 3.24 2.7 1.26 6.64l4.01 3.1C6.22 6.9 8.87 4.75 12 4.75Z" />
    </svg>
  );
}
