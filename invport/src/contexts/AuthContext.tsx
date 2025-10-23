'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { safeLocalStorage } from '@/lib/safeStorage';
import { safeResponseJson } from '@/lib/safeJson';

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

  useEffect(() => {
    // Check for existing auth token
    const checkAuth = async () => {
      try {
        // Check if localStorage is available (client-side)
        if (typeof window !== 'undefined') {
          const token = safeLocalStorage.getItem('auth_token');
          if (token) {
            // Validate token with backend
            try {
              const response = await fetch('/api/auth/validate', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                }
              });
              
              if (response.ok) {
                const userData = await safeResponseJson<{user: User}>(response);
                setUser(userData.user);
              } else {
                // Invalid token, remove it
                safeLocalStorage.removeItem('auth_token');
              }
            } catch (error) {
              console.error('Token validation failed:', error);
              safeLocalStorage.removeItem('auth_token');
            }
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const result = await safeResponseJson<{token: string, user: User}>(response);
      const token = result.token;
      const userData = result.user;
      
      if (typeof window !== 'undefined') {
        safeLocalStorage.setItem('auth_token', token);
      }
      setUser(userData);
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
        safeLocalStorage.removeItem('auth_token');
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