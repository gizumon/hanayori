"use client";

import { useState, useSyncExternalStore } from "react";
import { Check, Copy, Link2, Share2, UserMinus, X } from "lucide-react";
import { Avatar } from "./Avatar";
import { ConfirmDialog } from "./ConfirmDialog";
import { Toggle } from "./controls";
import styles from "./letter-studio.module.css";
import { useStudio } from "./StudioContext";
import { inviteUrl, useEventMembers } from "./useEventMembers";
import { copyText } from "@/lib/clipboard";
import { FONT_SIZE } from "@/lib/typography";
import type { EventInvite, EventMember, Project } from "./types";
import { COLOR } from "@/lib/palette";

interface MembersTabProps {
  project: Project;
  /** 自分が退出したときに呼ばれる。ドロワーを閉じてイベント一覧へ戻す。 */
  onLeaveEvent: () => void;
}

const sectionLabel = {
  fontSize: FONT_SIZE.caption,
  letterSpacing: "0.1em",
  color: COLOR.inkSoft,
} as const;

/** 確認ダイアログの対象。null = 閉。 */
type Pending =
  | { kind: "revoke"; token: string }
  | { kind: "remove"; member: EventMember }
  | { kind: "leave" };

/** 残り期間の表示。7 日の TTL に対して「あと N 日」で十分な粒度。 */
function expiryLabel(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "期限切れ";
  const hours = ms / (60 * 60 * 1000);
  if (hours < 24) return "まもなく失効";
  return `あと${Math.floor(hours / 24)}日`;
}

function displayNameOf(member: EventMember): string {
  return member.displayName?.trim() || member.email?.split("@")[0] || "名前未設定";
}

function Badge({ label }: { label: string }) {
  return (
    <span
      style={{
        flex: "none",
        padding: "2px 8px",
        borderRadius: 999,
        background: COLOR.tintRose,
        color: COLOR.accentInk,
        fontSize: FONT_SIZE.micro,
        letterSpacing: "0.08em",
      }}
    >
      {label}
    </span>
  );
}

/**
 * 共通設定ドロワーの「メンバー」タブ。
 *
 * 他タブと違い、ここでの操作(発行・取消・メンバー削除・退出)はすべて即時に
 * サーバーへ反映される。下書きを持たないので「設定を保存」の対象外で、
 * ドロワー側は未保存判定にもこのタブを含めない。
 */
