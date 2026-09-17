"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

const NAV_LINKS = [
  { href: "/", label: "Дашборд" },
  { href: "/analytics", label: "Аналитика" },
  { href: "/business", label: "Бизнес" },
  { href: "/tasks", label: "Задачи" },
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-10 border-b border-brand-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="shrink-0" onClick={() => setMenuOpen(false)}>
          <Image
            src="/logo.png"
            alt="Janerke Abat Design"
            width={486}
            height={92}
            priority
            className="h-8 w-auto sm:h-9"
          />
        </Link>

        <nav className="hidden items-center gap-4 text-sm sm:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-neutral-600 hover:text-brand-700">
              {link.label}
            </Link>
          ))}
          <form action="/auth/signout" method="post">
            <button type="submit" className="text-neutral-400 transition hover:text-brand-700">
              Выйти
            </button>
          </form>
        </nav>

        <button
          type="button"
          aria-label="Меню"
          onClick={() => setMenuOpen((v) => !v)}
          className="flex flex-col gap-1.5 p-2 sm:hidden"
        >
          <span className="h-0.5 w-5 bg-neutral-700" />
          <span className="h-0.5 w-5 bg-neutral-700" />
          <span className="h-0.5 w-5 bg-neutral-700" />
        </button>
      </div>

      {menuOpen && (
        <nav className="flex flex-col border-t border-brand-100 bg-white px-4 py-2 text-sm sm:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-2 py-2.5 text-neutral-700 hover:bg-brand-50 hover:text-brand-700"
            >
              {link.label}
            </Link>
          ))}
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="w-full rounded-lg px-2 py-2.5 text-left text-neutral-400 hover:bg-brand-50 hover:text-brand-700"
            >
              Выйти
            </button>
          </form>
        </nav>
      )}
    </header>
  );
}
