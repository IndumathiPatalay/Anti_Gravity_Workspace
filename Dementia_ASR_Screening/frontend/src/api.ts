/**
 * Centralized API base URL.
 * - In local development/LAN testing: dynamically resolves to the accessing machine's IP on port 5000.
 * - In production (Vercel): reads from VITE_API_URL environment variable.
 */
const getApiUrl = (): string => {
  // If explicitly configured in environment, use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL as string;
  }
  
  // Otherwise, dynamically construct based on how the user is accessing the app.
  // This allows mobile devices on the same Wi-Fi network to connect seamlessly!
  if (typeof window !== 'undefined' && window.location) {
    const { protocol, hostname } = window.location;
    
    // If accessed via localhost, loopback, or a standard LAN IP range
    if (
      hostname === 'localhost' || 
      hostname === '127.0.0.1' || 
      hostname.startsWith('192.168.') || 
      hostname.startsWith('10.') || 
      hostname.startsWith('172.') ||
      hostname.endsWith('.local') // mDNS/Bonjour support
    ) {
      return `${protocol}//${hostname}:5000`;
    }
  }
  
  // Fallback to localhost if not specified and not matches LAN
  return 'http://localhost:5000';
};

const API_URL: string = getApiUrl();

export default API_URL;
