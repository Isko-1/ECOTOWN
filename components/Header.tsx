"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, Leaf, User as UserIcon, LogOut } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { createClient } from "@/lib/supabase/client";

const links = [
  { href: "/", label: "Главная" },
  { href: "/map", label: "Карта" },
  { href: "/favorites", label: "Избранное" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [supabase] = useState(() => createClient());
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.subscription.unsubscribe();
  }, [supabase]);

  async function handleLogout() {
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 border-b border-eco-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold text-eco-800">
          <Leaf size={22} className="text-eco-600" />
          EcoTown
        </Link>

        {/* Десктоп-навигация */}
        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm font-medium text-eco-700 hover:text-eco-900">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <Link href="/favorites">
                <Button variant="ghost" size="sm">
                  <UserIcon size={16} />
                  Личный кабинет
                </Button>
              </Link>
              <Button variant="secondary" size="sm" onClick={handleLogout}>
                <LogOut size={16} />
                Выйти
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">Войти</Button>
              </Link>
              <Link href="/register">
                <Button variant="primary" size="sm">Присоединиться</Button>
              </Link>
            </>
          )}
        </div>

        {/* Мобильное меню — исправление бага №1 */}
        <button
          aria-label="Открыть меню"
          onClick={() => setOpen(true)}
          className="rounded-full p-2 text-eco-800 hover:bg-eco-50 md:hidden"
        >
          <Menu size={24} />
        </button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            onClick={() => setOpen(false)}
            className="rounded-lg px-3 py-3 text-base font-medium text-eco-800 hover:bg-eco-50"
          >
            {l.label}
          </Link>
        ))}
        <div className="mt-4 flex flex-col gap-2 border-t border-eco-100 pt-4">
          {user ? (
            <>
              <Link href="/favorites" onClick={() => setOpen(false)}>
                <Button variant="secondary" className="w-full">
                  <UserIcon size={16} />
                  Личный кабинет
                </Button>
              </Link>
              <Button variant="primary" className="w-full" onClick={handleLogout}>
                <LogOut size={16} />
                Выйти
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setOpen(false)}>
                <Button variant="secondary" className="w-full">Войти</Button>
              </Link>
              <Link href="/register" onClick={() => setOpen(false)}>
                <Button variant="primary" className="w-full">Присоединиться</Button>
              </Link>
            </>
          )}
        </div>
      </Sheet>
    </header>
  );
}
