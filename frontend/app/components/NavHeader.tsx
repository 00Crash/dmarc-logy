"use client";

import { Clock3, Home, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./ui/button";

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
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200">
      <div className="flex items-baseline gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">DMARC Logy</h1>
        <p className="hidden text-sm text-slate-500 lg:block">DMARC, SPF a DKIM</p>
      </div>

      <nav className="flex items-center gap-1" aria-label="Hlavní menu">
        {links.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={[
                "inline-flex h-9 items-center gap-2 rounded-xl px-3 text-sm font-medium transition",
                active ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20" : "text-slate-500 hover:bg-blue-50 hover:text-blue-700",
              ].join(" ")}
            >
              <Icon size={15} />
              {label}
            </Link>
          );
        })}
        <Button variant="ghost" size="sm" className="h-9 text-slate-500 hover:bg-blue-50 hover:text-blue-700" onClick={logout}>
          <LogOut size={15} />
          Odhlásit
        </Button>
      </nav>
    </header>
  );
}
