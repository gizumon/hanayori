import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "./firebase-admin";
import { collectionPrefix } from "./env";

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
