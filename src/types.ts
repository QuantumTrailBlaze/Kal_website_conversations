import { User } from '@supabase/supabase-js';

// Extend Supabase User type if needed
export interface AppUser extends User {
  // Add custom properties if you extend the user table/metadata
  // e.g., onboarding_status?: string;
}

// Type for onboarding status fetched from API
export interface OnboardingStatus {
  user_id: string;
  completed: boolean;
  completed_at: string | null; // ISO 8601 date string or null
  path_taken: string | null;
}

// Type for individual onboarding path details fetched from API
export interface OnboardingPath {
  path_key: string;       // e.g., "jump_in", "5_questions"
  display_name: string;   // e.g., "Jump Right In", "Quick Setup (5 Questions)"
  description: string;    // e.g., "Start using Kal immediately...", "Answer a few questions..."
  estimated_time?: string; // Optional: e.g., "~1 min", "~5 mins"
}

// Type for the response from GET /api/onboarding/paths
export interface OnboardingPathsResponse {
  paths: OnboardingPath[];
}

// Type for the data structure of a single onboarding step (from /start or /process)
export interface OnboardingStepData {
  message_to_user: string;      // The question or instruction text (can contain \n)
  question_key: string | null;  // Identifier for the current question/step, null if complete/error
  response_type: 'text' | 'number' | 'single_choice' | 'multi_choice' | 'acknowledgement' | 'special_age_gender' | null; // Type of input expected, null if complete/error
  options?: string[];           // Array of strings for choice types
  next_action: 'ask_user' | 'display_form_element' | 'complete' | 'error'; // What the frontend should do
  error?: string | null;        // Error message if next_action is 'error'
  // Add any other relevant fields the API might return per step
  // e.g., progress_percent?: number;
}

// You might want a more specific type for the /start response if it differs significantly
// export type OnboardingStartResponse = OnboardingStepData;

// And for the /process response
// export type OnboardingProcessResponse = OnboardingStepData;
