/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  auth, 
  signInWithGoogle as fbSignInGoogle, 
  signInWithEmail as fbSignInEmail,
  signUpWithEmail as fbSignUpEmail,
  signOutUser as fbSignOut,
  isUserAdmin
} from '../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

interface AuthContextType {
  currentUser: User | null;
  authLoading: boolean;
  signInWithGoogle: () => Promise<User | null>;
  signInWithEmail: (email: string, pass: string) => Promise<User>;
  signUpWithEmail: (email: string, pass: string, displayName?: string) => Promise<User>;
  signOutUser: () => Promise<void>;
  isHost: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    return await fbSignInGoogle();
  };

  const signInWithEmail = async (email: string, pass: string) => {
    return await fbSignInEmail(email, pass);
  };

  const signUpWithEmail = async (email: string, pass: string, displayName?: string) => {
    return await fbSignUpEmail(email, pass, displayName);
  };

  const signOutUser = async () => {
    await fbSignOut();
  };

  const isHost = Boolean(currentUser);
  const isAdmin = isUserAdmin(currentUser);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        authLoading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOutUser,
        isHost,
        isAdmin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
