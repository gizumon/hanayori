import { cache } from "react";
import { ulid } from "ulid";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { eventsCollection, lettersCollection } from "./collections";
import { normalizeEventDoc, requireEventMembership } from "./events";
import { HttpError } from "./http-error";
import type {
  EscortFieldsDoc,
  FontKey,
  Honor,
  LetterDoc,
  LetterPhoto,
  ThemeKey,
} from "./schema";

export interface LetterJson {
  id: string;
  to: string;
  body: string;
  theme: ThemeKey;
  photo: string | null;
  photoRatio?: number;
  cardName: string | null;
  honor: Honor | null;
  tableNo: string | null;
  escortName: string | null;
  escortMessage: string | null;
  escortHonor: Honor | null;
  escortPhoto: string | null;
  escortPhotoRatio?: number;
  createdAt: string;
  updatedAt: string;
}

function toIso(ts: Timestamp | undefined): string {
  return (ts ?? Timestamp.now()).toDate().toISOString();
}

function photoFromInput(
  photo: string | null | undefined,
  photoRatio: number | undefined,
  id: string
): LetterPhoto | null {
  if (!photo) return null;
  return { id, dataUrl: photo, ratio: photoRatio ?? null };
}

function photosFromInput(
  photo: string | null | undefined,
  photoRatio: number | undefined
): LetterPhoto[] {
  const p = photoFromInput(photo, photoRatio, "primary");
  return p ? [p] : [];
}

function escortFromInput(input: EscortInput): EscortFieldsDoc {
  return {
    tableNo: input.tableNo ?? null,
    name: input.escortName ?? null,
    message: input.escortMessage ?? null,
    honor: input.escortHonor ?? null,
    photo: photoFromInput(input.escortPhoto, input.escortPhotoRatio, "escort"),
  };
}

