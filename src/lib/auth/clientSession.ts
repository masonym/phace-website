'use client';

import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

const COOKIE_OPTIONS = { secure: true, sameSite: 'strict' as const };
// Cognito ID tokens last an hour; refresh a minute early so requests never carry a dying token
const EXPIRY_MARGIN_MS = 60 * 1000;

interface SessionTokens {
    idToken: string;
    accessToken: string;
    refreshToken?: string;
}

export function storeSessionTokens({ idToken, accessToken, refreshToken }: SessionTokens) {
    Cookies.set('idToken', idToken, { ...COOKIE_OPTIONS, expires: 7 });
    Cookies.set('accessToken', accessToken, { ...COOKIE_OPTIONS, expires: 7 });
    if (refreshToken) {
        // Matches Cognito's default refresh token lifetime
        Cookies.set('refreshToken', refreshToken, { ...COOKIE_OPTIONS, expires: 30 });
    }
    // Admin API routes also accept this cookie, so keep it in step with the ID token
    if (Cookies.get('adminToken')) {
        Cookies.set('adminToken', idToken, { ...COOKIE_OPTIONS, expires: 7 });
    }
}

export function setAdminToken(idToken: string) {
    Cookies.set('adminToken', idToken, { ...COOKIE_OPTIONS, expires: 7 });
}

export function clearSessionTokens() {
    Cookies.remove('idToken');
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    Cookies.remove('adminToken', { path: '/' });
}

function isFresh(token: string): boolean {
    try {
        const { exp } = jwtDecode(token);
        return !!exp && exp * 1000 - EXPIRY_MARGIN_MS > Date.now();
    } catch {
        return false;
    }
}

let refreshInFlight: Promise<string | null> | null = null;

async function refreshIdToken(): Promise<string | null> {
    const refreshToken = Cookies.get('refreshToken');
    if (!refreshToken) return null;

    try {
        const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
        });
        if (!response.ok) return null;

        const data = await response.json();
        storeSessionTokens({ idToken: data.idToken, accessToken: data.accessToken });
        return data.idToken;
    } catch (error) {
        console.error('Failed to refresh session:', error);
        return null;
    }
}

/**
 * Returns a non-expired ID token, refreshing it with the refresh token when needed.
 * Returns null when there is no session or it can no longer be refreshed.
 */
export async function getFreshIdToken(): Promise<string | null> {
    const idToken = Cookies.get('idToken');
    if (idToken && isFresh(idToken)) return idToken;

    // Several components can ask at once; share one refresh request
    if (!refreshInFlight) {
        refreshInFlight = refreshIdToken().finally(() => {
            refreshInFlight = null;
        });
    }
    return refreshInFlight;
}

/**
 * fetch() for admin API routes: attaches a fresh ID token and sends the user
 * back to the admin login when the session can't be renewed.
 */
export async function adminFetch(input: string, init: RequestInit = {}): Promise<Response> {
    const token = await getFreshIdToken();
    if (!token) {
        redirectToAdminLogin();
        throw new Error('Your session has expired. Please sign in again.');
    }

    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${token}`);
    if (init.body && typeof init.body === 'string' && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(input, { ...init, headers });
    if (response.status === 401) {
        redirectToAdminLogin();
    }
    return response;
}

function redirectToAdminLogin() {
    if (typeof window !== 'undefined' && window.location.pathname !== '/admin/login') {
        window.location.href = '/admin/login';
    }
}
