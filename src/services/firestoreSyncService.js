// src/services/firestoreSyncService.js
import { db, isFirebaseConfigured } from '../firebase/config';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

const COLLECTION_NAME = 'eduhunters_site';
const DOC_ID = 'main_data';

/**
 * Fetch latest site data from Cloud Firestore
 * Returns null if not found or Firestore not configured
 */
export async function fetchCloudData() {
  if (!isFirebaseConfigured || !db) return null;
  try {
    const docRef = doc(db, COLLECTION_NAME, DOC_ID);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
  } catch (error) {
    console.warn('[FirestoreSync] Failed to fetch cloud data:', error);
  }
  return null;
}

/**
 * Save updated site data to Cloud Firestore
 * Runs seamlessly in background with optimistic fallback
 */
export async function saveCloudData(newData) {
  if (!isFirebaseConfigured || !db || !newData) return false;
  try {
    const docRef = doc(db, COLLECTION_NAME, DOC_ID);
    await setDoc(docRef, {
      ...newData,
      _lastUpdated: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (error) {
    console.warn('[FirestoreSync] Failed to save cloud data:', error);
    return false;
  }
}

/**
 * Subscribe to real-time Cloud Firestore updates
 * Whenever admin edits anything in live, all connected users & local dev update in real-time
 */
export function subscribeToCloudData(onUpdate) {
  if (!isFirebaseConfigured || !db || typeof onUpdate !== 'function') {
    return () => {};
  }

  try {
    const docRef = doc(db, COLLECTION_NAME, DOC_ID);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const cloudData = docSnap.data();
        onUpdate(cloudData);
      }
    }, (error) => {
      console.warn('[FirestoreSync] Real-time listener error:', error);
    });

    return unsubscribe;
  } catch (err) {
    console.warn('[FirestoreSync] Error setting up listener:', err);
    return () => {};
  }
}
