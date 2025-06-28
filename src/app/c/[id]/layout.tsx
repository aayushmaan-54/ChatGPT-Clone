import { SignedIn } from "@clerk/nextjs";
import ConversationHeaderMenu from "./_components/conversation-header-menu";
import { getConversationById } from "~/common/lib/db/get-conversation-by-id";
import { SidebarTrigger } from "~/components/ui/sidebar";



export default async function ConversationLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;
  const conversation = await getConversationById(id);


  return (
    <section className="flex flex-col h-screen w-full">
      <div className="flex items-center justify-between px-4 py-2 border-b shrink-0">
        <div className="flex items-center gap-2">
          <SignedIn>
            <SidebarTrigger className="cursor-e-resize" />
          </SignedIn>
          <h1 className="text-lg">
            {conversation?.conversationTitle ?? "New Chat"}
          </h1>
        </div>

        <div>
          {conversation && (
            <ConversationHeaderMenu conversation={conversation} />
          )}
        </div>
      </div>
      <main className="flex-1 overflow-hidden">{children}</main>
    </section>
  );
}
