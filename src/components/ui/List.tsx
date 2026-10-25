import type { ReactNode } from "react";

interface ListSectionProps {
  children: ReactNode;
  footer?: string;
}

// iOS "inset grouped" list: rounded card, hairline dividers between rows (see .ios-list in
// globals.css), optional small caption below explaining the section.
export function ListSection({ children, footer }: ListSectionProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="ios-list overflow-hidden rounded-2xl bg-(--color-bg-elevated)">{children}</div>
      {footer && <p className="px-4 text-[0.8125rem] text-(--color-label-secondary)">{footer}</p>}
    </div>
  );
}
