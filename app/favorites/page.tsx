import Link from "next/link";
import { redirect } from "next/navigation";
import { Heart, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import { LogoutButton } from "@/components/LogoutButton";
import type { Spot } from "@/lib/types";

export default async function FavoritesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("id", user.id)
    .single();

  // join favorites -> spots, только записи текущего пользователя
  const { data } = await supabase
    .from("favorites")
    .select("spot_id, spots(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  type FavoriteRow = { spot_id: string; spots: Spot | null };

  const favoriteSpots: Spot[] = ((data ?? []) as unknown as FavoriteRow[])
    .map((row) => row.spots)
    .filter((spot): spot is Spot => spot !== null);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      {/* Личный кабинет */}
      <section className="flex items-center justify-between gap-4 rounded-2xl border border-eco-100 bg-eco-50/50 p-5">
        <div className="flex items-center gap-4">
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt=""
              className="h-14 w-14 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-eco-600 font-display text-xl font-bold text-white">
              {(profile?.display_name ?? user.email ?? "?").charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-display text-lg font-semibold text-eco-900">
              {profile?.display_name ?? "Без имени"}
            </p>
            <p className="text-sm text-eco-600">{user.email}</p>
          </div>
        </div>
        <LogoutButton />
      </section>

      <h1 className="mt-10 font-display text-2xl font-bold text-eco-900">Избранное</h1>

      {favoriteSpots.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-3 text-center">
          <Heart size={40} className="text-eco-200" />
          <p className="text-eco-700">Нет избранных меток</p>
          <Link href="/map">
            <Button variant="secondary">Открыть карту</Button>
          </Link>
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {favoriteSpots.map((spot) => (
            <li key={spot.id} className="rounded-2xl border border-eco-100 p-4">
              <h2 className="font-display font-semibold text-eco-900">{spot.title}</h2>
              <p className="mt-1 text-sm text-eco-700">{spot.description}</p>
              <div className="mt-2 flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    className={i < spot.difficulty ? "fill-amber-500 text-amber-500" : "text-eco-200"}
                  />
                ))}
              </div>
              <Link href="/map" className="mt-3 inline-block text-sm font-medium text-eco-700 underline">
                Показать на карте
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
