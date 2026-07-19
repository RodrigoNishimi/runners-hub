import type { Metadata } from "next";
import { MailIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Confira seu e-mail" };

export default function VerifyRequestPage() {
  return (
    <div className="mx-auto mt-12 max-w-sm animate-fade-up rounded-3xl border border-white/10 bg-zinc-900/70 p-8 text-center shadow-[0_24px_60px_-24px_rgba(0,0,0,0.8)]">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-lime-400/15 text-lime-300 ring-1 ring-inset ring-lime-400/30">
        <MailIcon className="h-6 w-6" />
      </span>
      <h1 className="mt-5 font-display text-2xl font-bold text-zinc-50">
        Confira seu e-mail
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">
        Enviamos um link de acesso. Clique nele para entrar — pode fechar esta
        aba.
      </p>
    </div>
  );
}
