import Sidebar from "@/components/app/Sidebar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden selection:bg-brand-500/30" style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text-primary)" }}>
      <Sidebar />
      <main className="flex-1 min-w-0 relative h-full flex flex-col">
        {/* Ambient App Background */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-brand-600/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px]" />
        </div>
        <div className="relative z-10 flex-1 flex flex-col h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
