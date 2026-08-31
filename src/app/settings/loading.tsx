import { TabBar } from "@/components/TabBar";
import { PageHeader } from "@/components/ui/PageHeader";

// Next.js renders this automatically while the session check for this page resolves — same
// shape as the real page, so nothing jumps once it lands.
export default function SettingsLoading() {
  return (
    <main className="flex min-h-dvh flex-col gap-6 pb-24">
      <PageHeader title="Settings" large />

      <div className="flex flex-col gap-4 px-4">
        <div className="flex flex-col gap-2">
          <div className="h-3 w-24 animate-pulse rounded bg-[var(--color-fill-secondary)]" />
          <div className="h-11 animate-pulse rounded-xl bg-[var(--color-fill-secondary)]" />
        </div>
      </div>

      <TabBar />
    </main>
  );
}
