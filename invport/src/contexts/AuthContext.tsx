'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mock user for development - wrapped in useMemo to prevent recreation
  const mockUser: User = useMemo(() => ({
    id: '1',
    email: 'admin@fuhrenterprises.com',
    name: 'Admin User',
    role: 'Administrator',
  }), []);

  useEffect(() => {
    // Simulate checking for existing auth token
    const checkAuth = async () => {
      try {
        // Check if localStorage is available (client-side)
        if (typeof window !== 'undefined') {
          // TODO: Replace with actual token validation
          const token = localStorage.getItem('auth_token');
          if (token) {
            // TODO: Validate token with backend
            setUser(mockUser);
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [mockUser]);  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // TODO: Implement actual authentication
      console.log('Signing in with:', email, password);
      
      // Mock successful login
      const token = 'mock_jwt_token';
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', token);
      }
      setUser(mockUser);
    } catch (error) {
      console.error('Sign in failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      // TODO: Revoke tokens with backend
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
      }
      setUser(null);
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};