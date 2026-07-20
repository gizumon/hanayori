import { NextRequest, NextResponse } from "next/server";
import { createEvent, listEventsForUser } from "@/lib/server/events";
import { handleRouteError } from "@/lib/server/route-helpers";
import { requireUid } from "@/lib/server/session";

export async function GET() {
  try {
    const uid = await requireUid();
    const events = await listEventsForUser(uid);
    return NextResponse.json({ events });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const uid = await requireUid();
    const body = await request.json();
    const event = await createEvent(uid, {
      name: String(body?.name ?? ""),
      date: body?.date ? String(body.date) : null,
    });
    return NextResponse.json({ event }, { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}
