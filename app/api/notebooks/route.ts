import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getNotebooks, createNotebook, deleteNotebook } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await getAuthUser();
    const notebooks = await getNotebooks(userId);
    return NextResponse.json({ notebooks });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await getAuthUser();
    const body = await req.json();
    const title = body.title || "Untitled Notebook";
    const notebook = await createNotebook(userId, title);
    return NextResponse.json({ notebook });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await getAuthUser();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Notebook ID required" }, { status: 400 });
    }
    const success = await deleteNotebook(id, userId);
    return NextResponse.json({ success });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
