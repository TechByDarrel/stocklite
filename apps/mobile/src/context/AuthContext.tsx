import { createContext, useContext, useState, useEffect, type PropsWithChildren } from 'react';
import { getDatabase } from '@/db/database';
import { generateSalt, hashPassword, legacyHashPassword } from '@/utils/password';
import { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, firebaseSignOut } from '@/firebase/config';

interface User {
  id: string;
  displayName?: string;
  email: string;
  businessName?: string;
  photoUri?: string;
  firebaseUid?: string;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isSignedIn: boolean;
  signup: (email: string, password: string, businessName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (displayName: string, businessName: string) => Promise<void>;
  updateProfilePhoto: (photoUri: string | null) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Best-effort: signs the local account into Firebase Auth too, so Firestore
// sync has a real authenticated session. Failures here are logged but never
// block local sign-in/signup — the app must keep working fully offline.
async function ensureFirebaseAuth(email: string, password: string, localUserId: string): Promise<string | undefined> {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return credential.user.uid;
  } catch (signInError) {
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      return credential.user.uid;
    } catch (signUpError) {
      console.warn('Firebase Auth unavailable (offline or config issue), continuing with local auth only:', signUpError);
      return undefined;
    }
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const db = await getDatabase();
        const lastUser = await db.getFirstAsync<{ id: string; displayName: string; email: string; businessName: string; photoUri: string | null; firebaseUid: string | null }>(
          `SELECT id, displayName, email, businessName, photoUri, firebaseUid FROM users WHERE lastLoginAt IS NOT NULL ORDER BY lastLoginAt DESC LIMIT 1`
        );

        if (lastUser) {
          setUser({
            id: lastUser.id,
            displayName: lastUser.displayName,
            email: lastUser.email,
            businessName: lastUser.businessName,
            photoUri: lastUser.photoUri || undefined,
            firebaseUid: lastUser.firebaseUid || undefined,
          });
        }
      } catch (error) {
        console.error('Failed to check auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const signup = async (email: string, password: string, businessName: string) => {
    try {
      const db = await getDatabase();
      const userId = `u${Date.now()}`;
      const now = new Date().toISOString();
      const salt = await generateSalt();
      const passwordHash = await hashPassword(password, salt);

      const existing = await db.getFirstAsync<{ id: string }>(
        `SELECT id FROM users WHERE email = ?`,
        [email.toLowerCase()]
      );

      if (existing) {
        throw new Error('Email already registered');
      }

      await db.runAsync(
        `INSERT INTO users (id, displayName, email, passwordHash, businessName, createdAt, lastLoginAt)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, businessName, email.toLowerCase(), passwordHash, businessName, now, now]
      );
      await db.runAsync(`UPDATE users SET passwordSalt = ? WHERE id = ?`, [salt, userId]);

      const firebaseUid = await ensureFirebaseAuth(email.toLowerCase(), password, userId);
      if (firebaseUid) {
        await db.runAsync(`UPDATE users SET firebaseUid = ? WHERE id = ?`, [firebaseUid, userId]);
      }

      setUser({ id: userId, displayName: businessName, email: email.toLowerCase(), businessName, firebaseUid });
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const db = await getDatabase();
      const record = await db.getFirstAsync<{ id: string; displayName: string; email: string; businessName: string; photoUri: string | null; passwordHash: string; passwordSalt: string | null; firebaseUid: string | null }>(
        `SELECT id, displayName, email, businessName, photoUri, passwordHash, passwordSalt, firebaseUid FROM users WHERE email = ?`,
        [email.toLowerCase()]
      );

      if (!record) {
        throw new Error('Invalid email or password');
      }

      let isValid = false;

      if (record.passwordSalt) {
        const attemptedHash = await hashPassword(password, record.passwordSalt);
        isValid = attemptedHash === record.passwordHash;
      } else {
        const legacyHash = legacyHashPassword(password);
        isValid = legacyHash === record.passwordHash;
        if (isValid) {
          const newSalt = await generateSalt();
          const newHash = await hashPassword(password, newSalt);
          await db.runAsync(`UPDATE users SET passwordHash = ?, passwordSalt = ? WHERE id = ?`, [newHash, newSalt, record.id]);
        }
      }

      if (!isValid) {
        throw new Error('Invalid email or password');
      }

      const now = new Date().toISOString();
      await db.runAsync(`UPDATE users SET lastLoginAt = ? WHERE id = ?`, [now, record.id]);

      let firebaseUid = record.firebaseUid || undefined;
      if (!firebaseUid) {
        firebaseUid = await ensureFirebaseAuth(email.toLowerCase(), password, record.id);
        if (firebaseUid) {
          await db.runAsync(`UPDATE users SET firebaseUid = ? WHERE id = ?`, [firebaseUid, record.id]);
        }
      } else {
        await ensureFirebaseAuth(email.toLowerCase(), password, record.id);
      }

      setUser({
        id: record.id,
        displayName: record.displayName,
        email: record.email,
        businessName: record.businessName,
        photoUri: record.photoUri || undefined,
        firebaseUid,
      });
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (user) {
        const db = await getDatabase();
        await db.runAsync(`UPDATE users SET lastLoginAt = NULL WHERE id = ?`, [user.id]);
      }
      try {
        await firebaseSignOut(auth);
      } catch (error) {
        console.warn('Firebase sign-out skipped:', error);
      }
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  };

  const updateProfile = async (displayName: string, businessName: string) => {
    if (!user) throw new Error('You must be signed in to update your profile');
    const db = await getDatabase();
    await db.runAsync('UPDATE users SET displayName = ?, businessName = ? WHERE id = ?', [displayName, businessName, user.id]);
    setUser((current) => current ? { ...current, displayName, businessName } : current);
  };

  const updateProfilePhoto = async (photoUri: string | null) => {
    if (!user) throw new Error('You must be signed in to update your profile');
    const db = await getDatabase();
    await db.runAsync('UPDATE users SET photoUri = ? WHERE id = ?', [photoUri, user.id]);
    setUser((current) => current ? { ...current, photoUri: photoUri || undefined } : current);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isSignedIn: user !== null,
        signup,
        login,
        logout,
        updateProfile,
        updateProfilePhoto,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}