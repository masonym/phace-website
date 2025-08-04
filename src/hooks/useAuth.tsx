'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import Cookies from 'js-cookie';

interface AuthError extends Error {
  needsConfirmation?: boolean;
  needsNewPassword?: boolean;
  email?: string;
  session?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  user: any | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  getSession: () => Promise<any | null>;
  getIdToken: () => Promise<string | null>;
  getAccessToken: () => Promise<string | null>;
  refreshUser: () => Promise<void>;
  changePassword: (email: string, oldPassword: string, newPassword: string) => Promise<void>;
  setNewPassword: (email: string, newPassword: string, session: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  isAdmin: false,
  user: null,
  signIn: async (email: string, password: string) => {},
  signOut: () => {},
  getSession: async () => null,
  getIdToken: async () => null,
  getAccessToken: async () => null,
  refreshUser: async () => {},
  changePassword: async (email: string, oldPassword: string, newPassword: string) => {},
  setNewPassword: async (email: string, newPassword: string, session: string) => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const idToken = Cookies.get('idToken');
      const adminToken = Cookies.get('adminToken');
      
      if (idToken) {
        // Set initial state from token to avoid flicker
        const decoded = jwtDecode(idToken);
        setUser(decoded);
        setIsAuthenticated(true);
        
        // If we have an admin token, set admin status immediately
        if (adminToken) {
          setIsAdmin(true);
        }
        
        // Verify admin status in the background
        try {
          const adminResponse = await fetch('/api/admin/auth', {
            headers: {
              'Authorization': `Bearer ${idToken}`
            }
          });

          if (adminResponse.ok) {
            setIsAdmin(true);
            // Refresh admin token
            Cookies.set('adminToken', idToken, {
              expires: 7,
              secure: true,
              sameSite: 'strict'
            });
          } else {
            setIsAdmin(false);
            Cookies.remove('adminToken');
          }
        } catch (error) {
          console.error('Admin check error:', error);
          setIsAdmin(false);
          Cookies.remove('adminToken');
        }
        
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
      setIsAdmin(false);
      Cookies.remove('adminToken');
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
        if (data.needsConfirmation) {
          const error: AuthError = new Error(data.message || 'Please verify your email before logging in');
          error.needsConfirmation = true;
          error.email = data.email;
          throw error;
        }
        throw new Error(data.error || 'Failed to sign in');
      }

      // Check if user needs to set a new password (temporary password)
      if (data.needsNewPassword) {
        const error: AuthError = new Error(data.message || 'You must set a new password before you can sign in');
        error.needsNewPassword = true;
        error.email = data.email;
        error.session = data.session;
        throw error;
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

      // Check admin status
      try {
        const adminResponse = await fetch('/api/admin/auth', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${data.idToken}`
          }
        });

        if (adminResponse.ok) {
          setIsAdmin(true);
          // Set admin token cookie
          Cookies.set('adminToken', data.idToken, {
            expires: 7,
            secure: true,
            sameSite: 'strict'
          });
        } else {
          setIsAdmin(false);
          Cookies.remove('adminToken');
        }
      } catch (error) {
        console.error('Admin check error:', error);
        setIsAdmin(false);
        Cookies.remove('adminToken');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const changePassword = async (email: string, oldPassword: string, newPassword: string) => {
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, oldPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      // After password change, sign in with the new password
      await signIn(email, newPassword);
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  };

  const setNewPassword = async (email: string, newPassword: string, session: string) => {
    try {
      const response = await fetch('/api/auth/set-new-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, newPassword, session }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to set new password');
      }

      // Store tokens in cookies after successful password change
      Cookies.set('idToken', data.idToken, {
        expires: 7,
        secure: true,
        sameSite: 'strict'
      });
      
      Cookies.set('accessToken', data.accessToken, {
        expires: 7,
        secure: true,
        sameSite: 'strict'
      });

      // Decode token to get user info
      const decoded = jwtDecode(data.idToken);
      setUser(decoded);
      setIsAuthenticated(true);

      // Check admin status
      try {
        const adminResponse = await fetch('/api/admin/auth', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${data.idToken}`
          }
        });

        if (adminResponse.ok) {
          setIsAdmin(true);
          Cookies.set('adminToken', data.idToken, {
            expires: 7,
            secure: true,
            sameSite: 'strict'
          });
        } else {
          setIsAdmin(false);
          Cookies.remove('adminToken');
        }
      } catch (error) {
        console.error('Admin check error:', error);
        setIsAdmin(false);
        Cookies.remove('adminToken');
      }
    } catch (error) {
      console.error('Set new password error:', error);
      throw error;
    }
  };

  const signOut = () => {
    Cookies.remove('idToken');
    Cookies.remove('accessToken');
    Cookies.remove('adminToken');
    setUser(null);
    setIsAuthenticated(false);
    setIsAdmin(false);
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
        isAdmin,
        user,
        signIn,
        signOut,
        getSession,
        getIdToken,
        getAccessToken,
        refreshUser,
        changePassword,
        setNewPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
