import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "./firebase-admin";
import { collectionPrefix } from "./env";

export interface UserProfile {
  displayName: string | null;
  email: string | null;
  photoUrl: string | null;
}

/**
 * uid → プロフィールの一括解決。メンバー一覧の表示名に使う。
 * `getAll` なので何人いても 1 往復で済む。ログインのたびに upsertUserProfile が
 * 走る前提だが、プロフィール未作成の uid は単に欠落するので呼び出し側で埋める。
 */
export async function getUserProfiles(
  uids: string[]
): Promise<Map<string, UserProfile>> {
  const result = new Map<string, UserProfile>();
  if (uids.length === 0) return result;

  const col = getAdminFirestore().collection(`${collectionPrefix()}users`);
  const snaps = await getAdminFirestore().getAll(...uids.map((uid) => col.doc(uid)));
  for (const snap of snaps) {
    const data = snap.data();
    if (!data) continue;
    result.set(snap.id, {
      displayName: (data.displayName as string | null) ?? null,
      email: (data.email as string | null) ?? null,
      photoUrl: (data.photoUrl as string | null) ?? null,
    });
  }
  return result;
}

export async function upsertUserProfile(
  uid: string,
  info: { displayName: string | null; email: string | null; photoUrl: string | null }
) {
  const ref = getAdminFirestore()
    .collection(`${collectionPrefix()}users`)
    .doc(uid);
  const snap = await ref.get();
  if (snap.exists) {
    await ref.update({
      displayName: info.displayName,
      email: info.email,
      photoUrl: info.photoUrl,
      updatedAt: FieldValue.serverTimestamp(),
    });
  } else {
    await ref.set({
      displayName: info.displayName,
      email: info.email,
      photoUrl: info.photoUrl,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
}
