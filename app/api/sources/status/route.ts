import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getSources, deleteSource } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await getAuthUser();
    const { searchParams } = new URL(req.url);
    const notebookId = searchParams.get("notebookId");

    if (!notebookId) {
      return NextResponse.json({ error: "Notebook ID required" }, { status: 400 });
    }

    const sources = await getSources(notebookId, userId);
    return NextResponse.json({ sources });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await getAuthUser();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Source ID required" }, { status: 400 });
    }

    const success = await deleteSource(id, userId);
    return NextResponse.json({ success });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
