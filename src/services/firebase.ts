import { initializeApp, getApps, getApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import type { FirebaseStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import type { Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCx6Oz9ga8kMATnv8kuR7gQ0cFOTISYrsc",
  authDomain: "content-admin-46278.firebaseapp.com",
  projectId: "content-admin-46278",
  storageBucket: "content-admin-46278.firebasestorage.app",
  messagingSenderId: "499064721903",
  appId: "1:499064721903:web:3c4c6164cbc3f4f303e61a",
  measurementId: "G-0DKF9BCXMS"
};

let firebaseApp: FirebaseApp;
let firestoreDb: Firestore;
let firebaseStorage: FirebaseStorage;

export function getFirebaseInstance(): { app: FirebaseApp; db: Firestore; storage: FirebaseStorage; auth: Auth } {
  try {
    if (!getApps().length) {
      firebaseApp = initializeApp(firebaseConfig);
    } else {
      firebaseApp = getApp();
    }

    if (!firestoreDb) firestoreDb = getFirestore(firebaseApp);
    if (!firebaseStorage) firebaseStorage = getStorage(firebaseApp);

    return { app: firebaseApp, db: firestoreDb, storage: firebaseStorage, auth: getAuth(firebaseApp) };
  } catch (err) {
    console.error('Firebase initialization error:', err);
    throw new Error('Failed to initialize Firebase');
  }
}
