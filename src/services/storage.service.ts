import {
  ref,
  uploadString,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { storage } from "@/lib/firebase";

/**
 * Upload a Base64 image to Firebase Storage and return the download URL.
 * @param path - Storage path (e.g., "avatars/userId" or "auctions/auctionId/0")
 * @param base64Data - The Base64 data URL string (data:image/...;base64,...)
 * @returns The public download URL
 */
export async function uploadImage(
  path: string,
  base64Data: string
): Promise<string> {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadString(storageRef, base64Data, "data_url");
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error("[StorageService] Error uploading image:", error);
    throw error;
  }
}

/**
 * Upload an avatar image with compression.
 * @returns The download URL from Firebase Storage
 */
export async function uploadAvatarImage(
  userId: string,
  base64Data: string
): Promise<string> {
  return uploadImage(`avatars/${userId}`, base64Data);
}

/**
 * Upload auction images.
 * @returns Array of download URLs
 */
export async function uploadAuctionImages(
  auctionId: string,
  base64Images: string[]
): Promise<string[]> {
  const urls: string[] = [];

  for (let i = 0; i < base64Images.length; i++) {
    const image = base64Images[i];
    // If already a URL (not Base64), keep it
    if (image.startsWith("http")) {
      urls.push(image);
      continue;
    }
    const url = await uploadImage(`auctions/${auctionId}/${i}`, image);
    urls.push(url);
  }

  return urls;
}

/**
 * Delete an image from Firebase Storage.
 */
export async function deleteImage(path: string): Promise<void> {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error) {
    // Ignore not-found errors
    console.error("[StorageService] Error deleting image:", error);
  }
}
