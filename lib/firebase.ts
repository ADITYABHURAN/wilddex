import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, Auth, Persistence } from 'firebase/auth';
import * as FirebaseAuthRN from '@firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// @firebase/auth's React Native build exports getReactNativePersistence at runtime
// (Metro resolves it via the package's "react-native" exports condition), but its
// shared type declarations — which tsc always resolves regardless of platform —
// don't declare it. Cast the namespace to get a typed handle to it.
const { getReactNativePersistence } = FirebaseAuthRN as unknown as {
  getReactNativePersistence: (storage: typeof AsyncStorage) => Persistence;
};

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

let auth: Auth;
try {
  auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
} catch {
  // Fast Refresh can re-run this module against an app that already has auth initialized.
  auth = getAuth(app);
}

export { auth };
