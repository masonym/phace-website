'use client';

import { useState, useEffect } from 'react';

interface AuthUser {
  username: string;
  email: string;
  isAdmin: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        // Fetch the current user from the API
        const response = await fetch('/api/auth/me');
        
        if (!response.ok) {
          // Not authenticated or error
          setUser(null);
          return;
        }
        
        const userData = await response.json();
        setUser(userData);
      } catch (err) {
        console.error('Auth error:', err);
        setError(err instanceof Error ? err.message : 'Authentication error');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    isAdmin: user?.isAdmin || false
  };
}
