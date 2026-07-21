import React, { createContext, useContext, useState, useEffect } from "react";
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail
} from "firebase/auth";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { auth, db, googleProvider, isLocalDemo, setLocalDemo } from "../firebase";
import { getUserProfile, createUserProfile, checkUsernameExists } from "../services/dbService";
import { UserProfile } from "../types";
import { DEFAULT_AVATAR_URL } from "../constants";

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
  sendVerificationEmail: () => Promise<void>;
  sendResetEmail: (email: string) => Promise<void>;
  resendVerificationEmailByEmail: (emailOrUsername: string) => Promise<void>;
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
        if (currentUser && !currentUser.emailVerified) {
          setUser(null);
          setProfile(null);
          setLoading(false);
          await signOut(auth);
          return;
        }

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
      const defaultAvatar = DEFAULT_AVATAR_URL;

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

      // Save pending profile details in Firestore 'pending_users' collection and localStorage
      const pendingProfile = {
        uid: newUser.uid,
        username: cleanUsername,
        fullName: fullName.trim(),
        email: email,
        photoURL: DEFAULT_AVATAR_URL,
        gender: gender || "male",
        createdAt: new Date().toISOString()
      };

      // Write to 'pending_users' in Firestore
      await setDoc(doc(db, "pending_users", email.toLowerCase()), pendingProfile);

      // Save to localStorage as fallback
      localStorage.setItem(`pending_profile_${email.toLowerCase()}`, JSON.stringify(pendingProfile));

      // Send custom-domain action verification email
      try {
        await sendEmailVerification(newUser, {
          url: `https://mohandagar.in/auth?email=${encodeURIComponent(email)}&username=${encodeURIComponent(cleanUsername)}&fullName=${encodeURIComponent(fullName.trim())}&gender=${encodeURIComponent(gender || 'male')}&uid=${encodeURIComponent(newUser.uid)}`
        });
      } catch (verificationError) {
        console.error("Failed to send verification email upon signup:", verificationError);
      }

      // Sign out immediately so they cannot access the app before verification
      await signOut(auth);
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

      const userCredential = await signInWithEmailAndPassword(auth, targetEmail, password);
      const newUser = userCredential.user;

      if (!newUser.emailVerified) {
        // Automatically resend verification email
        try {
          await sendEmailVerification(newUser, {
            url: `https://mohandagar.in/auth?email=${encodeURIComponent(targetEmail)}`
          });
        } catch (resendError) {
          console.error("Failed to resend verification email upon unverified login:", resendError);
        }
        await signOut(auth);
        throw new Error("Your email address is not verified yet. A new verification link has been sent to your email. Please verify before logging in.");
      }
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
        fullName: fullName.trim() || targetUser.displayName || "DagarChat User",
        email: targetUser.email || "",
        photoURL: targetUser.photoURL || DEFAULT_AVATAR_URL,
      });

      const mockUser = {
        ...targetUser,
        displayName: fullName.trim() || targetUser.displayName || "DagarChat User",
        photoURL: targetUser.photoURL || DEFAULT_AVATAR_URL,
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

  const sendVerificationEmail = async () => {
    if (isLocalDemoMode) return;
    if (!auth.currentUser) throw new Error("No user session found to verify.");
    await sendEmailVerification(auth.currentUser, {
      url: "https://mohandagar.in/auth"
    });
  };

  const sendResetEmail = async (emailOrUsername: string) => {
    if (isLocalDemoMode) return;
    let targetEmail = emailOrUsername.trim();

    try {
      if (!targetEmail.includes("@")) {
        const { getUserProfileByUsername } = await import("../services/dbService");
        const resolvedProfile = await getUserProfileByUsername(targetEmail);
        if (resolvedProfile) {
          targetEmail = resolvedProfile.email;
        } else {
          // If no user found by username, return silently to not reveal non-existence
          return;
        }
      }

      await sendPasswordResetEmail(auth, targetEmail, {
        url: "https://mohandagar.in/auth"
      });
    } catch (error: any) {
      // Ignore firebase user-not-found errors to prevent revealing account existence
      const ignoreErrors = ["auth/user-not-found", "user-not-found"];
      if (ignoreErrors.includes(error.code) || ignoreErrors.includes(error.message)) {
        return;
      }
      throw error;
    }
  };

  const resendVerificationEmailByEmail = async (emailOrUsername: string) => {
    if (isLocalDemoMode) return;
    // We explain that trying to log in automatically handles verification email dispatching securely
    throw new Error("Please enter your credentials and click Log In. If your email is unverified, a verification link will be sent to your inbox automatically!");
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
        switchToLocalDemo,
        sendVerificationEmail,
        sendResetEmail,
        resendVerificationEmailByEmail
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
