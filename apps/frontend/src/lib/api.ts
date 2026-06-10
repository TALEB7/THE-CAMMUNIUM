import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Expires': '0',
  },
  timeout: 10000,
});

// Request interceptor — attach NextAuth session token (which holds the NestJS JWT)
api.interceptors.request.use(async (config) => {
  if (typeof window !== 'undefined') {
    try {
      // Dynamically import to avoid server-side execution issues
      const { getSession } = await import('next-auth/react');
      const session = await getSession();
      if (session && (session.user as any)?.accessToken) {
        config.headers.Authorization = `Bearer ${(session.user as any).accessToken}`;
      }
    } catch (e) {
      // silently ignore
    }
  }
  return config;
});

// Response interceptor — handle errors with structured messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // We removed the forced window.location.href = '/sign-in' on 401 
    // to prevent aggressive session drops when the backend API fails to authenticate.

    // Extract the most useful error message from the response
    const data = error.response?.data;
    const message =
      typeof data?.message === 'string'
        ? data.message
        : Array.isArray(data?.message)
          ? data.message.join(', ')
          : error.message || 'An unexpected error occurred';

    // Attach a clean message for consumers to use
    error.userMessage = message;

    console.error(`[API ${error.response?.status || 'NETWORK'}] ${error.config?.method?.toUpperCase()} ${error.config?.url}: ${message}`);

    return Promise.reject(error);
  },
);
