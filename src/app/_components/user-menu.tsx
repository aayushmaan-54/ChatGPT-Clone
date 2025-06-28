"use client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "~/components/ui/dropdown-menu";
import { useClerk, useUser } from "@clerk/nextjs";
import { Button } from "~/components/ui/button";
import UserAvatar from "./user-avatar";
import { Bolt, LogOut, UserCog } from "lucide-react";
import {
  usePathname,
  useRouter,
  useSearchParams
} from "next/navigation";



export default function UserMenu() {
  const { isSignedIn, user } = useUser();
  const { signOut, openUserProfile } = useClerk();

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (!isSignedIn || !user) {
    return null;
  }


  const handleLogout = async () => {
    await signOut({ redirectUrl: '/' });
  };


  const handleManageAccount = () => {
    openUserProfile();
  };


  const handleOpenSettings = () => {
    const currentPath = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    router.push(`${currentPath}#settings`, { scroll: false });
  }


  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <UserAvatar
              user={user}
              className="size-9"
              avatarTextSize="text-[15px] font-medium"
            />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-62">
          <div className="flex items-center p-2 cursor-default">
            <UserAvatar
              user={user}
              className="size-7 cursor-default"
              avatarTextSize="text-[12px] font-medium"
            />
            <div className="ml-2 flex flex-col justify-center overflow-hidden flex-1">
              {user.fullName && (
                <p className="text-base font-medium leading-tight text-muted-foreground/50 truncate">
                  {user.fullName}
                </p>
              )}
              {user.primaryEmailAddress && (
                <p className="text-sm leading-tight text-muted-foreground/50 truncate">
                  {user.primaryEmailAddress.emailAddress}
                </p>
              )}
            </div>
          </div>

          <DropdownMenuItem onClick={handleOpenSettings} className="data-[highlighted]:rounded-[8px]">
            <div className="flex items-center gap-2">
              <Bolt />
              <span>Settings</span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleManageAccount} className="data-[highlighted]:rounded-[8px]">
            <div className="flex items-center gap-2">
              <UserCog />
              <span>Manage Account</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="data-[highlighted]:rounded-[8px]">
            <div className="flex items-center gap-2">
              <LogOut />
              <span>Log Out</span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
