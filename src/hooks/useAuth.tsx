'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import Cookies from 'js-cookie';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  getSession: () => Promise<any | null>;
  getIdToken: () => Promise<string | null>;
  getAccessToken: () => Promise<string | null>;
}

export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  signIn: async (email: string, password: string) => {},
  signOut: () => {},
  getSession: async () => null,
  getIdToken: async () => null,
  getAccessToken: async () => null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const token = Cookies.get('token');
      if (token) {
        const decoded = jwtDecode(token);
        setUser(decoded);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // If user is not confirmed, throw a specific error with the email
        if (data.needsConfirmation) {
          const error = new Error(data.message || 'Please verify your email before logging in');
          error.needsConfirmation = true;
          error.email = data.email;
          throw error;
        }
        throw new Error(data.error || 'Failed to sign in');
      }

      // Store token in cookie
      Cookies.set('token', data.token, {
        expires: 7, // 7 days
        secure: true,
        sameSite: 'strict'
      });

      // Decode token to get user info
      const decoded = jwtDecode(data.token);
      setUser(decoded);
      setIsAuthenticated(true);
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signOut = () => {
    Cookies.remove('token');
    setUser(null);
    setIsAuthenticated(false);
  };

  const getSession = async () => {
    const token = Cookies.get('token');
    if (!token) return null;
    return jwtDecode(token);
  };

  const getIdToken = async () => {
    return Cookies.get('token') || null;
  };

  const getAccessToken = async () => {
    return Cookies.get('token') || null;
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        signIn,
        signOut,
        getSession,
        getIdToken,
        getAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
