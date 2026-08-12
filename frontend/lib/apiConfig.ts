/**
 * Centralized API URL configuration for Optima AI frontend.
 *
 * - Production: NEXT_PUBLIC_API_URL must be set to the deployed backend HTTPS URL.
 *   Falls back to empty string if missing (fetch calls will fail with clear errors).
 * - Development: Falls back to http://localhost:3001.
 */

function getApiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL;

  if (process.env.NODE_ENV === 'production') {
    if (!url || url.includes('localhost') || url.includes('127.0.0.1')) {
      console.error(
        '[Optima AI] CRITICAL: NEXT_PUBLIC_API_URL is not configured for production deployment. ' +
        'All backend API calls will fail. Set this environment variable in Vercel to your deployed backend HTTPS URL.'
      );
      // Return empty string — individual fetch calls will fail with descriptive errors
      return '';
    }

    if (!url.startsWith('https://')) {
      console.warn(
        '[Optima AI] WARNING: NEXT_PUBLIC_API_URL should use HTTPS in production to avoid mixed-content errors. ' +
        `Current value: ${url}`
      );
    }

    return url.replace(/\/$/, '');
  }

  // Development fallback
  return (url || 'http://localhost:3001').replace(/\/$/, '');
}

export const API_BASE_URL = getApiBaseUrl();

/**
 * Returns true if the API base URL is configured and usable.
 * Use this to show connection status indicators in the UI.
 */
export function isApiConfigured(): boolean {
  return API_BASE_URL.length > 0;
}
