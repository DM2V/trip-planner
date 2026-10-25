"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LocationIcon, SettingsIcon } from "@/components/ui/icons";

const TABS = [
  { href: "/trips", label: "Trips", Icon: LocationIcon },
  { href: "/settings", label: "Settings", Icon: SettingsIcon },
];

// Only rendered on the two top-level tab screens (/trips and /settings) — pushed screens like a
// trip's own detail page or the new-trip form stay full-screen/focused, same as most iOS apps
// hide their tab bar once you've drilled into a task.
export function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="sheet-material fixed inset-x-0 bottom-0 z-20 flex border-t border-(--color-separator) pb-[env(safe-area-inset-bottom)]">
      {TABS.map(({ href, label, Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-[49px] flex-1 flex-col items-center justify-center gap-0.5 text-[0.6875rem] font-medium ${
              active ? "text-(--color-accent)" : "text-(--color-label-tertiary)"
            }`}
          >
            <Icon className="h-6 w-6" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
