import { User } from "firebase/auth";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
  displayName: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: AuthError | null;
}

export type AuthErrorCode =
  | "auth/email-already-in-use"
  | "auth/invalid-email"
  | "auth/operation-not-allowed"
  | "auth/weak-password"
  | "auth/user-disabled"
  | "auth/user-not-found"
  | "auth/wrong-password"
  | "auth/invalid-credential"
  | "auth/too-many-requests"
  | "auth/network-request-failed"
  | "auth/popup-closed-by-user"
  | "auth/account-exists-with-different-credential"
  | "auth/requires-recent-login"
  | "unknown";

export interface AuthError {
  code: AuthErrorCode;
  message: string;
}

export interface AuthResult<T = User> {
  success: boolean;
  data?: T;
  error?: AuthError;
}

export interface AuthContextValue {
  user: User | null;
  userAvatar: string | null;
  isAdmin: boolean;
  loading: boolean;
  error: AuthError | null;
  login: (credentials: LoginCredentials) => Promise<AuthResult>;
  signup: (credentials: SignupCredentials) => Promise<AuthResult>;
  loginWithGoogle: () => Promise<AuthResult>;
  logout: () => Promise<AuthResult<void>>;
  resetPassword: (email: string) => Promise<AuthResult<void>>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<AuthResult<void>>;
  sendEmailVerification: () => Promise<AuthResult<void>>;
  deleteAccount: (currentPassword?: string) => Promise<AuthResult<void>>;
  clearError: () => void;
  refreshUser: () => void;
}
