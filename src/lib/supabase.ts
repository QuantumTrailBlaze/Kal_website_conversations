import { createClient } from '@supabase/supabase-js';
    import { SUPABASE_CONFIG } from '@/config';

    export const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);

    export type Message = {
      content: string;
      type: 'human' | 'ai';
    };

    export type Conversation = {
      id: string;
      created_at: string;
      session_id: string;
      user_id: string; // Now required
      title?: string;
      messages?: Message[];
      first_message?: string;
    };

    // Helper function to get conversation title from first message
    export const getConversationTitle = (firstMessage?: string): string => {
      if (!firstMessage) return 'New Conversation';

      // Get the first 30 characters of the first message
      const title = firstMessage.substring(0, 30);
      return title + (firstMessage.length > 30 ? '...' : '');
    };
