"use client";

import { Clock3, Home, LogOut, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/history", label: "Historie", Icon: Clock3 },
];

export default function NavHeader() {
  const pathname = usePathname();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    window.location.reload();
  }

  return (
    <header className="flex shrink-0 flex-col gap-4 rounded-[1.75rem] border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
          <ShieldCheck size={24} strokeWidth={2.4} />
        </div>
        <div className="min-w-0">
          <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">DMARC Logy</h1>
          <p className="mt-1 truncate text-sm font-medium text-slate-500">
            Přehled DMARC aggregate reportů, zdrojových IP adres a výsledků DMARC, SPF a DKIM.
          </p>
        </div>
      </div>

      <nav className="flex shrink-0 flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1" aria-label="Hlavní menu">
        {links.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={[
                "inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold transition",
                active ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20" : "text-slate-600 hover:bg-white hover:text-slate-950",
              ].join(" ")}
            >
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
        <button
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
          onClick={logout}
        >
          <LogOut size={17} />
          Odhlásit
        </button>
      </nav>
    </header>
  );
}
