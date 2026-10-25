import { redirect } from "next/navigation";
import { logout } from "@/app/(auth)/actions";
import { TabBar } from "@/components/TabBar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DeleteAccountButton } from "@/components/settings/DeleteAccountButton";
import { ListSection } from "@/components/ui/List";
import { PageHeader } from "@/components/ui/PageHeader";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  const displayName = profile?.display_name || user.email?.split("@")[0] || "Account";

  return (
    <main className="flex min-h-dvh flex-col gap-6 pb-24">
      <PageHeader title="Settings" large />

      <div className="flex flex-col gap-6 px-4">
        <ListSection>
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] text-[1.375rem] font-semibold text-white">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[1.0625rem] font-semibold">{displayName}</p>
              {user.email && (
                <p className="truncate text-[0.8125rem] text-[var(--color-label-secondary)]">
                  {user.email}
                </p>
              )}
            </div>
          </div>
        </ListSection>

        <div className="flex flex-col gap-2">
          <p className="px-1 text-[0.8125rem] font-medium uppercase tracking-wide text-[var(--color-label-secondary)]">
            Appearance
          </p>
          <ListSection>
            <div className="px-4 py-3">
              <ThemeToggle />
            </div>
          </ListSection>
        </div>

        <ListSection>
          <form action={logout}>
            <button
              type="submit"
              className="flex min-h-[52px] w-full items-center justify-center text-[1.0625rem] font-medium text-[var(--color-destructive)] active:bg-[var(--color-fill-secondary)]"
            >
              Log Out
            </button>
          </form>
        </ListSection>

        <div className="flex flex-col gap-2">
          <p className="px-1 text-[0.8125rem] font-medium uppercase tracking-wide text-[var(--color-label-secondary)]">
            Danger Zone
          </p>
          <ListSection footer="Permanently deletes your account and all your trips. This can't be undone.">
            <DeleteAccountButton />
          </ListSection>
        </div>

        <p className="px-1 text-center text-[0.75rem] text-[var(--color-label-tertiary)]">
          Trip Planner
        </p>
      </div>

      <TabBar />
    </main>
  );
}
