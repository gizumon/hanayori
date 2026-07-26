import { NextRequest, NextResponse } from "next/server";
import { handleRouteError } from "@/lib/server/route-helpers";
import { requireUid } from "@/lib/server/session";
import { createSignedUploadUrl } from "@/lib/server/storage";

/**
 * Cloud Storage への署名付きアップロード URL を発行する。ログイン必須。
 * クライアントは受け取った uploadUrl に対して、返された headers を付けて
 * 画像バイナリを直接 PUT し、完了後は url を画像 URL として使う。
 */
export async function POST(request: NextRequest) {
  try {
    await requireUid();
    const body = await request.json().catch(() => null);
    const contentType = String(body?.contentType ?? "");
    const signed = await createSignedUploadUrl(contentType);
    return NextResponse.json(signed);
  } catch (err) {
    return handleRouteError(err);
  }
}
