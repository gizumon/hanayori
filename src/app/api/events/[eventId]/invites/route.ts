import { NextResponse } from "next/server";
import { createInvite } from "@/lib/server/invites";
import { handleRouteError } from "@/lib/server/route-helpers";
import { requireUid } from "@/lib/server/session";

/** 招待リンクを 1 本発行する(使い切り・7 日で失効)。 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const uid = await requireUid();
    const { eventId } = await params;
    const invite = await createInvite(uid, eventId);
    return NextResponse.json({ invite }, { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}
