import Link from "next/link";
import { ZapIcon } from "./icons";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-white/5">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-zinc-500 sm:flex-row sm:px-6 lg:px-8">
        <p className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-white/5 text-lime-300">
            <ZapIcon className="h-3 w-3" />
          </span>
          <span>
            <span className="font-display font-semibold text-zinc-300">
              RunnersHub
            </span>{" "}
            — corridas de rua do Brasil em um lugar só.
          </span>
        </p>
        <nav className="flex items-center gap-5">
          <Link href="/events" className="transition-colors hover:text-zinc-200">
            Explorar
          </Link>
          <Link
            href="/calendar"
            className="transition-colors hover:text-zinc-200"
          >
            Meu calendário
          </Link>
        </nav>
      </div>
    </footer>
  );
}
