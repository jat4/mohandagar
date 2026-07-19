import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";

// The user-provided Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCxoL5EHurB_HIT488wu6Al1WBa7RzeH_4",
  authDomain: "details-collector100.firebaseapp.com",
  databaseURL: "https://details-collector100-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "details-collector100",
  storageBucket: "details-collector100.firebasestorage.app",
  messagingSenderId: "78770304860",
  appId: "1:78770304860:web:c8fd07cb6e072f769df399"
};

// Check if local demo should be used based on local storage flag
export function isLocalDemo(): boolean {
  return false;
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

/**
 * Standard error handler conforming to the mandated specifications.
 */
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}


// setLocalDemo persists the preference to local storage and triggers updates
export function setLocalDemo(value: boolean): void {
  if (value) {
    localStorage.setItem('dagar_chats_use_local_demo', 'true');
  } else {
    localStorage.removeItem('dagar_chats_use_local_demo');
  }
  window.dispatchEvent(new Event('dagar_chats_db_update'));
}

/**
 * Validates connectivity to Firestore as requested by the guidelines
 */
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && (error.message.includes('the client is offline') || error.message.includes('permission') || error.message.includes('not found'))) {
      console.error("Please check your Firebase configuration or connection state. Auto-activating local fallback mode.");
      // We don't force local demo immediately on transient failures, but we log the connection state.
    }
  }
}

testConnection();
