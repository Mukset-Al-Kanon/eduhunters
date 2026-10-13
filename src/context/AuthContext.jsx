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
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Format Firebase errors into clean, professional messages
export function formatAuthError(error) {
  if (!error) return 'An unexpected error occurred. Please try again.';
  const code = error.code || '';
  
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account already exists with this email address. Please sign in.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password is too weak. Please enter at least 6 characters.';
    case 'auth/user-not-found':
      return 'No account found with this email. Please check your email or sign up.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Please verify and try again.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in window was closed.';
    case 'auth/popup-blocked':
      return 'Browser blocked the popup window. Please allow popups for this site.';
    case 'auth/cancelled-popup-request':
      return 'Only one sign-in window can be open at a time.';
    case 'auth/unauthorized-domain':
      return 'This website domain is not authorized yet in Firebase Console. Please add this domain under Firebase Authentication > Settings > Authorized domains.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is currently not enabled in Firebase Console. Please enable it in Authentication settings.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email using a different sign-in method.';
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
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLiveFirebase, setIsLiveFirebase] = useState(isFirebaseConfigured);

  // Sync user profile data to Firestore (if configured)
  const syncUserToFirestore = async (user, additionalData = {}) => {
    if (!db || !user?.uid) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      const baseUserData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || additionalData.displayName || user.email?.split('@')[0],
        photoURL: user.photoURL || additionalData.photoURL || '/avatar.png',
        role: additionalData.role || (userSnap.exists() ? userSnap.data().role : 'student'),
        lastLoginAt: serverTimestamp(),
        ...additionalData
      };

      if (!userSnap.exists()) {
        baseUserData.createdAt = serverTimestamp();
        baseUserData.enrolledCourses = [];
        baseUserData.registeredDevices = [
          {
            id: 'dev_' + Math.random().toString(36).substring(2, 9),
            name: navigator.userAgent.includes('Windows') ? 'Windows • Browser' : 'Mobile / Device',
            browser: navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Browser',
            deviceType: /Mobi|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
            isCurrent: true,
            isActive: true,
            firstSeenAt: new Date().toISOString()
          }
        ];
      }

      await setDoc(userRef, baseUserData, { merge: true });
    } catch (err) {
      console.warn('[AuthContext] Firestore sync skipped or failed (Check security rules):', err);
    }
  };

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
            photoURL: user.photoURL || '/avatar.png',
            role: user.email === 'admin@eduhunters.com' ? 'admin' : 'student'
          };

          if (db) {
            try {
              const snap = await getDoc(doc(db, 'users', user.uid));
              if (snap.exists()) {
                enrichedUser = { ...enrichedUser, ...snap.data() };
              }
            } catch (e) {
              // Ignore firestore permission error during initial auth
            }
          }

          setCurrentUser(enrichedUser);
        } else {
          // Check if local demo user is stored
          try {
            const saved = localStorage.getItem('eh_current_user');
            if (saved) {
              const parsed = JSON.parse(saved);
              if (parsed?.uid?.startsWith('demo_') || parsed?.uid === 'admin_master') {
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
      // Local/Demo Mode Fallback
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

  // Sign up with Email and Password
  const signup = async (email, password, displayName) => {
    const defaultAvatar = '/avatar.png';
    if (isFirebaseConfigured && auth) {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(res.user, {
        displayName: displayName || email.split('@')[0],
        photoURL: defaultAvatar
      });
      await syncUserToFirestore(res.user, { displayName, photoURL: defaultAvatar });
      const createdUser = {
        uid: res.user.uid,
        email: res.user.email,
        displayName: displayName || res.user.displayName || email.split('@')[0],
        photoURL: defaultAvatar,
        role: email.toLowerCase() === 'admin@eduhunters.com' ? 'admin' : 'student'
      };
      setCurrentUser(createdUser);
      return res.user;
    } else {
      // Demo Mode Sign up
      const mockUsers = JSON.parse(localStorage.getItem('eh_registered_users') || '[]');
      if (mockUsers.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        const err = new Error('Email already registered');
        err.code = 'auth/email-already-in-use';
        throw err;
      }
      const newUser = {
        uid: 'user_' + Date.now(),
        email,
        displayName: displayName || email.split('@')[0],
        photoURL: defaultAvatar,
        role: email.toLowerCase() === 'admin@eduhunters.com' ? 'admin' : 'student',
        createdAt: new Date().toISOString()
      };
      mockUsers.push({ ...newUser, password });
      localStorage.setItem('eh_registered_users', JSON.stringify(mockUsers));
      localStorage.setItem('eh_current_user', JSON.stringify(newUser));
      setCurrentUser(newUser);
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
        await syncUserToFirestore(res.user);
        return res.user;
      } catch (err) {
        // Fallback for master administrator demo login if Firebase admin account isn't seeded yet
        if (cleanEmail === 'admin@eduhunters.com' && (cleanPass === 'admin123' || cleanPass === '123456')) {
          const adminUser = {
            uid: 'admin_master',
            email: 'admin@eduhunters.com',
            displayName: 'Edu Hunters Admin',
            photoURL: '/avatar.png',
            role: 'admin'
          };
          localStorage.setItem('eh_current_user', JSON.stringify(adminUser));
          setCurrentUser(adminUser);
          return adminUser;
        }
        throw err;
      }
    } else {
      // Offline / Local Demo Mode Login
      if (cleanEmail === 'admin@eduhunters.com' && (cleanPass === 'admin123' || cleanPass === '123456')) {
        const adminUser = {
          uid: 'admin_master',
          email: 'admin@eduhunters.com',
          displayName: 'Edu Hunters Admin',
          photoURL: '/avatar.png',
          role: 'admin'
        };
        localStorage.setItem('eh_current_user', JSON.stringify(adminUser));
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
      setCurrentUser(safeUser);
      return safeUser;
    }
  };

  // Sign in with Google
  const loginWithGoogle = async () => {
    if (isFirebaseConfigured && auth && googleProvider) {
      const res = await signInWithPopup(auth, googleProvider);
      await syncUserToFirestore(res.user);
      return res.user;
    } else {
      // Demo Google login
      const googleUser = {
        uid: 'g_' + Date.now(),
        email: 'student@gmail.com',
        displayName: 'Edu Hunter Scholar',
        photoURL: '/avatar.png',
        role: 'student'
      };
      localStorage.setItem('eh_current_user', JSON.stringify(googleUser));
      setCurrentUser(googleUser);
      return googleUser;
    }
  };

  // Send Password Reset Email
  const resetPassword = async (email) => {
    if (!email) {
      const err = new Error('Missing email');
      err.code = 'auth/invalid-email';
      throw err;
    }
    if (isFirebaseConfigured && auth) {
      return await sendPasswordResetEmail(auth, email);
    } else {
      // Demo reset simulation
      return true;
    }
  };

  // Sign out
  const logout = async () => {
    try {
      localStorage.removeItem('eh_current_user');
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

      // 1. Firebase Auth Profile Update (displayName & photoURL)
      if (isFirebaseConfigured && auth && auth.currentUser) {
        const authUpdates = {};
        if (profileUpdates.displayName !== undefined) authUpdates.displayName = profileUpdates.displayName;
        if (profileUpdates.photoURL !== undefined) authUpdates.photoURL = profileUpdates.photoURL;

        if (Object.keys(authUpdates).length > 0) {
          try {
            await updateProfile(auth.currentUser, authUpdates);
          } catch (e) {
            console.warn('[AuthContext] Firebase auth updateProfile notice:', e);
          }
        }

        // Firestore sync for extra fields: phone, whatsapp, college, hscBatch, etc.
        if (db && currentUser?.uid) {
          try {
            const userRef = doc(db, 'users', currentUser.uid);
            await setDoc(userRef, {
              ...profileUpdates,
              updatedAt: serverTimestamp()
            }, { merge: true });
          } catch (e) {
            console.warn('[AuthContext] Firestore sync notice:', e);
          }
        }
      }

      // 2. Persist locally to eh_current_user
      try {
        localStorage.setItem('eh_current_user', JSON.stringify(mergedUser));
        
        // Also update local registered user list if present
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

      // 3. Update React state
      setCurrentUser(mergedUser);
      
      // 4. Trigger storage / global event for other components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('eh_profile_updated', { detail: mergedUser }));
      }

      return mergedUser;
    } catch (err) {
      console.error('Failed to update profile:', err);
      throw err;
    }
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
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
