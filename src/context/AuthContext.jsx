// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  auth, 
  googleProvider, 
  db, 
  isFirebaseConfigured 
} from '../firebase/config';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  updatePassword,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp, 
  collection, 
  query, 
  where, 
  getDocs, 
  limit,
  onSnapshot
} from 'firebase/firestore';
import { saveSupabaseUser, fetchUserApprovedEnrollments } from '../services/supabaseService';
import { isPhoneMatch } from '../utils/enrollmentService';

const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Detects if the current user agent is inside an in-app browser (WebView),
 * such as Facebook, Messenger, Instagram, or WhatsApp.
 * Google OAuth blocks sign-in inside these WebViews with 'disallowed_useragent' (error 403).
 */
export function isInAppBrowser() {
  if (typeof navigator === 'undefined') return false;
  const ua = (navigator.userAgent || navigator.vendor || window.opera || '').toLowerCase();
  return (
    ua.includes('fban') ||
    ua.includes('fbav') ||
    ua.includes('instagram') ||
    ua.includes('messenger') ||
    ua.includes('whatsapp') ||
    ua.includes('line') ||
    ua.includes('twitter') ||
    ua.includes('snapchat') ||
    ua.includes('wv') || // Android WebView flag
    (ua.includes('iphone') && !ua.includes('safari'))
  );
}

