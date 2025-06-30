import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getSettings } from '@/api/settings';

interface User {
  _id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on app start
    const token = localStorage.getItem('accessToken');
    if (token) {
      // In a real app, you might want to validate the token with the server
      // For now, we'll just check if the token exists
      try {
        // You could decode the JWT here to get user info
        // Instead, fetch user settings to get the full name
        getSettings().then(settings => {
          setUser({
            _id: 'current-user',
            email: settings.profile.email,
            name: settings.profile.name
          });
        }).catch(() => {
          setUser({ _id: 'current-user', email: 'user@example.com' });
        });
      } catch (error) {
        console.error('Error checking auth status:', error);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    }
    setIsLoading(false);
  }, []);

  const value: AuthContextType = {
    user,
    setUser,
    isAuthenticated: !!user,
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}