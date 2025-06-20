import { useState, useEffect, createContext, useContext } from "react";
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

async function createUserInDatabase(user: User, userData?: UserData) {
  try {
    const token = await user.getIdToken();

    const response = await fetch("/api/v1/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        firstName: userData?.firstName || user.displayName?.split(" ")[0] || "",
        lastName:
          userData?.lastName ||
          user.displayName?.split(" ").slice(1).join(" ") ||
          "",
      }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(
        responseData.error ||
          `HTTP ${response.status}: Failed to create user in database`
      );
    }

    return responseData;
  } catch (error) {
    console.error("Error creating user in database:", error);
    throw error;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      setUser(user);
      setLoading(false);
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

  const checkEmailVerification = async (): Promise<boolean> => {
    if (!user) return false;

    // Reload user to get latest email verification status
    await reload(user);
    return user.emailVerified;
  };

  const createUserInBackend = async (userData?: UserData): Promise<boolean> => {
    if (!user) return false;

    try {
      // Check if email is verified
      const isVerified = await checkEmailVerification();
      if (!isVerified) {
        return false;
      }

      // Get stored user data if not provided
      const finalUserData =
        userData || JSON.parse(localStorage.getItem("pendingUserData") || "{}");

      await createUserInDatabase(user, finalUserData);

      // Clear stored data
      localStorage.removeItem("pendingUserData");

      return true;
    } catch (error) {
      console.error("Error creating user in backend:", error);
      return false;
    }
  };

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
