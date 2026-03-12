import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY || '').trim(),
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '').trim(),
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID || '').trim(),
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '').trim(),
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '').trim(),
  appId: (import.meta.env.VITE_FIREBASE_APP_ID || '').trim(),
};

const requiredConfigKeys = ['apiKey', 'authDomain', 'projectId', 'appId'] as const;

export function hasFirebaseConfig() {
  return requiredConfigKeys.every((key) => Boolean(firebaseConfig[key]));
}

let authInstance: ReturnType<typeof getAuth> | null = null;
let googleProviderInstance: GoogleAuthProvider | null = null;
let firestoreInstance: ReturnType<typeof getFirestore> | null = null;
let storageInstance: ReturnType<typeof getStorage> | null = null;
let appInstance: ReturnType<typeof initializeApp> | null = null;

function getFirebaseApp() {
  if (!hasFirebaseConfig()) {
    throw new Error('Firebase 설정이 비어 있습니다. `.env`에 VITE_FIREBASE_* 값을 채워 주세요.');
  }

  if (!appInstance) {
    appInstance = getApps().length ? getApp() : initializeApp(firebaseConfig);
  }

  return appInstance;
}

export function getFirebaseAuth() {
  if (!authInstance) {
    authInstance = getAuth(getFirebaseApp());
  }

  return authInstance;
}

export function getFirebaseGoogleProvider() {
  if (!googleProviderInstance) {
    googleProviderInstance = new GoogleAuthProvider();
    googleProviderInstance.setCustomParameters({
      prompt: 'select_account',
    });
  }

  return googleProviderInstance;
}

export function getFirebaseDb() {
  if (!firestoreInstance) {
    firestoreInstance = getFirestore(getFirebaseApp());
  }

  return firestoreInstance;
}

export function getFirebaseStorage() {
  const bucket = firebaseConfig.storageBucket;

  if (!bucket) {
    throw new Error('Firebase Storage 설정이 비어 있습니다. `.env`에 VITE_FIREBASE_STORAGE_BUCKET 값을 채워 주세요.');
  }

  if (!storageInstance) {
    storageInstance = getStorage(getFirebaseApp());
  }

  return storageInstance;
}
