/**
 * Application configuration
 * Environment variables are loaded from import.meta.env (Vite)
 * Fallbacks are provided for local development
 */

// Supabase configuration
export const SUPABASE_CONFIG = {
  url: import.meta.env.VITE_SUPABASE_URL || 'https://yamgumiyaicqrfkzlwke.supabase.co',
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhbWd1bWl5YWljcXJma3psd2tlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg3NzE4MzIsImV4cCI6MjA1NDM0NzgzMn0.v-AvIuov96BH_Zms-KJrf0cR2kr4jNc37Nru0OYGQts',
};

// API endpoints
export const API_ENDPOINTS = {
  mentorAgent: import.meta.env.VITE_MENTOR_AGENT_API_URL || 'http://127.0.0.1:8005',
  userRag: import.meta.env.VITE_USER_RAG_API_URL || 'http://localhost:8003/api/upload-file',
  bookRecommendation: import.meta.env.VITE_BOOK_RECO_API_URL || 'http://localhost:8005',
  quoteRecommendation: import.meta.env.VITE_QUOTE_RECO_API_URL || 'http://localhost:8008',
	fileManagerApi: import.meta.env.VITE_FILES_MANAGER_API_URL || 'http://localhost:8009',
};

// API authentication
export const API_AUTH = {
  bearerToken: import.meta.env.VITE_API_BEARER_TOKEN || 'eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhbWd1bWl5YWljcXJma3ps',
};

// Check if we're in production environment
export const IS_PRODUCTION = import.meta.env.MODE === 'production';

// Helper function to log configuration (only in development)
export const logConfig = () => {
  if (import.meta.env.DEV) {
    console.log('Application Configuration:', {
      environment: import.meta.env.MODE,
      supabaseUrl: SUPABASE_CONFIG.url,
      apiEndpoints: API_ENDPOINTS,
    });
  }
};
