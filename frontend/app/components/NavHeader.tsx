"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Přehled", icon: "▦" },
  { href: "/history", label: "Historie", icon: "◷" },
];

export default function NavHeader() {
  const pathname = usePathname();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    window.location.reload();
  }

  return (
    <aside className="fixed inset-x-0 top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl lg:inset-y-0 lg:left-0 lg:right-auto lg:w-72 lg:border-b-0 lg:border-r">
      <div className="flex h-20 items-center justify-between px-5 lg:h-full lg:flex-col lg:items-stretch lg:justify-start lg:p-5">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-lg font-black text-white shadow-lg shadow-blue-600/25">
            D
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight text-slate-950">DMARC Logy</div>
            <div className="text-xs font-medium text-slate-400">Admin panel</div>
          </div>
        </Link>

        <nav className="hidden gap-2 lg:mt-10 lg:flex lg:flex-col" aria-label="Hlavní menu">
          {links.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={[
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
                  active
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                ].join(" ")}
              >
                <span className="text-base">{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden lg:mt-auto lg:block">
          <button
            className="flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            onClick={logout}
          >
            Odhlásit
          </button>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          {links.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={active ? "rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white" : "rounded-xl px-3 py-2 text-sm font-semibold text-slate-600"}
              >
                {link.label}
              </Link>
            );
          })}
          <button className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600" onClick={logout}>
            Ven
          </button>
        </div>
      </div>
    </aside>
  );
}
