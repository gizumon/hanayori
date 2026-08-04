import { NextResponse } from "next/server";
import { requireEventMembership } from "@/lib/server/events";
import { invitesOfEvent } from "@/lib/server/invites";
import { membersOfEvent } from "@/lib/server/members";
import { handleRouteError } from "@/lib/server/route-helpers";
import { requireUid } from "@/lib/server/session";

/**
 * メンバー一覧と招待リンク一覧。共通設定ドロワーを開いたときに 1 回だけ叩く。
 *
 * メンバー確認(= イベント doc の読み取り)はここで 1 回だけ行い、その結果を
 * 両方に渡す。取得系を分けて呼ぶと同じ doc を 2 回読むことになるため。
 * 残る往復はプロフィール解決と招待クエリの 2 本で、これは並列に流す。
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const uid = await requireUid();
    const { eventId } = await params;
    const { data } = await requireEventMembership(uid, eventId);
    const [members, invites] = await Promise.all([
      membersOfEvent(data),
      invitesOfEvent(eventId),
    ]);
    return NextResponse.json({ members, invites, currentUid: uid });
  } catch (err) {
    return handleRouteError(err);
  }
}
