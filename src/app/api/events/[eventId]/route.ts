import { NextRequest, NextResponse } from "next/server";
import { updateEvent } from "@/lib/server/events";
import { handleRouteError } from "@/lib/server/route-helpers";
import { requireUid } from "@/lib/server/session";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const uid = await requireUid();
    const { eventId } = await params;
    const body = await request.json();
    const event = await updateEvent(uid, eventId, body);
    return NextResponse.json({ event });
  } catch (err) {
    return handleRouteError(err);
  }
}
