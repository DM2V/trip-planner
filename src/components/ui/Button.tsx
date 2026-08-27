import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "plain" | "destructive";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

const VARIANTS: Record<Variant, string> = {
  primary: "bg-[var(--color-accent)] text-white active:opacity-70",
  secondary: "bg-[var(--color-fill-secondary)] text-[var(--color-accent)] active:opacity-60",
  plain: "text-[var(--color-accent)] active:opacity-50",
  destructive: "text-[var(--color-destructive)] active:opacity-50",
};

// Shared with plain <Link> elements that need to look like a button (buttons can't nest inside
// the <a> a Link renders, so those spots build the class string directly instead of nesting).
export function buttonClassName(variant: Variant = "primary", className = "") {
  const base =
    "inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-2xl px-4 text-[1.0625rem] font-semibold transition-opacity disabled:opacity-35";
  return `${base} ${VARIANTS[variant]} ${className}`;
}

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return <button className={buttonClassName(variant, className)} {...props} />;
}
