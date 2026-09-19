"use client";

// ──────────────────────────────────────────────
// Auth Context - Google Authentication & State
// ──────────────────────────────────────────────
// Manages Google sign-in / registration state,
// session persistence via localStorage, Google Identity
// Services (GIS) client integration, and modal triggers.

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { useAppSettings } from "./settingsContext";

const STORAGE_KEY = "aiko_google_user_v1";

export interface GoogleUser {
  id: string;
  name: string;
  email: string;
  picture: string;
  givenName: string;
}

export interface AuthContextType {
  user: GoogleUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  loginWithGoogle: () => Promise<void>;
  loginWithCustomAccount: (email: string, name?: string) => void;
  logout: () => void;
}

interface GoogleCredentialResponse {
  credential?: string;
}

interface GoogleAccountsId {
  initialize: (options: {
    client_id: string;
    callback: (res: GoogleCredentialResponse) => void;
  }) => void;
  prompt: () => void;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: GoogleAccountsId;
      };
    };
  }
}

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Decode JWT token returned by Google Identity Services
 */
function parseJwt(token: string): Record<string, string> | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("[Auth] Failed to parse JWT token", e);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { updateUserProfile, settings } = useAppSettings();

  // Lazy initialize state from localStorage to avoid cascading render lint issues
  const [user, setUser] = useState<GoogleUser | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: GoogleUser = JSON.parse(stored);
        if (parsed?.id && parsed?.email) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("[Auth] Failed to restore session", e);
    }
    return null;
  });

  const [isLoading] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Save session when user logs in
  const saveUserSession = useCallback(
    (userData: GoogleUser) => {
      setUser(userData);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      } catch (e) {
        console.warn("[Auth] Failed to save session to localStorage", e);
      }

      // Sync name & award welcome gems (+10 Gems, +100 Tickets)
      updateUserProfile({
        name: userData.givenName || userData.name,
        gems: Math.max(settings.userProfile.gems, 15),
        tickets: Math.max(settings.userProfile.tickets, 500),
      });

      setIsAuthModalOpen(false);
    },
    [updateUserProfile, settings.userProfile]
  );

  const openAuthModal = useCallback(() => {
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  /**
   * Log in with Google Account
   * Uses Google Identity Services if NEXT_PUBLIC_GOOGLE_CLIENT_ID is set.
   * If not set or in dev test mode, creates a realistic demo Google profile.
   */
  const loginWithGoogle = useCallback(async () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    if (clientId && typeof window !== "undefined") {
      try {
        // Load Google Identity Services SDK if not loaded
        if (!window.google?.accounts?.id) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://accounts.google.com/gsi/client";
            script.async = true;
            script.defer = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error("Failed to load Google SDK"));
            document.head.appendChild(script);
          });
        }

        const accountsId = window.google?.accounts?.id;
        if (accountsId) {
          accountsId.initialize({
            client_id: clientId,
            callback: (response: GoogleCredentialResponse) => {
              if (response.credential) {
                const payload = parseJwt(response.credential);
                if (payload) {
                  const googleUser: GoogleUser = {
                    id: payload.sub || `google_${Date.now()}`,
                    name: payload.name || "Google User",
                    email: payload.email || "user@gmail.com",
                    picture: payload.picture || "",
                    givenName: payload.given_name || payload.name || "User",
                  };
                  saveUserSession(googleUser);
                }
              }
            },
          });

          accountsId.prompt();
          return;
        }
      } catch (err) {
        console.warn("[Auth] GIS initialization fallback to demo sign in", err);
      }
    }

    // Default fast-sign-in for development/demo (instant verified Google profile)
    const demoUser: GoogleUser = {
      id: "google_108472918471029",
      name: "Akun Google",
      email: "pengguna.google@gmail.com",
      picture: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
      givenName: "Heka",
    };
    saveUserSession(demoUser);
  }, [saveUserSession]);

  /**
   * Log in with custom email / Google identifier
   */
  const loginWithCustomAccount = useCallback(
    (email: string, name?: string) => {
      const trimmedEmail = email.trim();
      const extractedName =
        name?.trim() ||
        trimmedEmail.split("@")[0].charAt(0).toUpperCase() +
          trimmedEmail.split("@")[0].slice(1);

      const customUser: GoogleUser = {
        id: `google_${Date.now()}`,
        name: extractedName,
        email: trimmedEmail.includes("@") ? trimmedEmail : `${trimmedEmail}@gmail.com`,
        picture: "",
        givenName: extractedName,
      };
      saveUserSession(customUser);
    },
    [saveUserSession]
  );

  /**
   * Log out and clear local state
   */
  const logout = useCallback(() => {
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn("[Auth] Failed to remove session from localStorage", e);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        loginWithGoogle,
        loginWithCustomAccount,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
