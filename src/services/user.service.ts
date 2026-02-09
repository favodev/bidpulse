import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import { UserProfile, UserSettings } from "@/types/user.types";
import { sanitizeText, sanitizeMultiline } from "@/lib/sanitize";
import { validateProfileUpdate } from "@/lib/validation";
import { uploadAvatarImage } from "./storage.service";

const USERS_COLLECTION = "users";

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const docRef = doc(db, USERS_COLLECTION, userId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as UserProfile;
  } catch (error) {
    console.error("[UserService] Error getting profile:", error);
    throw error;
  }
}

export async function createUserProfile(
  userId: string,
  email: string,
  displayName?: string
): Promise<void> {
  try {
    const docRef = doc(db, USERS_COLLECTION, userId);
    
    const profile = {
      email,
      displayName: displayName || email.split("@")[0],
      bio: "",
      avatar: "",
      isVerified: false,
      isSeller: false,
      isAdmin: false,
      stats: {
        auctionsCreated: 0,
        auctionsWon: 0,
        totalBids: 0,
        totalSpent: 0,
        totalEarned: 0,
        rating: 0,
        reviewsCount: 0,
      },
      settings: {
        emailNotifications: true,
        pushNotifications: true,
        outbidAlerts: true,
        endingSoonAlerts: true,
        currency: "CLP",
        language: "es",
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    };

    await setDoc(docRef, profile);
  } catch (error) {
    console.error("[UserService] Error creating profile:", error);
    throw error;
  }
}

export async function updateUserProfile(
  userId: string,
  data: Partial<Pick<UserProfile, "displayName" | "bio" | "avatar">>
): Promise<void> {
  try {
    // Validación server-side
    const validation = validateProfileUpdate(data as Record<string, unknown>);
    if (!validation.valid) {
      throw new Error(validation.errors[0]);
    }

    // Sanitización
    const sanitizedData: Partial<Pick<UserProfile, "displayName" | "bio" | "avatar">> = {};
    if (data.displayName !== undefined) {
      sanitizedData.displayName = sanitizeText(data.displayName).slice(0, 100);
    }
    if (data.bio !== undefined) {
      sanitizedData.bio = sanitizeMultiline(data.bio).slice(0, 500);
    }
    if (data.avatar !== undefined) {
      sanitizedData.avatar = data.avatar; // Avatar es Base64, no necesita sanitización de texto
    }

    const docRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(docRef, {
      ...sanitizedData,
      updatedAt: serverTimestamp(),
    });

    // Actualizar también en Firebase Auth
    if (auth.currentUser) {
      const updateData: { displayName?: string; photoURL?: string } = {};
      let shouldUpdate = false;

      if (data.displayName && data.displayName !== auth.currentUser.displayName) {
        updateData.displayName = data.displayName;
        shouldUpdate = true;
      }

      if (data.avatar !== undefined && data.avatar !== auth.currentUser.photoURL) {
        updateData.photoURL = data.avatar || "";
        shouldUpdate = true;
      }

      if (shouldUpdate) {
        await updateProfile(auth.currentUser, updateData);
      }
    }
  } catch (error) {
    console.error("[UserService] Error updating profile:", error);
    throw error;
  }
}

/**
 * Convierte un archivo a Base64
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Comprime una imagen para reducir su tamaño
 * Firestore tiene un límite de ~1MB por documento
 */
async function compressImage(file: File, maxWidth: number = 300): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ratio = maxWidth / img.width;
      canvas.width = maxWidth;
      canvas.height = img.height * ratio;
      
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("No se pudo crear el contexto del canvas"));
        return;
      }
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL("image/jpeg", 0.7); // 70% calidad
      resolve(base64);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  try {
    // Compress image to 300px width and convert to Base64
    const base64Image = await compressImage(file, 300);
    
    // Upload to Firebase Storage instead of storing Base64 in Firestore
    const downloadURL = await uploadAvatarImage(userId, base64Image);

    // Save the URL in Firestore profile
    await updateUserProfile(userId, { avatar: downloadURL });

    // Update Firebase Auth photoURL
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { photoURL: downloadURL });
    }

    return downloadURL;
  } catch (error) {
    console.error("[UserService] Error uploading avatar:", error);
    throw error;
  }
}

export async function updateUserSettings(
  userId: string,
  settings: Partial<UserSettings>
): Promise<void> {
  try {
    const docRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(docRef, {
      settings,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("[UserService] Error updating settings:", error);
    throw error;
  }
}

/**
 * Increments a specific user stat field atomically.
 */
export async function incrementUserStat(
  userId: string,
  stat: keyof import("@/types/user.types").UserStats,
  amount: number
): Promise<void> {
  try {
    const { increment } = await import("firebase/firestore");
    const docRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(docRef, {
      [`stats.${stat}`]: increment(amount),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error(`[UserService] Error incrementing stat ${stat}:`, error);
  }
}

export async function deleteUserProfile(userId: string): Promise<void> {
  try {
    const docRef = doc(db, USERS_COLLECTION, userId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("[UserService] Error deleting profile:", error);
    throw error;
  }
}
