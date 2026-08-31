import { redirect } from "next/navigation";
import { logout } from "@/app/(auth)/actions";
import { TabBar } from "@/components/TabBar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PageHeader } from "@/components/ui/PageHeader";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="flex min-h-dvh flex-col gap-6 pb-24">
      <PageHeader title="Settings" large />

      <div className="flex flex-col gap-4 px-4">
        <div className="flex flex-col gap-2">
          <p className="px-1 text-[0.8125rem] font-medium uppercase tracking-wide text-[var(--color-label-secondary)]">
            Appearance
          </p>
          <ThemeToggle />
        </div>

        <form action={logout}>
          <button type="submit" className="text-[0.9375rem] text-[var(--color-destructive)]">
            Log out
          </button>
        </form>
      </div>

      <TabBar />
    </main>
  );
}
