import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from "~/components/ui/avatar";
import type { UserResource } from "@clerk/types";
import { cn } from "~/lib/utils";
import getAvatarText from "~/common/utils/get-avatar-text";



export default function UserAvatar({ user, className, avatarTextSize }: { user: UserResource, className?: string, avatarTextSize?: string }) {
  return (
    <>
      <Avatar className={cn("size-10 cursor-pointer", className)}>
        {user.hasImage ? (
          <AvatarImage src={user.imageUrl} alt={user.fullName || "User Profile"} />
        ) : (
          <AvatarFallback className={cn(avatarTextSize)} >
            {getAvatarText(user.fullName || user.firstName || user.lastName || user.emailAddresses?.[0]?.emailAddress)}
          </AvatarFallback>
        )}
      </Avatar>
    </>
  )
}
