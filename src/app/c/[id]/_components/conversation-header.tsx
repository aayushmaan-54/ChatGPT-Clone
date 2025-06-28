"use client";
import { useConversationStore } from '~/common/store/conversation-store';
import { ClientConversationType } from '~/common/types/types';
import ConversationHeaderMenu from './conversation-header-menu';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ConversationHeaderProps {
  initialConversation: ClientConversationType | null;
}



export default function ConversationHeader({
  initialConversation,
}: ConversationHeaderProps) {
  const params = useParams();
  const id = params.id as string;

  // Get conversation from store
  const conversationFromStore = useConversationStore((state) =>
    state.conversations.find((c) => c._id === id)
  );

  // Set conversation
  const [conversation, setConversation] = useState(
    initialConversation ?? conversationFromStore
  );

  // Update conversation if it changes
  useEffect(() => {
    if (conversationFromStore) {
      setConversation(conversationFromStore);
    }
  }, [conversationFromStore]);

  return (
    <>
      <h1 className="text-lg truncate max-w-sm md:max-w-md lg:max-w-lg">
        {conversation?.conversationTitle ?? 'New Chat'}
      </h1>
      <div className="ml-auto">
        {conversation && (
          <ConversationHeaderMenu conversation={conversation} />
        )}
      </div>
    </>
  );
}
