import { createAuthClient } from 'better-auth/react';
import { adminClient } from 'better-auth/client/plugins';

const baseURL = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173');

export const authClient = createAuthClient({
  baseURL,
  plugins: [adminClient()],
});
