import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { HeaderNav } from "./HeaderNav";
import { LogOutIcon, ZapIcon } from "./icons";

export async function SiteHeader() {
  const session = await auth();
  const user = session?.user;

  async function logout() {
    "use server";
    await signOut({ redirectTo: "/events" });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-zinc-950/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/events"
          className="flex items-center gap-2.5 font-display text-lg font-bold tracking-tight text-zinc-50"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-lime-400 text-zinc-950 shadow-[0_0_20px_-4px_rgba(163,230,53,0.6)]">
            <ZapIcon className="h-4.5 w-4.5" strokeWidth={2.5} />
          </span>
          Runners<span className="text-lime-300">Hub</span>
        </Link>

        <HeaderNav />

        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <span
                className="hidden max-w-44 truncate rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-400 sm:block"
                title={user.email ?? undefined}
              >
                {user.email}
              </span>
              <form action={logout}>
                <button
                  type="submit"
                  title="Sair"
                  className="flex h-8.5 w-8.5 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-400 transition-colors hover:border-white/20 hover:text-zinc-100"
                >
                  <LogOutIcon className="h-4 w-4" />
                  <span className="sr-only">Sair</span>
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-lime-400 px-4 py-1.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-lime-300"
            >
              Entrar
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
