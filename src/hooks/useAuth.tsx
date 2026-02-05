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
const SESSION_COOKIE_NAME = "bp_session";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  const setSessionCookie = useCallback((token?: string) => {
    if (typeof document === "undefined") return;
    const maxAge = token ? 60 * 60 : 0;
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    const value = token ? encodeURIComponent(token) : "";
    document.cookie = `${SESSION_COOKIE_NAME}=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
  }, []);

  // Cargar avatar del usuario desde Firestore
  const loadUserAvatar = useCallback(async (userId: string) => {
    try {
      const profile = await getUserProfile(userId);
      setUserAvatar(profile?.avatar || null);
    } catch (err) {
      console.error("Error loading user avatar:", err);
      setUserAvatar(null);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        loadUserAvatar(firebaseUser.uid);
        firebaseUser
          .getIdToken()
          .then((token) => setSessionCookie(token))
          .catch(() => setSessionCookie());
      } else {
        setUserAvatar(null);
        setSessionCookie();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [loadUserAvatar, setSessionCookie]);

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
    if (auth.currentUser) {
      auth.currentUser.reload().then(() => {
        setUser({ ...auth.currentUser } as User);
        loadUserAvatar(auth.currentUser!.uid);
      });
    }
  }, [loadUserAvatar]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      userAvatar,
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
    [user, userAvatar, loading, error, login, signup, loginWithGoogle, logout, resetPassword, changePassword, sendEmailVerification, deleteAccount, clearError, refreshUser]
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
