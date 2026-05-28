/**
 * Centralized API base URL.
 * - In development: dynamically resolves to the accessing machine's hostname on port 5000.
 * - In production: reads from VITE_API_URL environment variable.
 */
const getApiUrl = (): string => {
  // If explicitly configured in environment, use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL as string;
  }
  
  // In development, dynamically target the same host but on port 5000
  // This allows any mobile or LAN device accessing the dev server to connect seamlessly
  if (import.meta.env.DEV && typeof window !== 'undefined' && window.location) {
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:5000`;
  }
  
  // Fallback / Production default
  return 'http://localhost:5000';
};

const API_URL: string = getApiUrl();

export default API_URL;
