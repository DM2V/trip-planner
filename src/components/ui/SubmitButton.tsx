"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";

interface SubmitButtonProps {
  children: React.ReactNode;
  pendingLabel: string;
  className?: string;
}

// Swaps to `pendingLabel` and disables itself while the enclosing <form>'s server action is in
// flight. Must be rendered as a descendant of the <form> — useFormStatus only ever reflects the
// nearest ancestor form, never one rendered by the same component that calls the hook.
export function SubmitButton({ children, pendingLabel, className }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className={className}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
