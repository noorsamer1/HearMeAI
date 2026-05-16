import Sidebar from "@/components/app/Sidebar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex h-screen overflow-hidden selection:bg-[color-mix(in_srgb,var(--color-brand)_30%,transparent)]"
      style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text-primary)" }}
    >
      <Sidebar />
      <main className="flex-1 min-w-0 relative h-full flex flex-col">
        {/* Ambient App Background */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute right-1/4 top-1/4 h-[500px] w-[500px] rounded-full bg-[color-mix(in_srgb,var(--color-brand-600)_5%,transparent)] blur-[120px]" />
          <div className="absolute bottom-1/4 left-1/4 h-[400px] w-[400px] rounded-full bg-[color-mix(in_srgb,var(--color-accent)_5%,transparent)] blur-[100px]" />
        </div>
        <div className="relative z-10 flex-1 flex flex-col h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
