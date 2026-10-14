import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBOA7g2QOdCrYqEtmfEiPGdWluHMfNecdk',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'edu-hunters-a240d.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'edu-hunters-a240d',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'edu-hunters-a240d.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1000542546647',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1000542546647:web:6e59db5334dd57dc649e92',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-4QGTGM7PY4'
};

// Check if valid Firebase configuration is provided in .env
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== 'your_api_key_here' &&
  firebaseConfig.apiKey !== 'YOUR_API_KEY' &&
  firebaseConfig.projectId &&
  firebaseConfig.projectId !== 'your_project_id'
);

let app = null;
let auth = null;
let googleProvider = null;
let db = null;
let storage = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });
    db = getFirestore(app);
    try {
      storage = getStorage(app);
    } catch (sErr) {
      console.warn('[Firebase Storage] Init note:', sErr);
    }
  } catch (error) {
    console.warn('[Firebase] Initialization error:', error);
  }
} else {
  console.info(
    'ℹ️ [Edu Hunters] Firebase keys not yet set in .env. Running in graceful local Auth mode.'
  );
}

export { app, auth, googleProvider, db, storage };

