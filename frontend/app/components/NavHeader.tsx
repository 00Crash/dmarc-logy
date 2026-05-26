"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavHeader() {
  const pathname = usePathname();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    window.location.reload();
  }
  const links = [
    { href: "/", label: "Home" },
    { href: "/history", label: "Historie" }
  ];

  return (
    <>
    <header className="topbar">
      <div className="brand-block">
        <h1>DMARC Logy</h1>
        <p>
          Přehled DMARC aggregate reportů, zdrojových IP adres a výsledků DMARC, SPF a DKIM.
        </p>
      </div>
      <nav className="main-menu" aria-label="Hlavní menu">
        {links.map((link) => {
          const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
          return (
            <Link key={link.href} className={active ? "menu-link active" : "menu-link"} href={link.href}>
              {link.label}
            </Link>
          );
        })}
        <button className="logout-button" onClick={logout}>Odhlásit</button>
      </nav>
    </header>
    </>
  );
}
