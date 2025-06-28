"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "~/components/ui/sidebar"
import Link from "next/link";
import { useClerk } from "@clerk/nextjs";
import SearchCommandDialog, { CommandGroup } from "./search-command-dialog";
import { usePathname, useRouter } from "next/navigation";
import {
  Loader,
  LogOut,
  MessageCircle,
  Search,
  SquarePen
} from "lucide-react";
import { Button } from "~/components/ui/button";
import devLogger from "../utils/dev-logger";
import Icons from "../icons/icons";
import { getAllConversations } from "../lib/db/get-all-conversations";
import ChatHistoryMenu from "./chat-history-menu";
import { cn } from "~/lib/utils";
import { useConversationStore } from "../store/conversation-store";



export default function AppSidebar() {
  const { signOut } = useClerk();

  const router = useRouter();
  const pathname = usePathname();
  const {
    conversations,
    setConversations,
    addConversations,
  } = useConversationStore();

  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const sentinelRef = useRef(null);


  // Load more conversations as user scrolls
  const loadMoreConversations = useCallback(async () => {
    if (isFetchingMore || !hasMore) return;

    setIsFetchingMore(true);
    try {
      const { conversations: newConvs, hasMore: newHasMore } =
        await getAllConversations({ page, limit: 25 });
      addConversations(newConvs);
      setPage((prev) => prev + 1);
      setHasMore(newHasMore);
    } catch (error) {
      devLogger.error("Failed to fetch more conversations", error);
    } finally {
      setIsFetchingMore(false);
    }
  }, [page, hasMore, isFetchingMore, addConversations]);


  // Fetch initial conversations
  useEffect(() => {
    const fetchInitialConversations = async () => {
      setIsLoading(true);
      try {
        const { conversations: initialConvs, hasMore: initialHasMore } =
          await getAllConversations({ page: 1, limit: 25 });
        setConversations(initialConvs);
        setHasMore(initialHasMore);
        setPage(2);
      } catch (error) {
        devLogger.error("Failed to fetch conversations", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialConversations();
  }, [setConversations]);

  // Load more conversations as user scrolls
  useEffect(() => {
    if (isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isFetchingMore) {
          loadMoreConversations();
        }
      },
      { threshold: 1 },
    );

    const currentSentinel = sentinelRef.current;

    if (currentSentinel) {
      observer.observe(currentSentinel);
    }

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel);
      }
    };
  }, [isLoading, hasMore, isFetchingMore, loadMoreConversations]);

  // Handle logout
  const handleLogout = async () => {
    await signOut({ redirectUrl: "/" });
  };

  // Handle search dialog open change
  const handleSearchDialogOpenChange = (open: boolean) => {
    setIsSearchDialogOpen(open);
    if (!open) {
      setSearchQuery("");
    }
  };

  // Conversation items
  const conversationItems = conversations.map((conv) => ({
    id: conv._id,
    label: conv.conversationTitle as string,
    icon: MessageCircle,
    onSelect: () => {
      devLogger.log(`Navigating to conversation: ${conv._id}`);
      handleSearchDialogOpenChange(false);
      router.push(`/c/${conv._id}`);
    },
  }));

  // Command groups
  const commandGroups: CommandGroup[] = [
    {
      items: [
        {
          id: "new-chat",
          label: "New Chat",
          icon: SquarePen,
          onSelect: () => {
            devLogger.log("Starting new chat from dialog...");
            handleSearchDialogOpenChange(false);
            router.push("/");
          },
        },
      ],
    },
    {
      heading: "Recent conversations",
      items: searchQuery
        ? conversationItems
        : conversationItems.slice(0, 5),
    },
  ];


  return (
    <>
      <Sidebar>
        <SidebarHeader>
          <Button asChild variant="ghost" className="size-8 rounded-[7px]">
            <Link href="/" passHref>
              <Icons.ChatGPT className="size-6" />
            </Link>
          </Button>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton className="select-none" asChild>
                    <Link href="/">
                      <SquarePen className="size-6" />
                      <span>New chat</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    className="select-none"
                    onClick={() => setIsSearchDialogOpen(true)}
                  >
                    <Search className="size-6" />
                    <span>Search chats</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>Recent Chats</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {isLoading ? (
                  <SidebarMenuItem>
                    <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                      <Loader className="size-4 animate-spin" />
                      <span>Loading...</span>
                    </div>
                  </SidebarMenuItem>
                ) : conversations.length > 0 ? (
                  conversations.map((conv) => {
                    const isActive = pathname === `/c/${conv._id}`;
                    return (
                      <SidebarMenuItem key={conv._id}>
                        <div
                          className={cn(
                            "group flex items-center justify-between w-full rounded-md",
                            isActive && "bg-accent rounded-[8px]",
                          )}
                        >
                          <Link
                            href={`/c/${conv._id}`}
                            className="flex-grow truncate px-3 py-2"
                          >
                            {conv.conversationTitle as string}
                          </Link>
                          <ChatHistoryMenu conversation={conv} />
                        </div>
                      </SidebarMenuItem>
                    );
                  })
                ) : (
                  <SidebarMenuItem>
                    <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                      <span>No conversations yet</span>
                    </div>
                  </SidebarMenuItem>
                )}
                {hasMore && !isLoading && (
                  <div ref={sentinelRef} style={{ height: 1 }} />
                )}
                {isFetchingMore && (
                  <SidebarMenuItem>
                    <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                      <Loader className="size-4 animate-spin" />
                      <span>Loading more...</span>
                    </div>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarSeparator />
          <SidebarMenu>
            <SidebarMenuItem className="pt-2 hover:bg-transparent">
              <SidebarMenuButton
                className="select-none"
                asChild
                onClick={handleLogout}
              >
                <div>
                  <LogOut className="size-6" />
                  <span>Logout</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SearchCommandDialog
        open={isSearchDialogOpen}
        setOpen={handleSearchDialogOpenChange}
        groups={commandGroups}
        search={searchQuery}
        onSearch={setSearchQuery}
      />
    </>
  );
}
