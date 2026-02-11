"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { AuthService } from "@/services/auth.service";
import { getUserProfile } from "@/services/user.service";
import {
  AuthContextValue,
  AuthError,
  LoginCredentials,
  SignupCredentials,
  AuthResult,
} from "@/types/auth.types";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  // Cargar datos del usuario desde Firestore (avatar + admin)
  const loadUserProfile = useCallback(async (userId: string) => {
    try {
      const profile = await getUserProfile(userId);
      setUserAvatar(profile?.avatar || null);
      setIsAdmin(profile?.isAdmin === true);
    } catch (err) {
      console.error("Error loading user profile:", err);
      setUserAvatar(null);
      setIsAdmin(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await loadUserProfile(firebaseUser.uid);
        // Set session via API for HttpOnly cookie
        firebaseUser
          .getIdToken()
          .then((token) => {
            fetch("/api/auth/session", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token }),
            }).catch(() => {});
          })
          .catch(() => {});
      } else {
        setUserAvatar(null);
        setIsAdmin(false);
        fetch("/api/auth/session", { method: "DELETE" }).catch(() => {});
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [loadUserProfile]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const login = useCallback(
    async (credentials: LoginCredentials): Promise<AuthResult> => {
      setLoading(true);
      setError(null);

      const result = await AuthService.login(credentials);

      if (!result.success && result.error) {
        setError(result.error);
      }

      setLoading(false);
      return result;
    },
    []
  );

  const signup = useCallback(
    async (credentials: SignupCredentials): Promise<AuthResult> => {
      setLoading(true);
      setError(null);

      const result = await AuthService.signup(credentials);

      if (!result.success && result.error) {
        setError(result.error);
      }

      setLoading(false);
      return result;
    },
    []
  );

  const loginWithGoogle = useCallback(async (): Promise<AuthResult> => {
    setLoading(true);
    setError(null);

    const result = await AuthService.loginWithGoogle();

    if (!result.success && result.error) {
      setError(result.error);
    }

    setLoading(false);
    return result;
  }, []);

  const logout = useCallback(async (): Promise<AuthResult<void>> => {
    setLoading(true);
    setError(null);

    const result = await AuthService.logout();

    if (!result.success && result.error) {
      setError(result.error);
    }

    setLoading(false);
    return result;
  }, []);

  const resetPassword = useCallback(
    async (email: string): Promise<AuthResult<void>> => {
      setError(null);

      const result = await AuthService.resetPassword(email);

      if (!result.success && result.error) {
        setError(result.error);
      }

      return result;
    },
    []
  );

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string): Promise<AuthResult<void>> => {
      setError(null);

      const result = await AuthService.changePassword(currentPassword, newPassword);

      if (!result.success && result.error) {
        setError(result.error);
      }

      return result;
    },
    []
  );

  const sendEmailVerification = useCallback(async (): Promise<AuthResult<void>> => {
    setError(null);

    const result = await AuthService.sendVerificationEmail();

    if (!result.success && result.error) {
      setError(result.error);
    }

    return result;
  }, []);

  const deleteAccount = useCallback(
    async (currentPassword?: string): Promise<AuthResult<void>> => {
      setError(null);

      const result = await AuthService.deleteAccount(currentPassword);

      if (!result.success && result.error) {
        setError(result.error);
      }

      return result;
    },
    []
  );

  const refreshUser = useCallback(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      currentUser.reload().then(() => {
        const reloadedUser = auth.currentUser;
        if (reloadedUser) {
          setUser({ ...reloadedUser } as User);
          loadUserProfile(reloadedUser.uid);
        }
      });
    }
  }, [loadUserProfile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      userAvatar,
      isAdmin,
      loading,
      error,
      login,
      signup,
      loginWithGoogle,
      logout,
      resetPassword,
      changePassword,
      sendEmailVerification,
      deleteAccount,
      clearError,
      refreshUser,
    }),
    [user, userAvatar, isAdmin, loading, error, login, signup, loginWithGoogle, logout, resetPassword, changePassword, sendEmailVerification, deleteAccount, clearError, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}

export default AuthContext;
