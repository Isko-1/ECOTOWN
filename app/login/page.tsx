import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuthForm } from "@/components/AuthForm";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/favorites");

  return (
    <main className="mx-auto flex max-w-6xl flex-col items-center px-4 py-16">
      <h1 className="mb-8 font-display text-2xl font-bold text-eco-900">Вход в EcoTown</h1>
      <AuthForm mode="login" />
    </main>
  );
}
