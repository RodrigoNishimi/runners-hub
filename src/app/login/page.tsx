import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth";
import { ZapIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/calendar");

  async function loginWithGoogle() {
    "use server";
    await signIn("google", { redirectTo: "/calendar" });
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
        A busca de eventos funciona sem login — a conta serve para montar seu
        calendário de provas e receber avisos de preço e inscrição.
      </p>
      <form action={loginWithGoogle} className="mt-6">
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-zinc-950/60 px-4 py-3 font-semibold text-zinc-100 transition-all hover:-translate-y-0.5 hover:border-white/20 hover:bg-zinc-950/80"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09a6.6 6.6 0 0 1 0-4.18V7.07H2.18a11 11 0 0 0 0 9.86l3.66-2.84Z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.46 14.97.5 12 .5A11 11 0 0 0 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.16 6.16-4.16Z"
            />
          </svg>
          Continuar com Google
        </button>
      </form>
    </div>
  );
}
