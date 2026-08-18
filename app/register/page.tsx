import { AuthForm } from "@/components/AuthForm";

export default function RegisterPage() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col items-center px-4 py-16">
      <h1 className="mb-8 font-display text-2xl font-bold text-eco-900">Регистрация волонтёра</h1>
      <AuthForm mode="register" />
    </main>
  );
}
