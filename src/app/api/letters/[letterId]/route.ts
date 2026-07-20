import { NextRequest, NextResponse } from "next/server";
import { deleteLetter, updateLetter } from "@/lib/server/letters";
import { handleRouteError } from "@/lib/server/route-helpers";
import { requireUid } from "@/lib/server/session";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ letterId: string }> }
) {
  try {
    const uid = await requireUid();
    const { letterId } = await params;
    const body = await request.json();
    const letter = await updateLetter(uid, letterId, body);
    return NextResponse.json({ letter });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ letterId: string }> }
) {
  try {
    const uid = await requireUid();
    const { letterId } = await params;
    await deleteLetter(uid, letterId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleRouteError(err);
  }
}
