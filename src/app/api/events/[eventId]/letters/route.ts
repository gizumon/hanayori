import { NextRequest, NextResponse } from "next/server";
import { createLetter, listLettersForEvent } from "@/lib/server/letters";
import { handleRouteError } from "@/lib/server/route-helpers";
import { requireUid } from "@/lib/server/session";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const uid = await requireUid();
    const { eventId } = await params;
    const letters = await listLettersForEvent(uid, eventId);
    return NextResponse.json({ letters });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const uid = await requireUid();
    const { eventId } = await params;
    const body = await request.json();
    const letter = await createLetter(uid, eventId, {
      to: String(body?.to ?? ""),
      body: String(body?.body ?? ""),
      theme: body?.theme ?? "rose",
      photo: body?.photo ?? null,
      photoRatio: body?.photoRatio,
      cardName: body?.cardName ?? null,
      honor: body?.honor ?? null,
    });
    return NextResponse.json({ letter }, { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}
