import { createContext, useContext, useState, useEffect, type PropsWithChildren } from 'react';
import { getDatabase } from '@/db/database';

interface User {
  id: string;
  displayName?: string;
  email: string;
  businessName?: string;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isSignedIn: boolean;
  signup: (email: string, password: string, businessName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (displayName: string, businessName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Simple password hashing using base64 (NOT SECURE - for development only)
// In production, this should be done on the backend with proper bcrypt/argon2
function hashPassword(password: string): string {
  // Simple base64 encoding - NOT SECURE, but works in React Native without external deps
  let result = '';
  for (let i = 0; i < password.length; i++) {
    result += String.fromCharCode(password.charCodeAt(i) ^ (i % 256));
  }
  return btoa(result);
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const db = await getDatabase();

        // Try to get the last logged in user (in a real app, this would be stored in secure storage)
        const lastUser = await db.getFirstAsync<{ id: string; displayName: string; email: string; businessName: string }>(
          `SELECT id, displayName, email, businessName FROM users WHERE lastLoginAt IS NOT NULL ORDER BY lastLoginAt DESC LIMIT 1`
        );

        if (lastUser) {
          setUser({
            id: lastUser.id,
            displayName: lastUser.displayName,
            email: lastUser.email,
            businessName: lastUser.businessName,
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
      const passwordHash = hashPassword(password);

      // Check if user already exists
      const existing = await db.getFirstAsync<{ id: string }>(
        `SELECT id FROM users WHERE email = ?`,
        [email.toLowerCase()]
      );

      if (existing) {
        throw new Error('Email already registered');
      }

      // Create new user
      await db.runAsync(
        `INSERT INTO users (id, displayName, email, passwordHash, businessName, createdAt, lastLoginAt)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, businessName, email.toLowerCase(), passwordHash, businessName, now, now]
      );

      setUser({ id: userId, displayName: businessName, email: email.toLowerCase(), businessName });
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const db = await getDatabase();
      const passwordHash = hashPassword(password);

      // Find user with matching email and password
      const user = await db.getFirstAsync<{ id: string; displayName: string; email: string; businessName: string }>(
        `SELECT id, displayName, email, businessName FROM users WHERE email = ? AND passwordHash = ?`,
        [email.toLowerCase(), passwordHash]
      );

      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Update last login time
      const now = new Date().toISOString();
      await db.runAsync(`UPDATE users SET lastLoginAt = ? WHERE id = ?`, [now, user.id]);

      setUser({
        id: user.id,
        displayName: user.displayName,
        email: user.email,
        businessName: user.businessName,
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
