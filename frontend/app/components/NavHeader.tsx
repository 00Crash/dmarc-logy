"use client";

import { BarChart3, Clock3, LineChart, LogOut, ShieldCheck, UploadCloud } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Přehled", Icon: BarChart3 },
  { href: "/charts", label: "Grafy", Icon: LineChart },
  { href: "/import", label: "Import", Icon: UploadCloud },
  { href: "/history", label: "Historie", Icon: Clock3 },
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
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-500/25">
            <ShieldCheck size={22} strokeWidth={2.4} />
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight text-slate-950">DMARC Logy</div>
            <div className="text-xs font-medium text-slate-400">Admin panel</div>
          </div>
        </Link>

        <nav className="hidden gap-1.5 lg:mt-9 lg:flex lg:flex-col" aria-label="Hlavní menu">
          {links.map(({ href, label, Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={[
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition",
                  active ? "bg-slate-100 text-slate-950" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
                ].join(" ")}
              >
                <Icon size={18} strokeWidth={2.1} className={active ? "text-orange-500" : "text-slate-400"} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden lg:mt-auto lg:block">
          <button
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
            onClick={logout}
          >
            <LogOut size={17} />
            Odhlásit
          </button>
        </div>

        <div className="flex items-center gap-1 lg:hidden">
          {links.map(({ href, label }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link key={href} href={href} className={active ? "rounded-xl bg-slate-100 px-2.5 py-2 text-xs font-semibold text-slate-950" : "rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-600"}>
                {label}
              </Link>
            );
          })}
          <button className="rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-600" onClick={logout}>Ven</button>
        </div>
      </div>
    </aside>
  );
}
