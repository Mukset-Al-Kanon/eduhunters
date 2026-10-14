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
    // Sanitize to clean JSON to prevent Firestore throwing on undefined fields
    const sanitized = JSON.parse(JSON.stringify(newData, (key, value) => {
      if (value === undefined) return null;
      return value;
    }));

    const docRef = doc(db, COLLECTION_NAME, DOC_ID);
    const now = new Date().toISOString();

    // Prevent Firestore 1MB document quota crash only if data strictly approaches 1MB limit
    const jsonStr = JSON.stringify(sanitized);
    if (jsonStr.length > 950000 && sanitized.heroSlides) {
      sanitized.heroSlides = sanitized.heroSlides.map(s => {
        if (s.image && s.image.startsWith('data:image/') && s.image.length > 200000) {
          return { ...s, image: s.image.slice(0, 1000) };
        }
        return s;
      });
    }

    try {
      await setDoc(docRef, {
        ...sanitized,
        _lastUpdated: now
      }, { merge: true });
      return true;
    } catch (writeErr) {
      // Fallback: If full document was rejected due to size, persist critical fields (courses & batches)
      console.warn('[FirestoreSync] Full doc write failed, attempting critical fields fallback:', writeErr);
      if (sanitized.courses || sanitized.examBatches) {
        await setDoc(docRef, {
          ...(sanitized.courses ? { courses: sanitized.courses } : {}),
          ...(sanitized.examBatches ? { examBatches: sanitized.examBatches } : {}),
          ...(sanitized.siteSettings ? { siteSettings: sanitized.siteSettings } : {}),
          _lastUpdated: now
        }, { merge: true });
        return true;
      }
      throw writeErr;
    }
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
      if (error?.code === 'resource-exhausted') {
        console.warn('[FirestoreSync] Cloud daily read quota reached. Running in local mode.');
        return;
      }
      console.warn('[FirestoreSync] Real-time listener error:', error);
    });

    return unsubscribe;
  } catch (err) {
    console.warn('[FirestoreSync] Error setting up listener:', err);
    return () => {};
  }
}
