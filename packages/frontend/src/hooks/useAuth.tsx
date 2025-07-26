import {
  useState,
  useEffect,
  createContext,
  useContext,
  useCallback,
} from "react";
import {
  User,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  reload,
} from "firebase/auth";
import { auth } from "../lib/firebase";

interface UserData {
  firstName?: string;
  lastName?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    userData?: UserData
  ) => Promise<void>;
  logout: () => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  createUserInBackend: (userData?: UserData) => Promise<boolean>;
  checkEmailVerification: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

import apiHelper from "../lib/apiHelper";

async function createUserInDatabase(user: User, userData?: UserData) {
  try {
    // Force token refresh to ensure we have the latest email_verified status
    await user.getIdToken(true);

    const firstName =
      userData?.firstName || user.displayName?.split(" ")[0] || "";
    const lastName =
      userData?.lastName ||
      user.displayName?.split(" ").slice(1).join(" ") ||
      "";

    const response = await apiHelper({
      slug: "users",
      method: "POST",
      data: {
        firstName,
        lastName,
      },
    });

    return response;
  } catch (error) {
    throw error;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userCreatedInBackend, setUserCreatedInBackend] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      setUser(user);
      setLoading(false);
      // Reset backend creation state when user changes
      setUserCreatedInBackend(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (
    email: string,
    password: string,
    userData?: UserData
  ) => {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Send email verification
    await sendEmailVerification(user);

    // Store user data temporarily for later use
    if (userData) {
      localStorage.setItem("pendingUserData", JSON.stringify(userData));
    }
  };

  const logout = async () => {
    await signOut(auth);
    localStorage.removeItem("pendingUserData");
  };

  const resendVerificationEmail = async () => {
    if (user && !user.emailVerified) {
      await sendEmailVerification(user);
    }
  };

  const checkEmailVerification = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    // Reload user to get latest email verification status
    await reload(user);

    return user.emailVerified;
  }, [user]);

  const createUserInBackend = useCallback(
    async (userData?: UserData): Promise<boolean> => {
      if (!user) return false;

      // Skip if user is already created in backend
      if (userCreatedInBackend) {
        return true;
      }

      try {
        // Check if email is verified
        const isVerified = await checkEmailVerification();
        if (!isVerified) {
          return false;
        }

        // Get stored user data if not provided
        const finalUserData =
          userData ||
          JSON.parse(localStorage.getItem("pendingUserData") || "{}");

        await createUserInDatabase(user, finalUserData);

        // Clear stored data
        localStorage.removeItem("pendingUserData");

        // Mark as created
        setUserCreatedInBackend(true);

        return true;
      } catch (error: any) {
        // Handle specific case where user already exists with same email but different UID
        if (
          error.message &&
          error.message.includes("already exists with a different account ID")
        ) {
          localStorage.removeItem("pendingUserData");
        }

        // If user already exists, mark as created
        if (error.message && error.message.includes("already exists")) {
          setUserCreatedInBackend(true);
          return true;
        }

        throw error;
      }
    },
    [user, checkEmailVerification, userCreatedInBackend]
  );

  const value = {
    user,
    loading,
    signIn,
    signUp,
    logout,
    resendVerificationEmail,
    createUserInBackend,
    checkEmailVerification,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
