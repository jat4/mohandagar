import React, { createContext, useContext, useState, useEffect } from "react";
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db, googleProvider, isLocalDemo, setLocalDemo } from "../firebase";
import { getUserProfile, createUserProfile, checkUsernameExists } from "../services/dbService";
import { UserProfile } from "../types";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  usernameNeeded: boolean; // True if Google user logged in but has no profile/username yet
  googleUserTemp: User | null; // Stores Google user temporarily during username creation
  isLocalDemoMode: boolean;
  signUp: (email: string, password: string, username: string, fullName: string, gender?: "male" | "female" | "other") => Promise<void>;
  logIn: (email: string, password: string) => Promise<void>;
  logInWithGoogle: () => Promise<void>;
  completeGoogleSignUp: (username: string, fullName: string) => Promise<void>;
  logOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  switchToLocalDemo: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [usernameNeeded, setUsernameNeeded] = useState(false);
  const [googleUserTemp, setGoogleUserTemp] = useState<User | null>(null);
  const [isLocalDemoMode, setIsLocalDemoModeState] = useState(false);

  const switchToLocalDemo = () => {
    // Disabled as requested
  };

  const refreshProfile = async () => {
    if (user) {
      const p = await getUserProfile(user.uid);
      setProfile(p);
    }
  };

  useEffect(() => {
    if (isLocalDemoMode) {
      const stored = localStorage.getItem("dagar_local_current_user");
      if (stored) {
        try {
          const mockUser = JSON.parse(stored);
          setUser(mockUser);
          getUserProfile(mockUser.uid).then((p) => {
            setProfile(p);
            setUsernameNeeded(false);
          });
        } catch (e) {
          console.error("Failed to parse local current user", e);
        }
      } else {
        setUser(null);
        setProfile(null);
        setUsernameNeeded(false);
      }
      setLoading(false);

      const handleUpdate = () => {
        const stored = localStorage.getItem("dagar_local_current_user");
        if (stored) {
          const mockUser = JSON.parse(stored);
          setUser(mockUser);
          getUserProfile(mockUser.uid).then((p) => {
            setProfile(p);
          });
        } else {
          setUser(null);
          setProfile(null);
        }
      };
      window.addEventListener("dagar_chats_db_update", handleUpdate);
      return () => window.removeEventListener("dagar_chats_db_update", handleUpdate);
    } else {
      let profileUnsubscribe: (() => void) | null = null;

      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        setUser(currentUser);
        if (profileUnsubscribe) {
          profileUnsubscribe();
          profileUnsubscribe = null;
        }

        if (currentUser) {
          // Listen to user profile changes in real-time
          const userDocRef = doc(db, "users", currentUser.uid);
          profileUnsubscribe = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
              const p = docSnap.data() as UserProfile;
              setProfile(p);
              setUsernameNeeded(false);
            } else {
              // User has no Firestore profile yet (e.g., fresh Google signup)
              setGoogleUserTemp(currentUser);
              setUsernameNeeded(true);
            }
            setLoading(false);
          }, (err) => {
            console.error("Error watching profile snapshot:", err);
            setLoading(false);
          });
        } else {
          setProfile(null);
          setUsernameNeeded(false);
          setGoogleUserTemp(null);
          setLoading(false);
        }
      });

      return () => {
        unsubscribe();
        if (profileUnsubscribe) {
          profileUnsubscribe();
        }
      };
    }
  }, [isLocalDemoMode]);

  // Trigger verification notification when isVerified becomes true
  useEffect(() => {
    if (user && profile && profile.isVerified) {
      const checkAndCreateVerificationNotif = async () => {
        const { addNotification } = await import("../services/dbService");
        const hasNotifiedKey = `dagar_has_notified_verification_${profile.uid}`;
        if (localStorage.getItem(hasNotifiedKey) !== "true") {
          await addNotification(profile.uid, {
            userId: profile.uid,
            type: "verification",
            title: "Verification Approved!",
            message: "Congratulations! Your profile has been verified with a blue tick badge. ✓",
            read: false
          });
          localStorage.setItem(hasNotifiedKey, "true");
        }
      };
      
      checkAndCreateVerificationNotif();
    }
  }, [profile?.isVerified, user]);

  const signUpLocal = async (email: string, password: string, username: string, fullName: string, gender?: "male" | "female" | "other") => {
    setLoading(true);
    try {
      const cleanUsername = username.trim().toLowerCase();
      const exists = await checkUsernameExists(cleanUsername);
      if (exists) {
        throw new Error("This username is already taken. Please choose another one.");
      }

      const mockUid = "local_usr_" + Math.random().toString(36).substr(2, 9);
      const defaultAvatar = gender === "female"
        ? `https://api.dicebear.com/7.x/adventurer/svg?seed=Lily_${cleanUsername}`
        : gender === "other"
        ? `https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka_${cleanUsername}`
        : `https://api.dicebear.com/7.x/adventurer/svg?seed=Oliver_${cleanUsername}`;

      const mockUser = {
        uid: mockUid,
        email: email,
        displayName: fullName,
        photoURL: defaultAvatar,
        emailVerified: true,
        isAnonymous: false,
        providerData: []
      } as any;

      await createUserProfile(mockUid, {
        uid: mockUid,
        username: cleanUsername,
        fullName: fullName.trim(),
        email: email,
        photoURL: defaultAvatar,
        gender: gender || "male"
      });

      localStorage.setItem("dagar_local_current_user", JSON.stringify(mockUser));
      setUser(mockUser);
      const p = await getUserProfile(mockUid);
      setProfile(p);
      setUsernameNeeded(false);
      
      // Save updated state and dispatch update event
      window.dispatchEvent(new Event("dagar_chats_db_update"));
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, username: string, fullName: string, gender?: "male" | "female" | "other") => {
    if (isLocalDemoMode) {
      return signUpLocal(email, password, username, fullName, gender);
    }

    setLoading(true);
    try {
      const cleanUsername = username.trim().toLowerCase();
      const exists = await checkUsernameExists(cleanUsername);
      if (exists) {
        throw new Error("This username is already taken. Please choose another one.");
      }

      // Create the Auth User
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      const defaultAvatar = gender === "female"
        ? `https://api.dicebear.com/7.x/adventurer/svg?seed=Lily_${cleanUsername}`
        : gender === "other"
        ? `https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka_${cleanUsername}`
        : `https://api.dicebear.com/7.x/adventurer/svg?seed=Oliver_${cleanUsername}`;

      // Create the Firestore User Profile
      await createUserProfile(newUser.uid, {
        uid: newUser.uid,
        username: cleanUsername,
        fullName: fullName.trim(),
        email: email,
        photoURL: defaultAvatar,
        gender: gender || "male"
      });

      // Retrieve and set the profile
      const p = await getUserProfile(newUser.uid);
      setProfile(p);
    } catch (error: any) {
      setLoading(false);
      throw error;
    }
  };

  const logInLocal = async (usernameOrEmail: string, password: string) => {
    setLoading(true);
    try {
      const users = JSON.parse(localStorage.getItem("dagar_local_users") || "[]");
      const queryStr = usernameOrEmail.trim().toLowerCase();
      const found = users.find((u: any) => 
        u.email.toLowerCase() === queryStr || 
        u.username.toLowerCase() === queryStr.replace(/^@/, "")
      );
      
      if (!found) {
        throw new Error("User not found with this email or username in Local Demo Mode. Try signing up first!");
      }

      const mockUser = {
        uid: found.uid,
        email: found.email,
        displayName: found.fullName,
        photoURL: found.photoURL,
        emailVerified: true,
        isAnonymous: false,
        providerData: []
      } as any;

      localStorage.setItem("dagar_local_current_user", JSON.stringify(mockUser));
      setUser(mockUser);
      setProfile(found);
      setUsernameNeeded(false);

      window.dispatchEvent(new Event("dagar_chats_db_update"));
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logIn = async (usernameOrEmail: string, password: string) => {
    if (isLocalDemoMode) {
      return logInLocal(usernameOrEmail, password);
    }

    setLoading(true);
    try {
      let targetEmail = usernameOrEmail.trim();

      // If the input does not look like an email address, assume it is a username and resolve it
      if (!targetEmail.includes("@")) {
        const { getUserProfileByUsername } = await import("../services/dbService");
        const resolvedProfile = await getUserProfileByUsername(targetEmail);
        if (!resolvedProfile) {
          throw new Error(`No account found with username "${targetEmail}". Please try using your email.`);
        }
        targetEmail = resolvedProfile.email;
      }

      await signInWithEmailAndPassword(auth, targetEmail, password);
    } catch (error: any) {
      setLoading(false);
      throw error;
    }
  };

  const logInWithGoogleLocal = async () => {
    setLoading(true);
    try {
      const mockUid = "local_usr_google";
      const mockUser = {
        uid: mockUid,
        email: "demo_google@gmail.com",
        displayName: "Google Explorer",
        photoURL: "https://api.dicebear.com/7.x/adventurer/svg?seed=google_explorer",
        emailVerified: true,
        isAnonymous: false,
        providerData: []
      } as any;

      const p = await getUserProfile(mockUid);
      if (p) {
        localStorage.setItem("dagar_local_current_user", JSON.stringify(mockUser));
        setUser(mockUser);
        setProfile(p);
        setUsernameNeeded(false);
      } else {
        setGoogleUserTemp(mockUser);
        setUsernameNeeded(true);
      }
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logInWithGoogle = async () => {
    if (isLocalDemoMode) {
      return logInWithGoogleLocal();
    }

    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const googleUser = result.user;

      // Check if user has a profile
      const p = await getUserProfile(googleUser.uid);
      if (p) {
        setProfile(p);
        setUsernameNeeded(false);
      } else {
        // Prompt for username
        setGoogleUserTemp(googleUser);
        setUsernameNeeded(true);
      }
    } catch (error: any) {
      setLoading(false);
      throw error;
    }
  };

  const completeGoogleSignUp = async (username: string, fullName: string) => {
    const targetUser = googleUserTemp || user;
    if (!targetUser) throw new Error("No authenticated session found.");

    setLoading(true);
    try {
      const cleanUsername = username.trim().toLowerCase();
      const exists = await checkUsernameExists(cleanUsername);
      if (exists) {
        throw new Error("This username is already taken. Please choose another one.");
      }

      await createUserProfile(targetUser.uid, {
        uid: targetUser.uid,
        username: cleanUsername,
        fullName: fullName.trim() || targetUser.displayName || "Mohan Dagar User",
        email: targetUser.email || "",
        photoURL: targetUser.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${cleanUsername}`,
      });

      const mockUser = {
        ...targetUser,
        displayName: fullName.trim() || targetUser.displayName || "Mohan Dagar User",
        photoURL: targetUser.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${cleanUsername}`,
      };

      if (isLocalDemoMode) {
        localStorage.setItem("dagar_local_current_user", JSON.stringify(mockUser));
        setUser(mockUser);
      }

      const p = await getUserProfile(targetUser.uid);
      setProfile(p);
      setUsernameNeeded(false);
      setGoogleUserTemp(null);

      if (isLocalDemoMode) {
        window.dispatchEvent(new Event("dagar_chats_db_update"));
      }
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logOut = async () => {
    setLoading(true);
    try {
      if (isLocalDemoMode) {
        localStorage.removeItem("dagar_local_current_user");
        setProfile(null);
        setUser(null);
        setUsernameNeeded(false);
        setGoogleUserTemp(null);
        window.dispatchEvent(new Event("dagar_chats_db_update"));
      } else {
        await signOut(auth);
        setProfile(null);
        setUser(null);
        setUsernameNeeded(false);
        setGoogleUserTemp(null);
      }
    } catch (error) {
      console.error("Logout Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        usernameNeeded,
        googleUserTemp,
        isLocalDemoMode,
        signUp,
        logIn,
        logInWithGoogle,
        completeGoogleSignUp,
        logOut,
        refreshProfile,
        switchToLocalDemo
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