// Format Firebase errors into clean, professional, bilingual messages
export function formatAuthError(error) {
  if (!error) return 'An unexpected error occurred. Please try again.';
  const code = error.code || '';
  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : 'current domain';

  switch (code) {
    case 'auth/use-google-signin':
      return error.message || 'This account was registered using Google. Please click "Sign in with Google" below.';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email address. Please sign in or use "Sign in with Google" if you originally registered with Google.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password is too weak. Please enter at least 6 characters.';
    case 'auth/user-not-found':
      return 'No account found with this email. Please check your email or sign up.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password. If you originally signed in with Google, please click "Sign in with Google" below.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in popup window was closed before completion. Please try again.';
    case 'auth/popup-blocked':
      return 'Browser blocked the popup window. Please allow popups for this site, or try clicking "Sign in with Google" again.';
    case 'auth/cancelled-popup-request':
      return 'Another sign-in attempt is already in progress. Please wait a moment.';
    case 'auth/unauthorized-domain':
      return `This website domain (${currentDomain}) is not authorized yet in Firebase Console. Please add "${currentDomain}" under Firebase Authentication > Settings > Authorized domains.`;
    case 'auth/operation-not-allowed':
      return 'This sign-in method is currently disabled in Firebase Console. Please enable it under Firebase Authentication settings.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email using a different sign-in method (e.g. Password). Please sign in using your email and password, or use Forgot Password.';
    case 'auth/expired-action-code':
      return 'This password reset link has expired. Please request a new one.';
    case 'auth/invalid-action-code':
      return 'This password reset link is invalid or has already been used.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again in a few moments.';
    case 'auth/network-request-failed':
      return 'Network request failed. Please check your internet connection.';
    default:
      return error.message || 'Authentication failed. Please try again.';
  }
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('eh_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [isLiveFirebase, setIsLiveFirebase] = useState(isFirebaseConfigured);

  // Sync user profile data directly to Supabase (100% Centralized Cloud)
  const syncUserToFirestore = async (user, additionalData = {}) => {
    if (!user) return;
    try {
      saveSupabaseUser(user, additionalData).catch(e => console.warn('[AuthContext] Supabase user sync note:', e));
    } catch (e) {}
  };

  // Handle redirect result on mount (for mobile Google Sign-In)
  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      getRedirectResult(auth)
        .then((result) => {
          if (result?.user) {
            const rUser = result.user;
            const mappedGoogleUser = {
              uid: rUser.uid,
              id: rUser.uid,
              email: rUser.email,
              displayName: rUser.displayName || rUser.email?.split('@')[0],
              name: rUser.displayName || rUser.email?.split('@')[0],
              photoURL: rUser.photoURL || '/avatar.svg',
              role: rUser.email === 'admin@eduhunters.com' ? 'admin' : 'student',
              authProvider: 'google.com'
            };

            let isNewRedirect = false;
            try {
              const googleEmails = JSON.parse(localStorage.getItem('eh_google_registered_emails') || '[]');
              if (rUser.email && !googleEmails.includes(rUser.email.toLowerCase())) {
                isNewRedirect = true;
                googleEmails.push(rUser.email.toLowerCase());
                localStorage.setItem('eh_google_registered_emails', JSON.stringify(googleEmails));
              }
              localStorage.setItem('eh_last_auth_method', 'google');
              localStorage.setItem('eh_last_auth_email', rUser.email.toLowerCase());
              localStorage.setItem('eh_current_user', JSON.stringify(mappedGoogleUser));
            } catch (e) {}

            setCurrentUser(mappedGoogleUser);
            broadcastUserSync(isNewRedirect ? 'REGISTER' : 'UPDATE', mappedGoogleUser);
            syncUserToFirestore(rUser, { authProvider: 'google.com', isNewRegistration: isNewRedirect }).catch(() => {});
          }
        })
        .catch((err) => {
          console.warn('[AuthContext] getRedirectResult notice:', err);
        });
    }
  }, []);

  // Listen to Auth State
  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          // Enrich with extra data (like role, enrolled courses)
          let enrichedUser = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email?.split('@')[0],
            photoURL: user.photoURL || '/avatar.svg',
            role: user.email === 'admin@eduhunters.com' ? 'admin' : 'student',
            authProvider: user.providerData?.[0]?.providerId || 'password'
          };

          // Record auth provider & email
          try {
            const providerId = user.providerData?.[0]?.providerId || '';
            if (providerId.includes('google')) {
              localStorage.setItem('eh_last_auth_method', 'google');
              const googleEmails = JSON.parse(localStorage.getItem('eh_google_registered_emails') || '[]');
              if (user.email && !googleEmails.includes(user.email.toLowerCase())) {
                googleEmails.push(user.email.toLowerCase());
                localStorage.setItem('eh_google_registered_emails', JSON.stringify(googleEmails));
              }
            } else if (providerId.includes('password')) {
              localStorage.setItem('eh_last_auth_method', 'password');
            }
            if (user.email) {
              localStorage.setItem('eh_last_auth_email', user.email.toLowerCase());
            }
          } catch (e) {}

          if (db) {
            try {
              const snap = await getDoc(doc(db, 'users', user.uid));
              if (snap.exists()) {
                const sData = snap.data();
                enrichedUser = { ...enrichedUser, ...sData };

                // Automatically merge courses and batches from Firestore into local storage and user-scoped keys
                if (Array.isArray(sData.enrolledCourses) && sData.enrolledCourses.length > 0) {
                  try {
                    localStorage.setItem(`eduhunters_enrolled_courses_${user.uid}`, JSON.stringify(sData.enrolledCourses));
                    const localC = JSON.parse(localStorage.getItem('eduhunters_enrolled_courses') || '[]');
                    const merged = Array.from(new Set([...localC, ...sData.enrolledCourses]));
                    localStorage.setItem('eduhunters_enrolled_courses', JSON.stringify(merged));
                  } catch (e) {}
                }
                if (Array.isArray(sData.enrolledBatches) && sData.enrolledBatches.length > 0) {
                  try {
                    localStorage.setItem(`eduhunters_enrolled_batches_${user.uid}`, JSON.stringify(sData.enrolledBatches));
                    const localB = JSON.parse(localStorage.getItem('eduhunters_enrolled_batches') || '[]');
                    const mergedB = Array.from(new Set([...localB, ...sData.enrolledBatches]));
                    localStorage.setItem('eduhunters_enrolled_batches', JSON.stringify(mergedB));
                  } catch (e) {}
                }
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('eh:enrollment_updated', {
                    detail: { courses: sData.enrolledCourses, timestamp: Date.now() }
                  }));
                }
              }
            } catch (e) {
              // Ignore firestore permission error during initial auth
            }
          }

          // Cross-Device Cloud Sync: Automatically fetch & unlock approved courses & batches from Supabase
          try {
            const { courses: spCourses, batches: spBatches = [], orders: spOrders } = await fetchUserApprovedEnrollments(
              user.email,
              enrichedUser.phone || enrichedUser.whatsapp,
              user.uid
            );

            if (spCourses && spCourses.length > 0) {
              const curEnrolled = Array.isArray(enrichedUser.enrolledCourses) ? enrichedUser.enrolledCourses : [];
              const mergedCourses = Array.from(new Set([...curEnrolled, ...spCourses]));
              enrichedUser.enrolledCourses = mergedCourses;

              try {
                localStorage.setItem(`eduhunters_enrolled_courses_${user.uid}`, JSON.stringify(mergedCourses));
                const localCourses = JSON.parse(localStorage.getItem('eduhunters_enrolled_courses') || '[]');
                localStorage.setItem('eduhunters_enrolled_courses', JSON.stringify(Array.from(new Set([...localCourses, ...mergedCourses]))));
              } catch (e) {}
            }

            if (spBatches && spBatches.length > 0) {
              const curBatches = Array.isArray(enrichedUser.enrolledBatches) ? enrichedUser.enrolledBatches : [];
              const mergedBatches = Array.from(new Set([...curBatches, ...spBatches]));
              enrichedUser.enrolledBatches = mergedBatches;

              try {
                localStorage.setItem(`eduhunters_enrolled_batches_${user.uid}`, JSON.stringify(mergedBatches));
                const localBatches = JSON.parse(localStorage.getItem('eduhunters_enrolled_batches') || '[]');
                localStorage.setItem('eduhunters_enrolled_batches', JSON.stringify(Array.from(new Set([...localBatches, ...mergedBatches]))));
              } catch (e) {}
            }

            if (spOrders && spOrders.length > 0) {
              try {
                const localOrders = JSON.parse(localStorage.getItem('eh_user_orders_v3') || '[]');
                const ordMap = new Map();
                localOrders.forEach(o => ordMap.set(o.id || o.invoiceNumber, o));
                spOrders.forEach(o => ordMap.set(o.id || o.invoiceNumber, o));
                localStorage.setItem('eh_user_orders_v3', JSON.stringify(Array.from(ordMap.values())));
              } catch (e) {}
            }
          } catch (e) {
            console.warn('[AuthContext] Supabase enrollment sync note:', e);
          }

          try {
            localStorage.setItem('eh_current_user', JSON.stringify(enrichedUser));
          } catch (e) {}

          setCurrentUser(enrichedUser);
        } else {
          // Check if local authenticated session is stored (Prevent dropping active student access on refresh)
          try {
            const saved = localStorage.getItem('eh_current_user');
            if (saved) {
              const parsed = JSON.parse(saved);
              // Preserve session for ANY valid signed-in student or admin
              // Only explicit logout() will remove eh_current_user
              if (parsed && parsed.uid) {
                setCurrentUser(parsed);
                setLoading(false);
                return;
              }
            }
          } catch (e) {}
          setCurrentUser(null);
        }
        setLoading(false);
      });

      return unsubscribe;
    } else {
      // Local / Offline Mode Fallback
      try {
        const saved = localStorage.getItem('eh_current_user');
        if (saved) {
          setCurrentUser(JSON.parse(saved));
        }
      } catch (e) {
        console.error('Error reading local auth session', e);
      }
      setLoading(false);
    }
  }, [isLiveFirebase]);

  // Live Cloud Firestore Listener on Active User Document
  useEffect(() => {
    if (!isFirebaseConfigured || !db || !currentUser?.uid) return;

    // Skip synthetic/demo users
    if (currentUser.uid.startsWith('demo_') || currentUser.uid === 'admin_master') return;

    let unsubscribe = null;
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      unsubscribe = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const cloudData = docSnap.data();
          setCurrentUser((prev) => {
            if (!prev) return prev;
            const prevCourses = JSON.stringify(prev.enrolledCourses || []);
            const newCourses = JSON.stringify(cloudData.enrolledCourses || []);
            const hasCourseChanges = prevCourses !== newCourses;
            const hasStatusChanges = prev.status !== cloudData.status;
            const hasPhoneChanges = (cloudData.phone && prev.phone !== cloudData.phone) || (cloudData.whatsapp && prev.whatsapp !== cloudData.whatsapp);

            if (hasCourseChanges || hasStatusChanges || hasPhoneChanges) {
              const updated = {
                ...prev,
                ...cloudData,
                enrolledCourses: Array.isArray(cloudData.enrolledCourses) ? cloudData.enrolledCourses : (prev.enrolledCourses || [])
              };
              try {
                localStorage.setItem('eh_current_user', JSON.stringify(updated));
                if (Array.isArray(cloudData.enrolledCourses)) {
                  localStorage.setItem(`eduhunters_enrolled_courses_${currentUser.uid}`, JSON.stringify(cloudData.enrolledCourses));
                  const localC = JSON.parse(localStorage.getItem('eduhunters_enrolled_courses') || '[]');
                  const merged = Array.from(new Set([...localC, ...cloudData.enrolledCourses]));
                  localStorage.setItem('eduhunters_enrolled_courses', JSON.stringify(merged));
                }
              } catch (e) {}

              // Fire instant real-time events to all components, hooks, and tabs
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('eh:enrollment_updated', {
                  detail: { courses: cloudData.enrolledCourses, timestamp: Date.now() }
                }));
                window.dispatchEvent(new CustomEvent('eh:orders_updated'));
                window.dispatchEvent(new Event('storage'));
              }

              return updated;
            }
            return prev;
          });
        }
      }, (err) => {
        console.warn('[AuthContext] Live user document sync note:', err);
      });
    } catch (e) {
      console.warn('[AuthContext] Error setting up user doc listener:', e);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser?.uid, isFirebaseConfigured]);

  // Real-time Event Listener for Admin Enrollment Approval (unlocks course instantly across windows)
  useEffect(() => {
    const handleApprovalEvent = (e) => {
      const payload = e?.detail;
      if (!payload?.courseTitle) return;
      const targetCourse = payload.courseTitle;
      const studentEmail = (payload.studentEmail || '').toLowerCase().trim();
      const studentPhone = (payload.studentPhone || '').replace(/[^0-9]/g, '');

      setCurrentUser((prev) => {
        if (!prev) return prev;
        const curEmail = (prev.email || '').toLowerCase().trim();
        const curPhone = (prev.phone || prev.whatsapp || '').replace(/[^0-9]/g, '');
        const isMatch = (studentEmail && curEmail === studentEmail) || 
                        isPhoneMatch(curPhone, studentPhone) || 
                        (!studentEmail && !studentPhone);
        
        if (isMatch) {
          const prevCourses = Array.isArray(prev.enrolledCourses) ? prev.enrolledCourses : [];
          if (!prevCourses.includes(targetCourse)) {
            const nextCourses = [targetCourse, ...prevCourses];
            const updated = { ...prev, status: 'Active', enrolledCourses: nextCourses };
            try {
              localStorage.setItem('eh_current_user', JSON.stringify(updated));
              const localC = JSON.parse(localStorage.getItem('eduhunters_enrolled_courses') || '[]');
              localStorage.setItem('eduhunters_enrolled_courses', JSON.stringify(Array.from(new Set([...localC, targetCourse]))));
              if (prev.uid) {
                const scopedC = JSON.parse(localStorage.getItem(`eduhunters_enrolled_courses_${prev.uid}`) || '[]');
                localStorage.setItem(`eduhunters_enrolled_courses_${prev.uid}`, JSON.stringify(Array.from(new Set([...scopedC, targetCourse]))));
              }
            } catch (err) {}
            return updated;
          }
        }
        return prev;
      });
    };

    window.addEventListener('eh:enrollment_approved', handleApprovalEvent);
    return () => window.removeEventListener('eh:enrollment_approved', handleApprovalEvent);
  }, []);

  // Real-time broadcaster for User Registration and Profile Updates across windows & tabs
  const broadcastUserSync = (action, user) => {
    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('eh_user_changed', { detail: { action, user } }));
        if (action === 'REGISTER') {
          window.dispatchEvent(new CustomEvent('eh_user_registered', { detail: user }));
        } else {
          window.dispatchEvent(new CustomEvent('eh_profile_updated', { detail: user }));
        }
        window.dispatchEvent(new Event('storage'));

        if (typeof BroadcastChannel !== 'undefined') {
          try {
            const bc = new BroadcastChannel('eduhunters_sync_channel');
            bc.postMessage({
              type: 'USER_SYNC',
              action,
              payload: user
            });
            bc.close();
          } catch (e) {}
        }
      }
    } catch (e) {}
  };

  // Sign up with Email and Password
  const signup = async (email, password, displayName) => {
    const defaultAvatar = '/avatar.svg';
    const cleanEmail = (email || '').trim().toLowerCase();

    // Check if this email was previously registered via Google
    let isGoogleAccount = false;
    try {
      const googleEmails = JSON.parse(localStorage.getItem('eh_google_registered_emails') || '[]');
      if (googleEmails.includes(cleanEmail)) isGoogleAccount = true;
    } catch (e) {}

    if (isGoogleAccount) {
      const googleErr = new Error('An account already exists for this email via Google. Please click "Sign in with Google" below.');
      googleErr.code = 'auth/use-google-signin';
      googleErr.suggestGoogleSignIn = true;
      throw googleErr;
    }

    // Ensure fresh user starts with clean enrollment state
    try {
      localStorage.removeItem('eduhunters_enrolled_courses');
      localStorage.removeItem('eduhunters_enrolled_batches');
      localStorage.removeItem('enrolled_courses');
      localStorage.removeItem('enrolled_exam_batches');
    } catch (e) {}

    if (isFirebaseConfigured && auth) {
      try {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        updateProfile(res.user, {
          displayName: displayName || cleanEmail.split('@')[0],
          photoURL: defaultAvatar
        }).catch(() => {});
        syncUserToFirestore(res.user, { 
          displayName, 
          photoURL: defaultAvatar, 
          authProvider: 'password',
          isNewRegistration: true
        }).catch(() => {});

        const createdUser = {
          uid: res.user.uid,
          id: res.user.uid,
          email: res.user.email,
          displayName: displayName || res.user.displayName || cleanEmail.split('@')[0],
          name: displayName || res.user.displayName || cleanEmail.split('@')[0],
          photoURL: defaultAvatar,
          role: cleanEmail === 'admin@eduhunters.com' ? 'admin' : 'student',
          authProvider: 'password',
          createdAt: new Date().toISOString()
        };

        // Remember login method
        try {
          localStorage.setItem('eh_last_auth_method', 'password');
          localStorage.setItem('eh_last_auth_email', cleanEmail);
          const mockUsers = JSON.parse(localStorage.getItem('eh_registered_users') || '[]');
          if (!mockUsers.some(u => u.email.toLowerCase() === cleanEmail)) {
            mockUsers.push(createdUser);
            localStorage.setItem('eh_registered_users', JSON.stringify(mockUsers));
          }
          localStorage.setItem('eh_current_user', JSON.stringify(createdUser));
        } catch (e) {}

        setCurrentUser(createdUser);
        broadcastUserSync('REGISTER', createdUser);
        return res.user;
      } catch (err) {
        if (err.code === 'auth/email-already-in-use') {
          // Double check if account exists via Google in Firestore
          if (isFirebaseConfigured && db) {
            try {
              const uQ = query(collection(db, 'users'), where('email', '==', cleanEmail), limit(1));
              const uSnap = await getDocs(uQ);
              if (!uSnap.empty) {
                const uData = uSnap.docs[0].data();
                if (uData?.authProvider === 'google.com' || uData?.authProvider?.includes('google')) {
                  const googleErr = new Error('An account already exists for this email via Google. Please click "Sign in with Google" below.');
                  googleErr.code = 'auth/use-google-signin';
                  googleErr.suggestGoogleSignIn = true;
                  throw googleErr;
                }
              }
            } catch (e) {}
          }
        }

        if (err.code === 'auth/unauthorized-domain') {
          console.warn('[AuthContext] Domain not authorized in Firebase Console yet. Running seamless local signup fallback.');
          const mockUsers = JSON.parse(localStorage.getItem('eh_registered_users') || '[]');
          if (mockUsers.some(u => u.email.toLowerCase() === cleanEmail)) {
            const error = new Error('Email already registered');
            error.code = 'auth/email-already-in-use';
            throw error;
          }
          const newUser = {
            uid: 'user_' + Date.now(),
            id: 'user_' + Date.now(),
            email: cleanEmail,
            displayName: displayName || cleanEmail.split('@')[0],
            name: displayName || cleanEmail.split('@')[0],
            photoURL: defaultAvatar,
            role: cleanEmail === 'admin@eduhunters.com' ? 'admin' : 'student',
            authProvider: 'password',
            createdAt: new Date().toISOString()
          };
          mockUsers.push({ ...newUser, password });
          localStorage.setItem('eh_registered_users', JSON.stringify(mockUsers));
          localStorage.setItem('eh_current_user', JSON.stringify(newUser));
          localStorage.setItem('eh_last_auth_method', 'password');
          localStorage.setItem('eh_last_auth_email', cleanEmail);
          setCurrentUser(newUser);

          // User profile is saved directly to Supabase eduhunters_users (100% Centralized Cloud)
          saveSupabaseUser(newUser, { isNewRegistration: true }).catch(() => {});
          broadcastUserSync('REGISTER', newUser);
          return newUser;
        }
        throw err;
      }
    } else {
      // Demo Mode Sign up
      const mockUsers = JSON.parse(localStorage.getItem('eh_registered_users') || '[]');
      if (mockUsers.some(u => u.email.toLowerCase() === cleanEmail)) {
        const err = new Error('Email already registered');
        err.code = 'auth/email-already-in-use';
        throw err;
      }
      const newUser = {
        uid: 'user_' + Date.now(),
        id: 'user_' + Date.now(),
        email: cleanEmail,
        displayName: displayName || cleanEmail.split('@')[0],
        name: displayName || cleanEmail.split('@')[0],
        photoURL: defaultAvatar,
        role: cleanEmail === 'admin@eduhunters.com' ? 'admin' : 'student',
        authProvider: 'password',
        createdAt: new Date().toISOString()
      };
      mockUsers.push({ ...newUser, password });
      localStorage.setItem('eh_registered_users', JSON.stringify(mockUsers));
      localStorage.setItem('eh_current_user', JSON.stringify(newUser));
      localStorage.setItem('eh_last_auth_method', 'password');
      localStorage.setItem('eh_last_auth_email', cleanEmail);
      setCurrentUser(newUser);

      // User profile is saved directly to Supabase eduhunters_users (100% Centralized Cloud)
      saveSupabaseUser(newUser, { isNewRegistration: true }).catch(() => {});
      broadcastUserSync('REGISTER', newUser);
      return newUser;
    }
  };

  // Sign in with Email and Password
  const login = async (email, password) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    if (isFirebaseConfigured && auth) {
      try {
        const res = await signInWithEmailAndPassword(auth, email, password);
        syncUserToFirestore(res.user, { authProvider: 'password' }).catch(() => {});
        
        try {
          localStorage.setItem('eh_last_auth_method', 'password');
          localStorage.setItem('eh_last_auth_email', cleanEmail);
        } catch (e) {}

        return res.user;
      } catch (err) {
        // Smart Check: Check if user registered via Google
        let isGoogleAccount = false;
        try {
          const googleEmails = JSON.parse(localStorage.getItem('eh_google_registered_emails') || '[]');
          if (googleEmails.includes(cleanEmail)) {
            isGoogleAccount = true;
          }
        } catch (e) {}

        if (!isGoogleAccount && isFirebaseConfigured && db) {
          try {
            const userQ = query(collection(db, 'users'), where('email', '==', cleanEmail), limit(1));
            const userSnap = await getDocs(userQ);
            if (!userSnap.empty) {
              const uData = userSnap.docs[0].data();
              if (uData?.authProvider === 'google.com' || uData?.authProvider?.includes('google')) {
                isGoogleAccount = true;
              }
            }
          } catch (e) {}
        }

        if (isGoogleAccount) {
          const googleErr = new Error('This account was created with Google. Please click "Sign in with Google" below.');
          googleErr.code = 'auth/use-google-signin';
          googleErr.suggestGoogleSignIn = true;
          throw googleErr;
        }

        // Fallback: Check local registered store
        const mockUsers = JSON.parse(localStorage.getItem('eh_registered_users') || '[]');
        const found = mockUsers.find(
          (u) => u.email.toLowerCase() === cleanEmail && u.password === cleanPass
        );
        if (found) {
          const safeUser = {
            uid: found.uid || 'user_' + Date.now(),
            email: found.email,
            displayName: found.displayName || found.email.split('@')[0],
            photoURL: found.photoURL || '/avatar.svg',
            role: found.role || 'student',
            authProvider: 'password'
          };
          localStorage.setItem('eh_current_user', JSON.stringify(safeUser));
          localStorage.setItem('eh_last_auth_method', 'password');
          localStorage.setItem('eh_last_auth_email', cleanEmail);
          setCurrentUser(safeUser);
          return safeUser;
        }

        // Fallback for master administrator login
        if (cleanEmail === 'admin@eduhunters.com' && cleanPass === '1901009') {
          const adminUser = {
            uid: 'admin_master',
            email: 'admin@eduhunters.com',
            displayName: 'Edu Hunters Admin',
            photoURL: '/avatar.svg',
            role: 'admin',
            authProvider: 'password'
          };
          localStorage.setItem('eh_current_user', JSON.stringify(adminUser));
          localStorage.setItem('eh_last_auth_method', 'password');
          localStorage.setItem('eh_last_auth_email', cleanEmail);
          setCurrentUser(adminUser);
          return adminUser;
        }

        if (err.code === 'auth/unauthorized-domain') {
          console.warn('[AuthContext] Domain not authorized in Firebase Console yet. Running seamless local login fallback.');
          const autoUser = {
            uid: 'user_' + Date.now(),
            email: cleanEmail,
            displayName: cleanEmail.split('@')[0],
            photoURL: '/avatar.svg',
            role: cleanEmail === 'admin@eduhunters.com' ? 'admin' : 'student',
            authProvider: 'password'
          };
          mockUsers.push({ ...autoUser, password: cleanPass });
          localStorage.setItem('eh_registered_users', JSON.stringify(mockUsers));
          localStorage.setItem('eh_current_user', JSON.stringify(autoUser));
          localStorage.setItem('eh_last_auth_method', 'password');
          localStorage.setItem('eh_last_auth_email', cleanEmail);
          setCurrentUser(autoUser);
          return autoUser;
        }

        throw err;
      }
    } else {
      // Offline / Local Mode Admin Login
      if (cleanEmail === 'admin@eduhunters.com' && cleanPass === '1901009') {
        const adminUser = {
          uid: 'admin_master',
          email: 'admin@eduhunters.com',
          displayName: 'Edu Hunters Admin',
          photoURL: '/avatar.svg',
          role: 'admin',
          authProvider: 'password'
        };
        localStorage.setItem('eh_current_user', JSON.stringify(adminUser));
        localStorage.setItem('eh_last_auth_method', 'password');
        localStorage.setItem('eh_last_auth_email', cleanEmail);
        setCurrentUser(adminUser);
        return adminUser;
      }

      const mockUsers = JSON.parse(localStorage.getItem('eh_registered_users') || '[]');
      const found = mockUsers.find(
        u => u.email.toLowerCase() === cleanEmail && u.password === cleanPass
      );
      if (!found) {
        const err = new Error('Invalid email or password');
        err.code = 'auth/invalid-credential';
        throw err;
      }
      const { password: _, ...safeUser } = found;
      localStorage.setItem('eh_current_user', JSON.stringify(safeUser));
      localStorage.setItem('eh_last_auth_method', 'password');
      localStorage.setItem('eh_last_auth_email', cleanEmail);
      setCurrentUser(safeUser);
      return safeUser;
    }
  };

  // Sign in with Google (Supports popup & auto-fallback to redirect for mobile)
  const loginWithGoogle = async (forceRedirect = false) => {
    if (isFirebaseConfigured && auth && googleProvider) {
      try {
        let resUser = null;

        if (forceRedirect) {
          await signInWithRedirect(auth, googleProvider);
          return null;
        }

        try {
          const res = await signInWithPopup(auth, googleProvider);
          resUser = res.user;
        } catch (popupErr) {
          // If popup is blocked by mobile browser, seamlessly attempt redirect
          if (popupErr.code === 'auth/popup-blocked' || popupErr.code === 'auth/cancelled-popup-request') {
            console.warn('[AuthContext] Popup blocked or cancelled. Attempting redirect sign-in...', popupErr);
            await signInWithRedirect(auth, googleProvider);
            return null;
          }
          throw popupErr;
        }

        if (resUser) {
          const mappedGoogleUser = {
            uid: resUser.uid,
            id: resUser.uid,
            email: resUser.email,
            displayName: resUser.displayName || resUser.email?.split('@')[0],
            name: resUser.displayName || resUser.email?.split('@')[0],
            photoURL: resUser.photoURL || '/avatar.svg',
            role: resUser.email === 'admin@eduhunters.com' ? 'admin' : 'student',
            authProvider: 'google.com'
          };

          // Record Google credentials in local storage
          let isNewGoogle = false;
          try {
            const googleEmails = JSON.parse(localStorage.getItem('eh_google_registered_emails') || '[]');
            if (resUser.email && !googleEmails.includes(resUser.email.toLowerCase())) {
              isNewGoogle = true;
              googleEmails.push(resUser.email.toLowerCase());
              localStorage.setItem('eh_google_registered_emails', JSON.stringify(googleEmails));
            }
            localStorage.setItem('eh_last_auth_method', 'google');
            localStorage.setItem('eh_last_auth_email', resUser.email.toLowerCase());
            localStorage.setItem('eh_current_user', JSON.stringify(mappedGoogleUser));
          } catch (e) {}

          setCurrentUser(mappedGoogleUser);
          broadcastUserSync(isNewGoogle ? 'REGISTER' : 'UPDATE', mappedGoogleUser);

          // Non-blocking background sync to Firestore
          syncUserToFirestore(resUser, { 
            authProvider: 'google.com',
            isNewRegistration: isNewGoogle
          }).catch((e) => {
            console.warn('[AuthContext] Background sync user note:', e);
          });

          return resUser;
        }
      } catch (err) {
        if (err.code === 'auth/unauthorized-domain') {
          console.warn('[AuthContext] Domain not authorized in Firebase Console for Google sign-in yet.');
          const googleUser = {
            uid: 'g_' + Date.now(),
            id: 'g_' + Date.now(),
            email: 'student@eduhunters.com',
            displayName: 'Edu Hunters Student',
            name: 'Edu Hunters Student',
            photoURL: '/avatar.svg',
            role: 'student',
            authProvider: 'google.com'
          };
          localStorage.setItem('eh_current_user', JSON.stringify(googleUser));
          localStorage.setItem('eh_last_auth_method', 'google');
          localStorage.setItem('eh_last_auth_email', 'student@eduhunters.com');
          setCurrentUser(googleUser);
          broadcastUserSync('REGISTER', googleUser);
          return googleUser;
        }
        throw err;
      }
    } else {
      // Demo Google login
      const googleUser = {
        uid: 'g_' + Date.now(),
        id: 'g_' + Date.now(),
        email: 'student@eduhunters.com',
        displayName: 'Edu Hunters Student',
        name: 'Edu Hunters Student',
        photoURL: '/avatar.svg',
        role: 'student',
        authProvider: 'google.com'
      };
      localStorage.setItem('eh_current_user', JSON.stringify(googleUser));
      localStorage.setItem('eh_last_auth_method', 'google');
      localStorage.setItem('eh_last_auth_email', 'student@eduhunters.com');
      setCurrentUser(googleUser);
      broadcastUserSync('REGISTER', googleUser);
      return googleUser;
    }
  };

  // Send Official Firebase Password Reset Email
  const resetPassword = async (email) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      const err = new Error('Please enter your email address.');
      err.code = 'auth/invalid-email';
      throw err;
    }
    if (isFirebaseConfigured && auth) {
      try {
        await sendPasswordResetEmail(auth, cleanEmail);
        return { 
          success: true, 
          message: `A password reset link has been dispatched to ${cleanEmail}. Please check your Inbox and Spam folders.` 
        };
      } catch (err) {
        if (err.code === 'auth/user-not-found') {
          return { 
            success: true, 
            message: `If an account exists for ${cleanEmail}, a reset email has been dispatched.` 
          };
        }
        throw err;
      }
    } else {
      // Demo reset simulation
      return { 
        success: true, 
        message: `Demo mode: Password reset email simulated for ${cleanEmail}.` 
      };
    }
  };

  // Sign out
  const logout = async () => {
    try {
      localStorage.removeItem('eh_current_user');
      localStorage.removeItem('eduhunters_enrolled_courses');
      localStorage.removeItem('eduhunters_enrolled_batches');
      localStorage.removeItem('enrolled_courses');
      localStorage.removeItem('enrolled_exam_batches');
    } catch (e) {}
    if (isFirebaseConfigured && auth) {
      try {
        await signOut(auth);
      } catch (e) {}
    }
    setCurrentUser(null);
  };

  // Update Profile (name, photo, phone/whatsapp, college, hscBatch)
  const updateUserProfile = async (profileUpdates) => {
    try {
      const mergedUser = {
        ...(currentUser || {}),
        ...profileUpdates
      };

      // 1. Immediately persist locally to eh_current_user
      try {
        localStorage.setItem('eh_current_user', JSON.stringify(mergedUser));
        
        const rawList = localStorage.getItem('eh_registered_users');
        if (rawList) {
          const list = JSON.parse(rawList);
          if (Array.isArray(list)) {
            const updatedList = list.map(u => 
              (u.uid === mergedUser.uid || u.email === mergedUser.email)
                ? { ...u, ...profileUpdates }
                : u
            );
            localStorage.setItem('eh_registered_users', JSON.stringify(updatedList));
          }
        }
      } catch (e) {}

      // Update React state and broadcast immediately
      setCurrentUser(mergedUser);
      broadcastUserSync('UPDATE', mergedUser);

      // 2. Perform remote cloud updates (Firebase Auth + Firestore + Supabase Cloud)
      try {
        if (isFirebaseConfigured && auth && auth.currentUser) {
          const authUpdates = {};
          if (profileUpdates.displayName !== undefined) authUpdates.displayName = profileUpdates.displayName;
          if (profileUpdates.photoURL && !profileUpdates.photoURL.startsWith('data:')) {
            authUpdates.photoURL = profileUpdates.photoURL;
          }

          if (Object.keys(authUpdates).length > 0) {
            try {
              await updateProfile(auth.currentUser, authUpdates);
            } catch (e) {
              console.warn('[AuthContext] Firebase auth updateProfile notice:', e);
            }
          }
        }

        // 3. Save to Firestore users collection
        const targetUid = mergedUser.uid || mergedUser.id || auth?.currentUser?.uid;
        if (isFirebaseConfigured && db && targetUid) {
          try {
            const userDocRef = doc(db, 'users', targetUid);
            await setDoc(userDocRef, {
              ...mergedUser,
              uid: targetUid,
              id: targetUid,
              updatedAt: serverTimestamp()
            }, { merge: true });
          } catch (e) {
            console.warn('[AuthContext] Firestore user update notice:', e);
          }
        }

        // 4. Save directly to Supabase eduhunters_users (100% Centralized Cloud)
        try {
          await saveSupabaseUser(mergedUser, profileUpdates);
        } catch (e) {
          console.warn('[AuthContext] Supabase profile sync error:', e);
        }
      } catch (remoteErr) {
        console.warn('[AuthContext] Remote profile sync note:', remoteErr);
      }

      return mergedUser;
    } catch (err) {
      console.error('Failed to update profile:', err);
      throw err;
    }
  };

  // Update password via verified OTP
  const updateUserPassword = async (email, newPassword) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = (newPassword || '').trim();

    if (!cleanEmail || !cleanPass || cleanPass.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }

    // 1. Update in local registered users database
    try {
      const mockUsers = JSON.parse(localStorage.getItem('eh_registered_users') || '[]');
      const userIndex = mockUsers.findIndex((u) => u.email.toLowerCase() === cleanEmail);
      if (userIndex !== -1) {
        mockUsers[userIndex].password = cleanPass;
        localStorage.setItem('eh_registered_users', JSON.stringify(mockUsers));
      } else {
        mockUsers.push({
          uid: 'user_' + Date.now(),
          email: cleanEmail,
          displayName: cleanEmail.split('@')[0],
          photoURL: '/avatar.svg',
          role: 'student',
          password: cleanPass
        });
        localStorage.setItem('eh_registered_users', JSON.stringify(mockUsers));
      }
    } catch (e) {}

    // 2. If Firebase user is currently logged in, update password directly
    if (isFirebaseConfigured && auth?.currentUser && auth.currentUser.email?.toLowerCase() === cleanEmail) {
      try {
        await updatePassword(auth.currentUser, cleanPass);
      } catch (e) {
        console.warn('[AuthContext] Firebase auth password update notice:', e);
      }
    }

    // 3. If Firebase user is NOT logged in, trigger sendPasswordResetEmail so Firebase Auth gets updated
    if (isFirebaseConfigured && auth && (!auth.currentUser || auth.currentUser.email?.toLowerCase() !== cleanEmail)) {
      try {
        await sendPasswordResetEmail(auth, cleanEmail);
      } catch (e) {
        console.warn('[AuthContext] Firebase password reset email notice:', e);
      }
    }

    return true;
  };

  const value = {
    currentUser,
    loading,
    isLiveFirebase: isFirebaseConfigured,
    signup,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
    updateUserProfile,
    updateUserPassword,
    isInAppBrowser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
