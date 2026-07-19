import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/calendar");

  async function login(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "").trim();
    if (!email) return;
    await signIn("resend", { email, redirectTo: "/calendar" });
  }

  return (
    <div className="mx-auto mt-12 max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-bold">Entrar no RunnersHub</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Sem senha: enviamos um link mágico para o seu e-mail. A busca de
        eventos funciona sem login — a conta serve para montar seu calendário
        de provas e receber avisos de preço e inscrição.
      </p>
      <form action={login} className="mt-4 flex flex-col gap-3">
        <input
          type="email"
          name="email"
          required
          placeholder="voce@exemplo.com"
          className="rounded-xl border border-zinc-300 px-4 py-2.5"
        />
        <button
          type="submit"
          className="rounded-xl bg-zinc-900 px-4 py-2.5 font-semibold text-white hover:bg-zinc-700"
        >
          Enviar link de acesso
        </button>
      </form>
    </div>
  );
}
