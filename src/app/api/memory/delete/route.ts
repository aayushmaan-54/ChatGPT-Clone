import { getAuth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";
import mem0Client from "~/common/lib/mem0-client";

export async function DELETE(req: NextRequest) {
  const { userId } = getAuth(req);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Delete all memories
    await mem0Client.deleteAll({ user_id: userId });
    return NextResponse.json({ message: "Memory deleted" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting memory:", error);
    return NextResponse.json(
      { error: "Error deleting memory" },
      { status: 500 },
    );
  }
}
