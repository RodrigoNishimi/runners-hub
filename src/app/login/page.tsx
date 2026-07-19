import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth";
import { ZapIcon } from "@/components/icons";

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
    <div className="mx-auto mt-12 max-w-sm animate-fade-up rounded-3xl border border-white/10 bg-zinc-900/70 p-8 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.8)]">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-lime-400 text-zinc-950 shadow-[0_0_24px_-4px_rgba(163,230,53,0.6)]">
        <ZapIcon className="h-5 w-5" strokeWidth={2.5} />
      </span>
      <h1 className="mt-5 font-display text-2xl font-bold text-zinc-50">
        Entrar no RunnersHub
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">
        Sem senha: enviamos um link mágico para o seu e-mail. A busca de
        eventos funciona sem login — a conta serve para montar seu calendário
        de provas e receber avisos de preço e inscrição.
      </p>
      <form action={login} className="mt-6 flex flex-col gap-3">
        <input
          type="email"
          name="email"
          required
          placeholder="voce@exemplo.com"
          className="rounded-xl border border-white/10 bg-zinc-950/60 px-4 py-3 text-zinc-100 transition-colors placeholder:text-zinc-600 focus:border-lime-300/50 focus:ring-2 focus:ring-lime-300/15 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-xl bg-lime-400 px-4 py-3 font-semibold text-zinc-950 shadow-[0_8px_30px_-8px_rgba(163,230,53,0.5)] transition-all hover:-translate-y-0.5 hover:bg-lime-300"
        >
          Enviar link de acesso
        </button>
      </form>
    </div>
  );
}
