"use client";
import { MoreHorizontal, SquarePen, Trash2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { ClientConversationType } from "../types/types";
import { deleteConversation as deleteConversationAction } from "~/common/lib/db/delete-conversation";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { updateConversationTitle } from "~/common/lib/db/update-conversation-title";
import { useConversationStore } from "../store/conversation-store";

interface ChatHistoryMenuProps {
  conversation: ClientConversationType;
}

export default function ChatHistoryMenu({
  conversation,
}: ChatHistoryMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    updateConversationTitle: updateStoreTitle,
    deleteConversation: deleteStoreConversation,
  } = useConversationStore();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState(
    conversation.conversationTitle as string,
  );

  const handleEdit = () => {
    setNewTitle(conversation.conversationTitle as string);
    setIsEditDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    const result = await deleteConversationAction(conversation._id);
    if (result.success) {
      deleteStoreConversation(conversation._id);
      if (pathname === `/c/${conversation._id}`) {
        router.push("/");
      }
    }
    setIsDeleteDialogOpen(false);
  };

  const handleSave = async () => {
    const result = await updateConversationTitle(conversation._id, newTitle);
    if (result.success) {
      updateStoreTitle(conversation._id, newTitle);
    }
    setIsEditDialogOpen(false);
  };

  return (
    <div
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="size-8 p-0">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              handleEdit();
            }}
          >
            <SquarePen className="mr-2 size-4" />
            <span>Edit title</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setIsDeleteDialogOpen(true);
            }}
          >
            <Trash2 className="mr-2 size-4" />
            <span>Delete chat</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit chat title</DialogTitle>
          </DialogHeader>
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Enter a new title"
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete this
              conversation.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
