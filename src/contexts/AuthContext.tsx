import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { authenticateUser, saveUserSession, getUserSession, clearUserSession, type User } from '../lib/auth';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (email: string, password: string) => {
    const user = await authenticateUser(email, password);
    if (user) {
      setCurrentUser(user);
      saveUserSession(user);
    } else {
      throw new Error('Invalid email or password');
    }
  };

  const logout = async () => {
    setCurrentUser(null);
    clearUserSession();
  };

  useEffect(() => {
    // Check for existing session on mount
    const savedUser = getUserSession();
    if (savedUser) {
      setCurrentUser(savedUser);
    }
    setLoading(false);
  }, []);

  const value = {
    currentUser,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
