import { redirect } from "next/navigation";

export default async function ChatRoomPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  redirect(`/app/sessions/${sessionId}`);
}
