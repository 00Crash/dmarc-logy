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
    <header className="flex shrink-0 items-center justify-between border-b border-slate-200 pb-4">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">DMARC Logy</h1>
        <p className="mt-1 text-sm text-slate-500">DMARC, SPF a DKIM přehled.</p>
      </div>

      <nav className="flex items-center gap-1" aria-label="Hlavní menu">
        {links.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={[
                "inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium transition",
                active ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20" : "text-slate-500 hover:bg-blue-50 hover:text-blue-700",
              ].join(" ")}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
        <Button variant="ghost" size="sm" className="text-slate-500 hover:bg-blue-50 hover:text-blue-700" onClick={logout}>
          <LogOut size={16} />
          Odhlásit
        </Button>
      </nav>
    </header>
  );
}
