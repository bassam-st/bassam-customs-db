/**
 * سياق المصادقة - يوفر حالة المستخدم لكامل التطبيق
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import type { AppUser } from '../types/user';
import { onAuthChange, fetchUserData, updateLastSeen } from '../lib/auth';

interface AuthContextType {
  firebaseUser: User | null;
  appUser: AppUser | null;
  loading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  firebaseUser: null,
  appUser: null,
  loading: true,
  error: null,
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = async () => {
    if (!firebaseUser) return;
    try {
      const data = await fetchUserData(firebaseUser.uid);
      setAppUser(data);
    } catch (e) {
      console.error('Error refreshing user', e);
    }
  };

  useEffect(() => {
    const unsub = onAuthChange(async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          const data = await fetchUserData(user.uid);
          setAppUser(data);
          // تحديث آخر ظهور في الخلفية
          updateLastSeen(user.uid).catch(() => {});
        } catch (e) {
          setError('خطأ في تحميل بيانات المستخدم');
          console.error(e);
        }
      } else {
        setAppUser(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <AuthContext.Provider value={{ firebaseUser, appUser, loading, error, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
