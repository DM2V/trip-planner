import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeftIcon } from "@/components/ui/icons";

interface PageHeaderProps {
  title: string;
  backHref?: string;
  backLabel?: string;
  large?: boolean;
  trailing?: ReactNode;
}

// iOS nav bar: a 3-column row (back / centered small title / trailing action) for pushed
// screens, or a big bold title below the row for top-level ("large title") screens.
export function PageHeader({ title, backHref, backLabel = "Back", large = false, trailing }: PageHeaderProps) {
  return (
    <header className="nav-material px-4 pt-3">
      <div className="grid h-11 grid-cols-3 items-center">
        <div className="justify-self-start">
          {backHref && (
            <Link
              href={backHref}
              className="-ml-2 flex min-h-[44px] items-center gap-0.5 px-2 text-[1.0625rem] text-[var(--color-accent)]"
            >
              <ChevronLeftIcon className="h-5 w-5" />
              {backLabel}
            </Link>
          )}
        </div>
        <div className="justify-self-center">
          {!large && <h1 className="truncate text-[1.0625rem] font-semibold">{title}</h1>}
        </div>
        <div className="justify-self-end">{trailing}</div>
      </div>
      {large && <h1 className="pb-2 pt-1 text-[2.125rem] font-bold tracking-tight">{title}</h1>}
    </header>
  );
}