function serializeLetter(id: string, data: LetterDoc): LetterJson {
  const primary = data.photos[0];
  const escort = data.escort;
  return {
    id,
    to: data.to,
    body: data.body,
    theme: data.theme,
    photo: primary?.dataUrl ?? null,
    photoRatio: primary?.ratio ?? undefined,
    cardName: data.cardName,
    honor: data.honor,
    tableNo: escort?.tableNo ?? null,
    escortName: escort?.name ?? null,
    escortMessage: escort?.message ?? null,
    escortHonor: escort?.honor ?? null,
    escortPhoto: escort?.photo?.dataUrl ?? null,
    escortPhotoRatio: escort?.photo?.ratio ?? undefined,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
}

/** create/update 双方で使うエスコート系の入力。 */
interface EscortInput {
  tableNo?: string | null;
  escortName?: string | null;
  escortMessage?: string | null;
  escortHonor?: Honor | null;
  escortPhoto?: string | null;
  escortPhotoRatio?: number;
}

async function requireLetterMembership(uid: string, letterId: string) {
  const snap = await lettersCollection().doc(letterId).get();
  const data = snap.data();
  if (!snap.exists || !data) throw new HttpError(404, "お手紙が見つかりません");
  await requireEventMembership(uid, data.eventId);
  return { ref: snap.ref, data };
}

export async function listLettersForEvent(
  uid: string,
  eventId: string
): Promise<LetterJson[]> {
  await requireEventMembership(uid, eventId);
  const snap = await lettersCollection()
    .where("eventId", "==", eventId)
    .orderBy("createdAt", "asc")
    .get();
  return snap.docs.map((doc) => serializeLetter(doc.id, doc.data()));
}

export interface CreateLetterInput extends EscortInput {
  to: string;
  body: string;
  theme: ThemeKey;
  photo?: string | null;
  photoRatio?: number;
  cardName?: string | null;
  honor?: Honor | null;
}

export async function createLetter(
  uid: string,
  eventId: string,
  input: CreateLetterInput
): Promise<LetterJson> {
  if (!input.to.trim()) throw new HttpError(400, "宛名を入力してください");
  await requireEventMembership(uid, eventId);

  const id = ulid();
  const now = FieldValue.serverTimestamp();
  const doc: Omit<LetterDoc, "createdAt" | "updatedAt"> & {
    createdAt: FieldValue;
    updatedAt: FieldValue;
  } = {
    eventId,
    to: input.to,
    body: input.body,
    theme: input.theme,
    photos: photosFromInput(input.photo, input.photoRatio),
    cardName: input.cardName ?? null,
    honor: input.honor ?? null,
    escort: escortFromInput(input),
    createdAt: now,
    updatedAt: now,
  };
  await lettersCollection().doc(id).set(doc as unknown as LetterDoc);
  const snap = await lettersCollection().doc(id).get();
  return serializeLetter(snap.id, snap.data()!);
}

export interface UpdateLetterInput extends EscortInput {
  to?: string;
  body?: string;
  theme?: ThemeKey;
  photo?: string | null;
  photoRatio?: number;
  cardName?: string | null;
  honor?: Honor | null;
}

/** patch にエスコート系フィールドが 1 つでも含まれるか。 */
function hasEscortPatch(patch: UpdateLetterInput): boolean {
  return (
    patch.tableNo !== undefined ||
    patch.escortName !== undefined ||
    patch.escortMessage !== undefined ||
    patch.escortHonor !== undefined ||
    patch.escortPhoto !== undefined ||
    patch.escortPhotoRatio !== undefined
  );
}

export async function updateLetter(
  uid: string,
  letterId: string,
  patch: UpdateLetterInput
): Promise<LetterJson> {
  const { ref, data } = await requireLetterMembership(uid, letterId);

  const update: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
  if (patch.to !== undefined) update.to = patch.to;
  if (patch.body !== undefined) update.body = patch.body;
  if (patch.theme !== undefined) update.theme = patch.theme;
  if (patch.cardName !== undefined) update.cardName = patch.cardName;
  if (patch.honor !== undefined) update.honor = patch.honor;
  if (patch.photo !== undefined) {
    update.photos = photosFromInput(patch.photo, patch.photoRatio);
  }
  // エスコート系は既存値をベースにパッチをマージして書き戻す。
  if (hasEscortPatch(patch)) {
    const cur = data.escort;
    const curPhoto = { photo: cur?.photo?.dataUrl ?? null, ratio: cur?.photo?.ratio ?? undefined };
    update.escort = escortFromInput({
      tableNo: patch.tableNo !== undefined ? patch.tableNo : cur?.tableNo ?? null,
      escortName: patch.escortName !== undefined ? patch.escortName : cur?.name ?? null,
      escortMessage:
        patch.escortMessage !== undefined ? patch.escortMessage : cur?.message ?? null,
      escortHonor: patch.escortHonor !== undefined ? patch.escortHonor : cur?.honor ?? null,
      escortPhoto: patch.escortPhoto !== undefined ? patch.escortPhoto : curPhoto.photo,
      escortPhotoRatio:
        patch.escortPhoto !== undefined ? patch.escortPhotoRatio : curPhoto.ratio,
    });
  }

  await ref.update(update);
  const snap = await ref.get();
  return serializeLetter(snap.id, snap.data()!);
}

export async function deleteLetter(uid: string, letterId: string): Promise<void> {
  const { ref } = await requireLetterMembership(uid, letterId);
  await ref.delete();
}

export interface GuestLetterView {
  to: string;
  body: string;
  theme: ThemeKey;
  photo: string | null;
  photoRatio?: number;
  /** イベント側の値を都度解決する(手紙には複製しない)。 */
  date: string | null;
  font: FontKey;
  /** 席札用の宛名(OGP 等で使用)。未設定なら null。 */
  cardName: string | null;
  /** この手紙の敬称。null = イベント既定に従う。 */
  honor: Honor | null;
  /** イベント既定の敬称。 */
  eventHonor: Honor;
}

/**
 * ULID を知っていれば誰でも読める、ログイン不要のゲスト向け取得。
 * メンバーシップは確認しない。
 */
export const getLetterForGuest = cache(
  async (letterId: string): Promise<GuestLetterView | null> => {
    const letterSnap = await lettersCollection().doc(letterId).get();
    const letterData = letterSnap.data();
    if (!letterSnap.exists || !letterData) return null;

    const eventSnap = await eventsCollection().doc(letterData.eventId).get();
    const eventData = eventSnap.data();
    if (!eventSnap.exists || !eventData) return null;

    const primary = letterData.photos[0];
    const normalized = normalizeEventDoc(eventData);
    return {
      to: letterData.to,
      body: letterData.body,
      theme: letterData.theme,
      photo: primary?.dataUrl ?? null,
      photoRatio: primary?.ratio ?? undefined,
      date: eventData.date,
      font: normalized.letterConfig.font,
      cardName: letterData.cardName,
      honor: letterData.honor,
      eventHonor: normalized.cardConfig.honor,
    };
  }
);
