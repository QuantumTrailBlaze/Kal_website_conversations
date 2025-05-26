/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string  // Supabase project URL
  readonly VITE_SUPABASE_ANON_KEY: string  // Supabase public/anonymous key
  readonly VITE_API_BEARER_TOKEN: string  // Bearer token for API authentication
  readonly VITE_MENTOR_AGENT_API_URL: string  // URL for the pydantic-mentor-agent API
  readonly VITE_USER_RAG_API_URL: string  // URL for the user RAG API upload-file endpoint
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
