import { getAllHistoryMessages } from "~/common/lib/db/get-all-messages";
import ChatPageClient from "./_components/chat-page-client";
import { MessageGroup } from "~/common/types/types";



export default async function chatPage({ params }: Readonly<{
  params: Promise<{ id: string }>
}>) {
  const { id } = await params;
  const initialMessages: MessageGroup[] = await getAllHistoryMessages(id);

  return (
    <>
      <ChatPageClient
        conversationId={id}
        initialMessages={initialMessages}
      />
    </>
  );
}
