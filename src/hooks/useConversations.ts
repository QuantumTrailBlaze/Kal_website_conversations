import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { getConversationTitle } from '@/lib/supabase';
import { ChatSession } from '@/types';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { API_ENDPOINTS, API_AUTH } from '@/config';

export const useConversations = () => {
  const [conversations, setConversations] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch all conversations
  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) {
        setConversations([]);
        return;
      }
      
      const { data, error: fetchError } = await supabase
        .from('messages')
        .select('session_id, created_at, user_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (fetchError) {
        throw fetchError;
      }
      
      if (!data || data.length === 0) {
        setConversations([]);
        return;
      }
      
      const sessionsMap = new Map<string, { session_id: string; created_at: string; user_id: string }>();
      data.forEach((item) => {
        if (item.session_id && !sessionsMap.has(item.session_id)) {
          sessionsMap.set(item.session_id, {
            session_id: item.session_id,
            created_at: item.created_at,
            user_id: item.user_id,
          });
        }
      });
      
      const uniqueSessions = Array.from(sessionsMap.values());
      
      const sessionsWithTitles = await Promise.all(
        uniqueSessions.map(async (session) => {
          const { data: firstMessages, error: firstMessageError } = await supabase
            .from('messages')
            .select('message') // Select only the message column
            .eq('session_id', session.session_id)
            .eq('message->>type', 'human') // Ensure message is an object with a type property
            .order('created_at', { ascending: true })
            .limit(1);
          
          if (firstMessageError) {
            console.error('Error fetching first message:', firstMessageError);
            return {
              id: session.session_id, // Use session_id as id
              session_id: session.session_id,
              created_at: session.created_at,
              user_id: session.user_id,
              title: 'Conversation', // Default title
            };
          }
          
          const firstMessageContent = 
            firstMessages && firstMessages.length > 0 && firstMessages[0].message && typeof firstMessages[0].message === 'object' && 'content' in firstMessages[0].message
            ? String(firstMessages[0].message.content)
            : 'Conversation';
          
          return {
            id: session.session_id, // Use session_id as id
            session_id: session.session_id,
            created_at: session.created_at,
            user_id: session.user_id,
            title: getConversationTitle(firstMessageContent),
            first_message: firstMessageContent,
          };
        })
      );
      
      setConversations(sessionsWithTitles);
    } catch (err: any) {
      console.error('Error fetching conversations:', err);
      setError(err.message);
      toast({
        title: 'Failed to load conversations',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Delete a conversation
  const deleteConversation = useCallback(async (sessionId: string): Promise<string | null> => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to delete conversations.',
        variant: 'destructive',
      });
      return null;
    }

    setLoading(true);
    setError(null);

    const apiUrl = `${API_ENDPOINTS.mentorAgent}/api/users/${encodeURIComponent(user.id)}/sessions/${encodeURIComponent(sessionId)}`;

    try {
      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${API_AUTH.bearerToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          // If response is not JSON
          errorData = { message: response.statusText };
        }
        throw new Error(errorData?.message || `HTTP error! Status: ${response.status}`);
      }
      
      // Verified: This line is correctly placed for immediate state update after successful deletion.
      setConversations(prev => prev.filter(conv => conv.session_id !== sessionId));
      
      toast({
        title: 'Conversation Deleted',
        description: 'The conversation has been successfully deleted.',
      });
      return sessionId; // Return the ID of the deleted session
    } catch (err: any) {
      console.error('Error deleting conversation:', err);
      setError(err.message);
      toast({
        title: 'Failed to Delete Conversation',
        description: err.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
      return null; // Return null on failure
    } finally {
      setLoading(false);
      // No return statement here
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchConversations();
    } else {
      // Clear conversations if user logs out
      setConversations([]);
    }
  }, [user, fetchConversations]);

  return {
    conversations,
    loading,
    error,
    fetchConversations,
    deleteConversation,
  };
};
