import type { Metadata } from "next";

export const metadata: Metadata = { title: "Confira seu e-mail" };

export default function VerifyRequestPage() {
  return (
    <div className="mx-auto mt-12 max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-sm">
      <p className="text-4xl">📬</p>
      <h1 className="mt-2 text-xl font-bold">Confira seu e-mail</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Enviamos um link de acesso. Clique nele para entrar — pode fechar esta
        aba.
      </p>
    </div>
  );
}
