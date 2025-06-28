import { clerkClient, getAuth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";



export async function DELETE(req: NextRequest) {
  const { userId } = getAuth(req);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Delete user
    const client = await clerkClient();
    await client.users.deleteUser(userId);
    return NextResponse.json({ message: "User deleted" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Error deleting user" },
      { status: 500 },
    );
  }
}
