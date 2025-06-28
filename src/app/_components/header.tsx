import {
  SignedIn,
  SignedOut,
} from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { SidebarTrigger } from "~/components/ui/sidebar";
import { SquarePen } from "lucide-react";
import UserMenu from "./user-menu";



export default function Header() {
  return (
    <>
      <header className="w-full flex justify-between items-center p-4 gap-4 h-16">
        <div className="flex items-center gap-2">
          <SignedIn>
            <SidebarTrigger className="cursor-e-resize" />
            <Button variant={"ghost"} className="size-8 rounded-full p-2">
              <SquarePen className="size-4.5" />
            </Button>
          </SignedIn>
          <h1 className="font-medium text-lg">ChatGPT Clone</h1>
        </div>
        <div className="flex items-center gap-4">
          <SignedOut>
            <Link href="/auth/login" passHref>
              <Button className="rounded-full">Log in</Button>
            </Link>
            <Link href="/auth/sign-up" passHref>
              <Button variant={"outline"} className="rounded-full">
                Sign up for free
              </Button>
            </Link>
          </SignedOut>
          <SignedIn>
            <UserMenu />
          </SignedIn>
        </div>
      </header>
    </>
  );
}
