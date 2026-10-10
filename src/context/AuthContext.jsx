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
      return 'No account found with this email. Please sign up first.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Please verify and try again.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in window was closed.';
    case 'auth/popup-blocked':
      return 'Browser blocked the popup window. Please allow popups.';
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
        photoURL: user.photoURL || null,
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
            photoURL: user.photoURL,
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
    if (isFirebaseConfigured && auth) {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) {
        await updateProfile(res.user, { displayName });
      }
      await syncUserToFirestore(res.user, { displayName });
      setCurrentUser({
        uid: res.user.uid,
        email: res.user.email,
        displayName: displayName || res.user.displayName || email.split('@')[0],
        photoURL: res.user.photoURL || null,
        role: email.toLowerCase() === 'admin@eduhunters.com' ? 'admin' : 'student'
      });
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
        photoURL: null,
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

    // 1. Built-in Demo Student credentials
    if (
      (cleanEmail === 'demo@eduhunters.com' || cleanEmail === 'student@eduhunters.com') && 
      (cleanPass === '123456' || cleanPass === 'demo123')
    ) {
      const demoUser = {
        uid: 'demo_student_01',
        email: cleanEmail,
        displayName: 'Demo Student',
        photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
        role: 'student'
      };
      localStorage.setItem('eh_current_user', JSON.stringify(demoUser));
      setCurrentUser(demoUser);
      return demoUser;
    }

    // 2. Built-in Demo Admin credentials
    if (cleanEmail === 'admin@eduhunters.com' && (cleanPass === 'admin123' || cleanPass === '123456')) {
      const adminUser = {
        uid: 'admin_master',
        email: 'admin@eduhunters.com',
        displayName: 'Edu Hunters Admin',
        role: 'admin'
      };
      localStorage.setItem('eh_current_user', JSON.stringify(adminUser));
      setCurrentUser(adminUser);
      return adminUser;
    }

    if (isFirebaseConfigured && auth) {
      const res = await signInWithEmailAndPassword(auth, email, password);
      await syncUserToFirestore(res.user);
      return res.user;
    } else {
      // Demo Mode Login
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
        photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
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

  const value = {
    currentUser,
    loading,
    isLiveFirebase: isFirebaseConfigured,
    signup,
    login,
    loginWithGoogle,
    logout,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
