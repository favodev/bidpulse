import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
  AuthError as FirebaseAuthError,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { createUserProfile, getUserProfile, deleteUserProfile } from "@/services/user.service";
import {
  AuthResult,
  AuthError,
  AuthErrorCode,
  LoginCredentials,
  SignupCredentials,
} from "@/types/auth.types";

const ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  "auth/email-already-in-use": "Este correo electrónico ya está registrado.",
  "auth/invalid-email": "El correo electrónico no es válido.",
  "auth/operation-not-allowed": "Operación no permitida. Contacta al soporte.",
  "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
  "auth/user-disabled": "Esta cuenta ha sido deshabilitada.",
  "auth/user-not-found": "No existe una cuenta con este correo electrónico.",
  "auth/wrong-password": "La contraseña es incorrecta.",
  "auth/invalid-credential": "Credenciales inválidas. Verifica tu email y contraseña.",
  "auth/too-many-requests": "Demasiados intentos fallidos. Intenta más tarde.",
  "auth/network-request-failed": "Error de conexión. Verifica tu internet.",
  "auth/popup-closed-by-user": "Se cerró la ventana de autenticación.",
  "auth/account-exists-with-different-credential":
    "Ya existe una cuenta con este email usando otro método de autenticación.",
  "auth/requires-recent-login": "Por seguridad, vuelve a iniciar sesión e intenta nuevamente.",
  unknown: "Ocurrió un error inesperado. Intenta nuevamente.",
};

function handleAuthError(error: unknown): AuthError {
  const firebaseError = error as FirebaseAuthError;
  const code = (firebaseError.code as AuthErrorCode) || "unknown";
  const message = ERROR_MESSAGES[code] || ERROR_MESSAGES.unknown;

  console.error("[AuthService Error]:", {
    code: firebaseError.code,
    message: firebaseError.message,
  });

  return { code, message };
}

export const AuthService = {
  async login({ email, password }: LoginCredentials): Promise<AuthResult> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      return {
        success: true,
        data: userCredential.user,
      };
    } catch (error) {
      return {
        success: false,
        error: handleAuthError(error),
      };
    }
  },

  async signup({
    email,
    password,
    displayName,
  }: SignupCredentials): Promise<AuthResult> {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      await updateProfile(userCredential.user, { displayName });
      await sendEmailVerification(userCredential.user);

      return {
        success: true,
        data: userCredential.user,
      };
    } catch (error) {
      return {
        success: false,
        error: handleAuthError(error),
      };
    }
  },

  async loginWithGoogle(): Promise<AuthResult> {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: "select_account",
      });

      const userCredential = await signInWithPopup(auth, provider);

      // Create Firestore profile if it doesn't exist yet (first Google sign-in)
      const existingProfile = await getUserProfile(userCredential.user.uid);
      if (!existingProfile) {
        await createUserProfile(
          userCredential.user.uid,
          userCredential.user.email || "",
          userCredential.user.displayName || undefined
        );
      }

      return {
        success: true,
        data: userCredential.user,
      };
    } catch (error) {
      return {
        success: false,
        error: handleAuthError(error),
      };
    }
  },

  async logout(): Promise<AuthResult<void>> {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: handleAuthError(error),
      };
    }
  },

  async resetPassword(email: string): Promise<AuthResult<void>> {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: handleAuthError(error),
      };
    }
  },

  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<AuthResult<void>> {
    try {
      if (!auth.currentUser || !auth.currentUser.email) {
        return {
          success: false,
          error: { code: "unknown", message: "Usuario no autenticado" },
        };
      }

      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: handleAuthError(error),
      };
    }
  },

  async sendVerificationEmail(): Promise<AuthResult<void>> {
    try {
      if (!auth.currentUser) {
        return {
          success: false,
          error: { code: "unknown", message: "Usuario no autenticado" },
        };
      }

      await sendEmailVerification(auth.currentUser);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: handleAuthError(error),
      };
    }
  },

  async deleteAccount(currentPassword?: string): Promise<AuthResult<void>> {
    try {
      if (!auth.currentUser) {
        return {
          success: false,
          error: { code: "unknown", message: "Usuario no autenticado" },
        };
      }

      const isPasswordProvider = auth.currentUser.providerData.some(
        (provider) => provider.providerId === "password"
      );

      if (isPasswordProvider && auth.currentUser.email) {
        if (!currentPassword) {
          return {
            success: false,
            error: {
              code: "auth/requires-recent-login",
              message: ERROR_MESSAGES["auth/requires-recent-login"],
            },
          };
        }

        const credential = EmailAuthProvider.credential(
          auth.currentUser.email,
          currentPassword
        );
        await reauthenticateWithCredential(auth.currentUser, credential);
      }

      // Delete Firestore profile BEFORE deleting auth user (while still authenticated)
      const userId = auth.currentUser.uid;
      try {
        await deleteUserProfile(userId);
      } catch (profileErr) {
        console.error("[AuthService] Error deleting user profile:", profileErr);
      }

      await deleteUser(auth.currentUser);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: handleAuthError(error),
      };
    }
  },
};

export default AuthService;
