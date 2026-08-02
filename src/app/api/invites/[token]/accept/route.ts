import { NextResponse } from "next/server";
import { acceptInvite } from "@/lib/server/invites";
import { handleRouteError } from "@/lib/server/route-helpers";
import { requireUid } from "@/lib/server/session";

/**
 * 招待の受諾。**POST でしか消費しない**のが要点で、GET(ページ表示・リンク
 * プレビュー・prefetch)では絶対にトークンを消費しない。使い切りのリンクが
 * クローラーに潰されるのを防ぐため。
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const uid = await requireUid();
    const { token } = await params;
    const result = await acceptInvite(uid, token);
    return NextResponse.json(result);
  } catch (err) {
    return handleRouteError(err);
  }
}
