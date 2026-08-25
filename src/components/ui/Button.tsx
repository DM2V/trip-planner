import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  const base = "rounded-full px-4 py-2 text-sm font-medium transition-colors";
  const styles =
    variant === "primary"
      ? "bg-slate-50 text-slate-950"
      : "border border-slate-700 text-slate-50";

  return <button className={`${base} ${styles} ${className}`} {...props} />;
}
