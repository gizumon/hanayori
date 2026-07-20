import { cache } from "react";
import { ulid } from "ulid";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { eventsCollection, lettersCollection } from "./collections";
import { requireEventMembership } from "./events";
import { HttpError } from "./http-error";
import type { FontKey, Honor, LetterDoc, LetterPhoto, ThemeKey } from "./schema";

export interface LetterJson {
  id: string;
  to: string;
  body: string;
  theme: ThemeKey;
  photo: string | null;
  photoRatio?: number;
  cardName: string | null;
  honor: Honor | null;
  createdAt: string;
  updatedAt: string;
}

function toIso(ts: Timestamp | undefined): string {
  return (ts ?? Timestamp.now()).toDate().toISOString();
}

function photosFromInput(
  photo: string | null | undefined,
  photoRatio: number | undefined
): LetterPhoto[] {
  if (!photo) return [];
  return [{ id: "primary", dataUrl: photo, ratio: photoRatio ?? null }];
}

function serializeLetter(id: string, data: LetterDoc): LetterJson {
  const primary = data.photos[0];
  return {
    id,
    to: data.to,
    body: data.body,
    theme: data.theme,
    photo: primary?.dataUrl ?? null,
    photoRatio: primary?.ratio ?? undefined,
    cardName: data.cardName,
    honor: data.honor,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
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

export interface CreateLetterInput {
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
    createdAt: now,
    updatedAt: now,
  };
  await lettersCollection().doc(id).set(doc as unknown as LetterDoc);
  const snap = await lettersCollection().doc(id).get();
  return serializeLetter(snap.id, snap.data()!);
}

export interface UpdateLetterInput {
  to?: string;
  body?: string;
  theme?: ThemeKey;
  photo?: string | null;
  photoRatio?: number;
  cardName?: string | null;
  honor?: Honor | null;
}

export async function updateLetter(
  uid: string,
  letterId: string,
  patch: UpdateLetterInput
): Promise<LetterJson> {
  const { ref } = await requireLetterMembership(uid, letterId);

  const update: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
  if (patch.to !== undefined) update.to = patch.to;
  if (patch.body !== undefined) update.body = patch.body;
  if (patch.theme !== undefined) update.theme = patch.theme;
  if (patch.cardName !== undefined) update.cardName = patch.cardName;
  if (patch.honor !== undefined) update.honor = patch.honor;
  if (patch.photo !== undefined) {
    update.photos = photosFromInput(patch.photo, patch.photoRatio);
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
    return {
      to: letterData.to,
      body: letterData.body,
      theme: letterData.theme,
      photo: primary?.dataUrl ?? null,
      photoRatio: primary?.ratio ?? undefined,
      date: eventData.date,
      font: eventData.font,
    };
  }
);
