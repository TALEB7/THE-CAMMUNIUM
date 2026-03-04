import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor — attach Clerk session token
api.interceptors.request.use(async (config) => {
  // In client components, get token from Clerk
  if (typeof window !== 'undefined') {
    try {
      const { getToken } = (window as any).__clerk_session || {};
      // Try to get token from Clerk's client-side session
      const clerkInstance = (window as any).Clerk;
      if (clerkInstance?.session) {
        const token = await clerkInstance.session.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch {
      // silently ignore - user may not be authenticated
    }
  }
  return config;
});

// Response interceptor — handle errors with structured messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        window.location.href = '/sign-in';
      }
    }

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
