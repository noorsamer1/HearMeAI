import SessionsWorkspacePage from "@/components/app/SessionsWorkspacePage";

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  return <SessionsWorkspacePage initialSessionId={sessionId} />;
}
