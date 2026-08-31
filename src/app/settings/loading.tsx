import { TabBar } from "@/components/TabBar";
import { ListSection } from "@/components/ui/List";
import { PageHeader } from "@/components/ui/PageHeader";

// Next.js renders this automatically while the session check for this page resolves — same
// shape as the real page, so nothing jumps once it lands.
export default function SettingsLoading() {
  return (
    <main className="flex min-h-dvh flex-col gap-6 pb-24">
      <PageHeader title="Settings" large />

      <div className="flex flex-col gap-6 px-4">
        <ListSection>
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="h-14 w-14 shrink-0 animate-pulse rounded-full bg-[var(--color-fill-secondary)]" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-1/2 animate-pulse rounded bg-[var(--color-fill-secondary)]" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-[var(--color-fill-secondary)]" />
            </div>
          </div>
        </ListSection>

        <div className="flex flex-col gap-2">
          <div className="h-3 w-20 animate-pulse rounded bg-[var(--color-fill-secondary)]" />
          <ListSection>
            <div className="px-4 py-3">
              <div className="h-9 animate-pulse rounded-xl bg-[var(--color-fill-secondary)]" />
            </div>
          </ListSection>
        </div>

        <ListSection>
          <div className="flex min-h-[52px] items-center justify-center">
            <div className="h-4 w-16 animate-pulse rounded bg-[var(--color-fill-secondary)]" />
          </div>
        </ListSection>
      </div>

      <TabBar />
    </main>
  );
}
