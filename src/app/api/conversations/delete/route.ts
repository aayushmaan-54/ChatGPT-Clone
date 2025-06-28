import { getAuth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";
import { deleteAllConversations } from "~/common/lib/db/delete-all-conversations";



export async function DELETE(req: NextRequest) {
  const { userId } = getAuth(req);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Delete all conversations
    const result = await deleteAllConversations(userId);
    if (result.success) {
      return NextResponse.json(
        { message: "All conversations deleted" },
        { status: 200 },
      );
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error deleting all conversations:", error);
    return NextResponse.json(
      { error: "Error deleting all conversations" },
      { status: 500 },
    );
  }
}
