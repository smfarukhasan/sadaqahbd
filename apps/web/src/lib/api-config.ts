/**
 * Dynamic API Base URL resolver.
 * Handles localhost, 127.0.0.1, local network IP (e.g. 192.168.0.27 or 192.168.0.106),
 * and production environment URLs automatically.
 *
 * NOTE: Uses 127.0.0.1 instead of 'localhost' to prevent Windows Chrome/Edge IPv6 (::1)
 * connection refused errors with IPv4-bound backend services.
 */
export function getApiUrl(): string {
  const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');

  if (typeof window !== 'undefined' && window.location?.hostname) {
    const hostname = window.location.hostname;
    // Localhost / loopback: always use 127.0.0.1 to avoid Windows IPv6 resolution issues
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://127.0.0.1:4000/api/v1';
    }
    // LAN numeric IP (e.g. 192.168.0.106): route to the same host on port 4000
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
      return `http://${hostname}:4000/api/v1`;
    }
    // If NEXT_PUBLIC_API_URL is configured and points to a remote/production endpoint, use it
    if (configuredApiUrl && !configuredApiUrl.includes('localhost') && !configuredApiUrl.includes('127.0.0.1')) {
      return configuredApiUrl;
    }
    // Production domain
    if (hostname.includes('sadaqahbd.com')) {
      return 'https://api.sadaqahbd.com/api/v1';
    }
    // If on HTTPS, avoid mixed-content blocked HTTP calls
    if (window.location.protocol === 'https:') {
      return 'https://api.sadaqahbd.com/api/v1';
    }
    // Development fallback for custom local domains/hosts
    return `http://${hostname}:4000/api/v1`;
  }

  if (configuredApiUrl) {
    return configuredApiUrl;
  }

  return 'http://127.0.0.1:4000/api/v1';
}
