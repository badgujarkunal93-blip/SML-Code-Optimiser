"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/workspace", label: "Workspace (IDE)" },
  { href: "/results", label: "Results" },
  { href: "/dashboard", label: "Analytics" },
  { href: "/history", label: "History" },
  { href: "/settings", label: "Settings" },
];

export function NavLinks() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="hidden md:flex gap-3 items-center text-xs font-mono font-semibold">
      {NAV_ITEMS.map((item) => {
        const isActive =
          mounted &&
          (item.href === "/"
            ? pathname === "/"
            : pathname === item.href || pathname?.startsWith(`${item.href}/`));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`py-1.5 px-3.5 rounded-xl border transition-all duration-200 ${
              isActive
                ? "text-[var(--primary)] font-bold bg-[var(--primary)]/10 border-[var(--primary)]/50 shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--primary)] border-transparent hover:bg-[var(--card-elevated)]"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
