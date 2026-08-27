import type { ReactNode } from "react";

interface FormRowProps {
  label: string;
  htmlFor?: string;
  children: ReactNode;
}

// iOS form row: label on the left, value control right-aligned in the same row (e.g. Calendar's
// "New Event" fields) — used inside a <ListSection> for grouped forms.
export function FormRow({ label, htmlFor, children }: FormRowProps) {
  return (
    <div className="flex min-h-[44px] items-center gap-3 px-4 py-2.5">
      <label htmlFor={htmlFor} className="w-24 shrink-0 text-[1.0625rem]">
        {label}
      </label>
      {children}
    </div>
  );
}
