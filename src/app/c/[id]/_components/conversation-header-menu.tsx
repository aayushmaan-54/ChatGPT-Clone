"use client";
import { Ellipsis, SquarePen, Trash2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { ClientConversationType } from "~/common/types/types";
import { deleteConversation as deleteConversationAction } from "~/common/lib/db/delete-conversation";
import { useRouter } from "next/navigation";
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
import { useConversationStore } from "~/common/store/conversation-store";

interface ConversationHeaderMenuProps {
  conversation: ClientConversationType;
}



export default function ConversationHeaderMenu({
  conversation,
}: ConversationHeaderMenuProps) {
  const router = useRouter();
  const {
    updateConversationTitle: updateStoreTitle,
    deleteConversation: deleteStoreConversation,
  } = useConversationStore();


  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState(
    conversation.conversationTitle as string,
  );


  // Handle edit conversation title
  const handleEdit = () => {
    setNewTitle(conversation.conversationTitle as string);
    setIsEditDialogOpen(true);
  };


  // Handle confirm delete conversation
  const handleConfirmDelete = async () => {
    const result = await deleteConversationAction(conversation._id);
    if (result.success) {
      deleteStoreConversation(conversation._id);
      router.push("/");
    }
    setIsDeleteDialogOpen(false);
  };


  // Handle save conversation title
  const handleSave = async () => {
    const result = await updateConversationTitle(conversation._id, newTitle);
    if (result.success) {
      updateStoreTitle(conversation._id, newTitle);
    }
    setIsEditDialogOpen(false);
  };


  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Ellipsis />
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
    </>
  );
}
