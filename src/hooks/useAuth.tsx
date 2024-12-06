'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { 
  CognitoIdentityProviderClient, 
  InitiateAuthCommand,
  RespondToAuthChallengeCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import Cookies from 'js-cookie';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any | null;
  signIn: (email: string, password: string, newPassword?: string) => Promise<void>;
  signOut: () => void;
  getSession: () => Promise<any | null>;
}

const cognitoClient = new CognitoIdentityProviderClient({ 
  region: "us-west-2",
});

export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  signIn: async (email: string, password: string, newPassword?: string) => {},
  signOut: () => {},
  getSession: async () => null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any | null>(null);
  const [session, setSession] = useState<any | null>(null);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const token = Cookies.get('adminToken');
      if (token) {
        setIsAuthenticated(true);
        // You might want to verify the token here
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('Auth state check failed:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const getSession = async () => {
    return Cookies.get('adminToken');
  };

  const signIn = async (email: string, password: string, newPassword?: string) => {
    try {
      console.log('Attempting to sign in with:', {
        email,
        clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
        hasNewPassword: !!newPassword
      });

      if (session && newPassword) {
        // Extract the username from email (remove @domain.com)
        const username = email.split('@')[0];
        
        // Handle new password challenge
        const challengeResponse = new RespondToAuthChallengeCommand({
          ClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
          ChallengeName: "NEW_PASSWORD_REQUIRED",
          Session: session,
          ChallengeResponses: {
            USERNAME: email,
            NEW_PASSWORD: newPassword,
            "userAttributes.name": username,
          }
        });

        console.log('Sending challenge response...');
        const response = await cognitoClient.send(challengeResponse);
        console.log('Challenge response:', response);

        if (response.AuthenticationResult) {
          const { IdToken } = response.AuthenticationResult;
          // Set the token in a cookie that matches the middleware expectations
          Cookies.set('adminToken', IdToken, { 
            expires: 7, // 7 days
            path: '/',
            secure: true,
            sameSite: 'strict'
          });
          setIsAuthenticated(true);
          setUser({ email });
          setSession(null);
          return;
        }
      }

      const command = new InitiateAuthCommand({
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
        },
      });

      console.log('Sending auth command...');
      const response = await cognitoClient.send(command);
      console.log('Auth response:', response);
      
      if (response.AuthenticationResult) {
        console.log('Authentication successful');
        const { IdToken } = response.AuthenticationResult;
        // Set the token in a cookie that matches the middleware expectations
        Cookies.set('adminToken', IdToken, { 
          expires: 7, // 7 days
          path: '/',
          secure: true,
          sameSite: 'strict'
        });
        setIsAuthenticated(true);
        setUser({ email });
        setSession(null);
        return Promise.resolve();
      } else if (response.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
        console.log('New password required');
        setSession(response.Session);
        throw new Error('NEW_PASSWORD_REQUIRED');
      } else {
        console.error('No authentication result:', response);
        throw new Error('Authentication failed');
      }
    } catch (error: any) {
      console.error('Sign in failed:', {
        error,
        name: error.name,
        message: error.message,
        stack: error.stack,
        details: error.$metadata,
      });
      throw error;
    }
  };

  const signOut = () => {
    try {
      Cookies.remove('adminToken', { path: '/' });
      setIsAuthenticated(false);
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Sign out failed:', error);
      // Still clear the state even if signOut fails
      setIsAuthenticated(false);
      setUser(null);
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
