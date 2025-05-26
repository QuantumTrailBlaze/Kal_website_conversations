import { User as SupabaseUser } from '@supabase/supabase-js';

// Agent Request/Response types
export interface AgentRequest {
  query: string;
  user_id: string;
  request_id: string;
  session_id: string;
}

export interface AgentResponse {
  success: boolean;
  data: string;
}

// User types (Extending SupabaseUser for clarity if needed, or using it directly)
// Using SupabaseUser directly is often cleaner if no extra fields are needed application-wide.
// If you need app-specific user fields beyond Supabase, define them here.
export type User = SupabaseUser;

// Chat message types
export interface ChatMessage {
  id?: string;
  content: string;
  type: 'human' | 'ai';
  timestamp?: string;
  user_id: string; // Now required
}

// Chat session types
export interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  session_id: string;
  user_id: string;
  first_message?: string;
  summary?: string; // Added: Used in ConversationListItem for display
  last_updated_at?: string; // Added: Used in Chat.tsx for sorting
}

// Onboarding Status type
export interface OnboardingStatus {
  completed: boolean;
  completed_at: string | null; // ISO date string or null
  path_taken: string | null;
  // Add any other relevant fields from the API response
}

// Onboarding Path type (NEW)
export interface OnboardingPath {
  path_key: string;
  display_name: string;
  description: string;
}
