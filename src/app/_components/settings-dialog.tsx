"use client";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader
} from "~/components/ui/dialog";
import {
  usePathname,
  useRouter,
  useSearchParams
} from "next/navigation";
import {
  useEffect,
  useState,
} from "react";
import { Button } from "~/components/ui/button";
import { useClerk } from "@clerk/nextjs";
import ThemeSelector from "./theme-selector";
import toast from "react-hot-toast";



export default function SettingsDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeDeleteAction, setActiveDeleteAction] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const { signOut } = useClerk();

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();


  const getCurrentPathWithoutHash = () => {
    return `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  }


  useEffect(() => {
    const checkHashAndSetOpen = () => {
      const currentHash = window.location.hash;
      setIsOpen(currentHash === '#settings');
    };
    checkHashAndSetOpen();
    window.addEventListener('hashchange', checkHashAndSetOpen);

    return () => {
      window.removeEventListener('hashchange', checkHashAndSetOpen);
    };
  }, [pathname, searchParams]);


  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);

    if (!open && window.location.hash === '#settings') {
      const currentPath = getCurrentPathWithoutHash();
      router.replace(currentPath, { scroll: false });
    }
  };


  const handleLogout = async () => {
    await signOut({ redirectUrl: '/' });
  };


  const handleDeleteAccount = async () => {
    setActiveDeleteAction("account");
    setError(null);
    try {
      const response = await fetch("/api/user/delete", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete account");
      }
      toast.success("Account deleted successfully");
      await signOut({ redirectUrl: "/" });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setActiveDeleteAction(null);
    }
  };


  const handleDeleteMemory = async () => {
    setActiveDeleteAction("memory");
    setError(null);
    try {
      const response = await fetch("/api/memory/delete", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete memory");
      }
      toast.success("Memory deleted successfully");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setActiveDeleteAction(null);
    }
  };


  const handleDeleteAllChats = async () => {
    setActiveDeleteAction("chats");
    setError(null);
    try {
      const response = await fetch("/api/conversations/delete", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete all chats");
      }
      toast.success("All chats deleted successfully");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setActiveDeleteAction(null);
    }
  };


  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>
              Manage your account settings and preferences here.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="mt-2 flex justify-between items-center">
              <label>Theme</label>
              <ThemeSelector />
            </div>

            <div className="mt-2 flex justify-between items-center">
              <label>Delete all chats</label>
              <Button
                variant={"destructive"}
                onClick={handleDeleteAllChats}
                disabled={activeDeleteAction !== null}
              >
                {activeDeleteAction === "chats" ? "Deleting..." : "Delete all"}
              </Button>
            </div>

            <div className="mt-2 flex justify-between items-center">
              <label>Delete my memory</label>
              <Button
                variant={"destructive"}
                onClick={handleDeleteMemory}
                disabled={activeDeleteAction !== null}
              >
                {activeDeleteAction === "memory"
                  ? "Deleting..."
                  : "Delete memory"}
              </Button>
            </div>

            <div className="mt-2 flex justify-between items-center">
              <label>Delete account</label>
              <Button
                variant={"destructive"}
                onClick={handleDeleteAccount}
                disabled={activeDeleteAction !== null}
              >
                {activeDeleteAction === "account" ? "Deleting..." : "Delete"}
              </Button>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div className="mt-2 flex justify-between items-center">
              <label>Logout</label>
              <Button variant={"outline"} onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
