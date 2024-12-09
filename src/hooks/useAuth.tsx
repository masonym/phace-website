'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import Cookies from 'js-cookie';

interface AuthError extends Error {
  needsConfirmation?: boolean;
  email?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  getSession: () => Promise<any | null>;
  getIdToken: () => Promise<string | null>;
  getAccessToken: () => Promise<string | null>;
  refreshUser: () => Promise<void>;
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
  refreshUser: async () => {},
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
      const idToken = Cookies.get('idToken');
      if (idToken) {
        // Set initial state from token to avoid flicker
        const decoded = jwtDecode(idToken);
        setUser(decoded);
        setIsAuthenticated(true);
        
        // Fetch fresh user data from Cognito
        const response = await fetch('/api/auth/user', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${await getAccessToken()}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
      setUser(null);
      setIsAuthenticated(false);
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
          const error: AuthError = new Error(data.message || 'Please verify your email before logging in');
          error.needsConfirmation = true;
          error.email = data.email;
          throw error;
        }
        throw new Error(data.error || 'Failed to sign in');
      }

      // Store tokens in cookies
      Cookies.set('idToken', data.idToken, {
        expires: 7, // 7 days
        secure: true,
        sameSite: 'strict'
      });
      
      Cookies.set('accessToken', data.accessToken, {
        expires: 7, // 7 days
        secure: true,
        sameSite: 'strict'
      });

      // Decode token to get user info
      const decoded = jwtDecode(data.idToken);
      setUser(decoded);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signOut = () => {
    Cookies.remove('idToken');
    Cookies.remove('accessToken');
    setUser(null);
    setIsAuthenticated(false);
  };

  const getSession = async () => {
    const idToken = Cookies.get('idToken');
    if (!idToken) return null;
    return jwtDecode(idToken);
  };

  const getIdToken = async () => {
    return Cookies.get('idToken') || null;
  };

  const getAccessToken = async () => {
    return Cookies.get('accessToken') || null;
  };

  const refreshUser = async () => {
    try {
      const response = await fetch('/api/auth/user', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${await getAccessToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to refresh user data');
      }

      const data = await response.json();
      
      // Update user state with the fresh data
      setUser(data.user);
      
      // Update the ID token if provided
      if (data.token) {
        Cookies.set('idToken', data.token, {
          expires: 7,
          secure: true,
          sameSite: 'strict'
        });
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
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
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
