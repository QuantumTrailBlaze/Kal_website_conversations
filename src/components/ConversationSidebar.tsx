import { ChatSession } from '@/types'; // Import ChatSession if not already
import { ConversationItem } from '@/components/sidebar/ConversationItem';
import { Button } from '@/components/ui/button';
import { PlusCircleIcon, XIcon, Loader2 } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ConversationSidebarProps {
  isMobile: boolean;
  onClose?: () => void;
  onInitiateNewChat?: () => void; 
  onDeleteConversation: (sessionId: string) => Promise<void>;
  conversations: ChatSession[]; // Added prop
  conversationsLoading: boolean; // Added prop
  conversationsError: string | null; // Added prop
  fetchConversations: () => Promise<void>; // Added prop, useful for manual refresh if needed
}

export const ConversationSidebar = ({ 
  isMobile, 
  onClose, 
  onInitiateNewChat,
  onDeleteConversation,
  conversations, // Use prop
  conversationsLoading, // Use prop
  conversationsError, // Use prop
  fetchConversations // Use prop (though may not be directly called here if parent manages updates)
}: ConversationSidebarProps) => {
  const { sessionId: activeSessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const handleCreateNewChat = () => {
    if (onInitiateNewChat) {
      onInitiateNewChat(); 
    } else {
      navigate('/chat');
    }

    if (isMobile && onClose) {
      onClose();
    }
  };

  const handleDeleteItem = async (sessionIdToDelete: string) => {
    await onDeleteConversation(sessionIdToDelete);
    // No need to call fetchConversations here if the parent's state update
    // (which `onDeleteConversation` now triggers directly) causes a re-render
    // with the new `conversations` prop.
  };

  return (
    <div className="h-full flex flex-col bg-background text-foreground border-r">
      <div className="p-4 flex justify-between items-center border-b">
        <h2 className="text-lg font-semibold">Conversations</h2>
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close sidebar">
            <XIcon className="h-5 w-5" />
          </Button>
        )}
      </div>

      <div className="p-4 border-b">
        <Button 
          onClick={handleCreateNewChat} 
          className="w-full"
          variant="outline"
        >
          <PlusCircleIcon className="mr-2 h-4 w-4" /> New Chat
        </Button>
      </div>

      {conversationsLoading && (
        <div className="flex-1 flex items-center justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2">Loading chats...</span>
        </div>
      )}

      {!conversationsLoading && conversationsError && (
        <div className="flex-1 p-4 text-destructive text-center">
          <p>Error loading conversations:</p>
          <p className="text-sm">{conversationsError}</p>
          <Button onClick={fetchConversations} variant="outline" className="mt-2">Try Again</Button>
        </div>
      )}

      {!conversationsLoading && !conversationsError && conversations.length === 0 && (
        <div className="flex-1 p-4 text-center text-muted-foreground">
          <p>No conversations yet.</p>
          <p>Start a new chat to see it listed here.</p>
        </div>
      )}

      {!conversationsLoading && !conversationsError && conversations.length > 0 && (
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {conversations.map((conv) => (
              <ConversationItem
                key={conv.session_id}
                conversation={conv}
                isActive={conv.session_id === activeSessionId}
                onDelete={handleDeleteItem}
                onClose={onClose} 
                isMobile={isMobile}
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};