export function MembersTab({ project, onLeaveEvent }: MembersTabProps) {
  const { toast, refreshEvents, updateProject } = useStudio();
  const {
    members,
    invites,
    currentUid,
    loading,
    busy,
    createInvite,
    revokeInvite,
    removeMember,
  } = useEventMembers(project.id, true);
  const [pending, setPending] = useState<Pending | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  // 他タブと同じくローカルに持たず即時保存するが、往復のあいだトグルが戻って
  // 見えないよう、送信中だけ楽観的な値を優先する。
  const [sharePending, setSharePending] = useState<boolean | null>(null);
  // navigator.share の有無はサーバーでは分からないので、クライアントでだけ true に
  // なる値として読む(値は変化しないので購読は no-op)。
  const canShare = useSyncExternalStore(
    () => () => {},
    () => typeof navigator.share === "function",
    () => false
  );

  const activeCount = invites.filter((i) => i.status === "active").length;
  const canInvite = activeCount < 5 && !busy;

  const handleCopy = async (invite: EventInvite) => {
    const ok = await copyText(inviteUrl(invite.token));
    if (!ok) {
      toast("コピーに失敗しました");
      return;
    }
    setCopiedToken(invite.token);
    setTimeout(() => setCopiedToken((t) => (t === invite.token ? null : t)), 1800);
    toast("招待リンクをコピーしました");
  };

  const handleShare = async (invite: EventInvite) => {
    try {
      await navigator.share({
        title: `${project.name} の編集に招待`,
        text: `「${project.name}」を一緒に編集しませんか?`,
        url: inviteUrl(invite.token),
      });
    } catch {
      // ユーザーが共有シートを閉じただけのこともあるので何も出さない。
    }
  };

  const handleCreate = async () => {
    try {
      const url = await createInvite();
      // 発行したら即コピーまでやってしまう(発行 → コピー → 貼り付けが常に一続き)。
      const ok = await copyText(url);
      toast(ok ? "招待リンクを発行してコピーしました" : "招待リンクを発行しました");
    } catch (err) {
      toast(err instanceof Error ? err.message : "招待リンクの発行に失敗しました");
    }
  };

  const handleShareMyLetters = async (shareMyLetters: boolean) => {
    setSharePending(shareMyLetters);
    const ok = await updateProject({ shareMyLetters });
    setSharePending(null);
    if (ok) {
      toast(
        shareMyLetters
          ? "自分のお手紙が他のメンバーにも見えるようになりました"
          : "自分のお手紙を他のメンバーから隠しました"
      );
    }
  };

  const handleConfirm = async () => {
    const target = pending;
    setPending(null);
    if (!target) return;
    try {
      if (target.kind === "revoke") {
        await revokeInvite(target.token);
        toast("招待リンクを取り消しました");
      } else if (target.kind === "remove") {
        await removeMember(target.member.uid);
        // 一覧側が持つ memberCount(作成者表示の出し分けに使う)を追随させる。
        void refreshEvents();
        toast(`${displayNameOf(target.member)}さんを外しました`);
      } else {
        if (currentUid) await removeMember(currentUid);
        toast("イベントから退出しました");
        onLeaveEvent();
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "操作に失敗しました");
    }
  };

  const confirmMessage = (target: Pending): string => {
    switch (target.kind) {
      case "revoke":
        return "この招待リンクを取り消します。すでに送った相手はこのリンクから参加できなくなります。";
      case "remove":
        return `${displayNameOf(target.member)}さんをこのイベントから外します。相手はイベントを開けなくなります。`;
      case "leave":
        return `「${project.name}」から退出します。もう一度参加するには、他のメンバーから招待リンクをもらう必要があります。`;
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className={styles.skeleton} style={{ height: 56, borderRadius: 12 }} />
        ))}
      </div>
    );
  }

  return (
    <>
      <span style={sectionLabel}>メンバー {members.length}人</span>
      <div
        style={{
          border: `1px solid ${COLOR.borderSoft}`,
          borderRadius: 14,
          background: COLOR.surfaceRaised,
          overflow: "hidden",
        }}
      >
        {members.map((member, i) => {
          const isSelf = member.uid === currentUid;
          // 自分は下の「退出」から抜ける。作成者はサーバー側でも他人から外せない。
          const canRemove = !isSelf && !member.isCreator;
          return (
            <div
              key={member.uid}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderTop: i === 0 ? "none" : `1px solid ${COLOR.divider}`,
              }}
            >
              <Avatar photoUrl={member.photoUrl} name={displayNameOf(member)} size={36} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      fontSize: FONT_SIZE.bodySm,
                      fontWeight: 600,
                      color: COLOR.ink,
                      letterSpacing: "0.04em",
                    }}
                  >
                    {displayNameOf(member)}
                  </span>
                  {isSelf && <Badge label="あなた" />}
                  {member.isCreator && <Badge label="作成者" />}
                </div>
                {member.email && (
                  <span
                    style={{
                      display: "block",
                      fontSize: FONT_SIZE.caption,
                      color: COLOR.inkSoft,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {member.email}
                  </span>
                )}
              </div>
              {canRemove && (
                <button
                  type="button"
                  onClick={() => setPending({ kind: "remove", member })}
                  disabled={busy}
                  aria-label={`${displayNameOf(member)}さんを外す`}
                  className={styles.btnOutline}
                  style={{
                    flex: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "6px 12px",
                    borderRadius: 999,
                    border: `1px solid ${COLOR.border}`,
                    background: COLOR.surfaceRaised,
                    color: COLOR.inkSoft,
                    fontSize: FONT_SIZE.caption,
                  }}
                >
                  <UserMinus size={13} strokeWidth={1.8} aria-hidden="true" />
                  外す
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
        <span style={sectionLabel}>お手紙の見せ方</span>
        <Toggle
          checked={sharePending ?? project.shareMyLetters}
          onChange={handleShareMyLetters}
          label="自分が作ったお手紙を他のメンバーにも見せる"
        />
        <p
          style={{
            margin: 0,
            fontSize: FONT_SIZE.caption,
            lineHeight: 1.7,
            color: COLOR.inkSoft,
          }}
        >
          これはあなたのお手紙だけの設定です。他のメンバーが切り替えることはできません。
          オフのあいだ、あなたのお手紙は一覧にも確認タブにも他のメンバーには出ません。
          同じように、他のメンバーのお手紙もその人が見せる設定にしているときだけ見えます。
          席札とエスコートカードは、この設定にかかわらず全員ぶんを確認タブから見られます。
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
        <span style={sectionLabel}>招待リンク</span>
        <p
          style={{
            margin: 0,
            fontSize: FONT_SIZE.caption,
            lineHeight: 1.7,
            color: COLOR.inkSoft,
          }}
        >
          リンクを開いた人 1 人だけがこのイベントに参加できます。発行から 7 日で失効し、
          参加した人はあなたと同じようにお手紙と設定を編集できます。
        </p>
      </div>

      {invites.length > 0 && (
        <div
          style={{
            border: `1px solid ${COLOR.borderSoft}`,
            borderRadius: 14,
            background: COLOR.surfaceRaised,
            overflow: "hidden",
          }}
        >
          {invites.map((invite, i) => {
            const expired = invite.status === "expired";
            return (
              <div
                key={invite.token}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 12px",
                  borderTop: i === 0 ? "none" : `1px solid ${COLOR.divider}`,
                  opacity: expired ? 0.6 : 1,
                }}
              >
                <Link2
                  size={15}
                  strokeWidth={1.8}
                  color={COLOR.accentInk}
                  aria-hidden="true"
                  style={{ flex: "none" }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      display: "block",
                      fontSize: FONT_SIZE.caption,
                      color: COLOR.ink,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    /join/{invite.token}
                  </span>
                  <span
                    style={{
                      fontSize: FONT_SIZE.micro,
                      color: expired ? COLOR.danger : COLOR.inkSoft,
                      letterSpacing: "0.06em",
                    }}
                  >
                    {expiryLabel(invite.expiresAt)}
                  </span>
                </div>
                {!expired && (
                  <button
                    type="button"
                    onClick={() => handleCopy(invite)}
                    aria-label="招待リンクをコピー"
                    title="コピー"
                    className={styles.btnOutline}
                    style={iconBtn}
                  >
                    {copiedToken === invite.token ? (
                      <Check size={14} strokeWidth={2} color={COLOR.success} aria-hidden="true" />
                    ) : (
                      <Copy size={14} strokeWidth={1.8} aria-hidden="true" />
                    )}
                  </button>
                )}
                {!expired && canShare && (
                  <button
                    type="button"
                    onClick={() => handleShare(invite)}
                    aria-label="招待リンクを共有"
                    title="共有"
                    className={styles.btnOutline}
                    style={iconBtn}
                  >
                    <Share2 size={14} strokeWidth={1.8} aria-hidden="true" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setPending({ kind: "revoke", token: invite.token })}
                  disabled={busy}
                  aria-label="招待リンクを取り消す"
                  title="取り消す"
                  className={styles.btnOutline}
                  style={iconBtn}
                >
                  <X size={14} strokeWidth={1.8} aria-hidden="true" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={handleCreate}
        disabled={!canInvite}
        className={styles.dashedAdd}
        style={{
          width: "100%",
          background: "transparent",
          border: `1.5px dashed ${COLOR.accent}`,
          borderRadius: 14,
          color: canInvite ? COLOR.accentInk : COLOR.inkDisabled,
          fontSize: FONT_SIZE.bodySm,
          letterSpacing: "0.08em",
          padding: "14px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          cursor: canInvite ? "pointer" : "default",
        }}
      >
        <span style={{ fontSize: FONT_SIZE.heading, fontWeight: 300, lineHeight: 1 }}>+</span>
        招待リンクを発行
      </button>
      {activeCount >= 5 && (
        <span style={{ fontSize: FONT_SIZE.caption, color: COLOR.danger }}>
          有効な招待リンクは5件までです。使わないリンクを取り消してください。
        </span>
      )}

      {members.length > 1 && (
        <div style={{ borderTop: `1px dashed ${COLOR.borderSoft}`, paddingTop: 14, marginTop: 6 }}>
          <button
            type="button"
            onClick={() => setPending({ kind: "leave" })}
            disabled={busy}
            className={styles.btnOutline}
            style={{
              padding: "9px 18px",
              borderRadius: 999,
              border: `1px solid ${COLOR.border}`,
              background: COLOR.surfaceRaised,
              color: COLOR.danger,
              fontSize: FONT_SIZE.label,
              letterSpacing: "0.06em",
            }}
          >
            このイベントから退出
          </button>
        </div>
      )}

      {pending && (
        <ConfirmDialog
          message={confirmMessage(pending)}
          stayLabel="キャンセル"
          leaveLabel={pending.kind === "leave" ? "退出する" : "実行する"}
          onStay={() => setPending(null)}
          onLeave={handleConfirm}
        />
      )}
    </>
  );
}

const iconBtn = {
  flex: "none",
  width: 30,
  height: 30,
  borderRadius: "50%",
  border: `1px solid ${COLOR.border}`,
  background: COLOR.surfaceRaised,
  color: COLOR.inkSoft,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
} as const;
