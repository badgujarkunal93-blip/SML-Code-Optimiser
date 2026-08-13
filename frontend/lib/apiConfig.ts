/**
 * Centralized API URL configuration for Optima AI frontend.
 *
 * - Automatically detects local execution vs production deployment:
 *   - Localhost (localhost:3000 / 127.0.0.1): connects to http://localhost:3001
 *   - Production Deployment (Vercel / Render): connects to NEXT_PUBLIC_API_URL or https://sml-code-optimiser.onrender.com
 */

export function getApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && envUrl.trim().length > 0) {
    return envUrl.replace(/\/$/, '');
  }

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3001';
    }
    return 'https://sml-code-optimiser.onrender.com';
  }

  if (process.env.NODE_ENV === 'production') {
    return 'https://sml-code-optimiser.onrender.com';
  }

  return 'http://localhost:3001';
}

export const API_BASE_URL = getApiBaseUrl();

/**
 * Returns true if the API base URL is configured and usable.
 */
export function isApiConfigured(): boolean {
  return true;
}
