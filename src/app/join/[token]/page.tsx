import { JoinScreen } from "@/components/join/JoinScreen";
import { getInvitePreview } from "@/lib/server/invites";
import { isEventMember } from "@/lib/server/members";
import { getSessionUid } from "@/lib/server/session";

/**
 * 招待リンクの受諾ページ。
 *
 * ここ(GET)ではトークンの状態を読むだけで**消費しない**。実際の受諾は
 * `POST /api/invites/{token}/accept` だけが行う。使い切りのリンクが SNS の
 * リンクプレビューやブラウザの prefetch で潰れるのを防ぐため。
 *
 * 未ログインでもイベント名は表示する。トークンを持っている人にしか見えない
 * 情報なので、「何に招待されたのか分からないままログインさせる」のを避ける。
 */
export default async function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const [preview, uid] = await Promise.all([getInvitePreview(token), getSessionUid()]);
  const alreadyMember =
    uid && preview.eventId ? await isEventMember(uid, preview.eventId) : false;

  return (
    <JoinScreen
      token={token}
      status={preview.status}
      eventName={preview.eventName}
      eventId={preview.eventId}
      signedIn={Boolean(uid)}
      alreadyMember={alreadyMember}
    />
  );
}
