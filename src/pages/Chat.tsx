// src/pages/Chat.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { ChatInterface } from '@/components/ChatInterface';
import { ConversationsSheet } from '@/components/ConversationsSheet';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { MenuIcon } from 'lucide-react';
import { useConversations } from '@/hooks/useConversations';
import { toast } from '@/hooks/use-toast';

const Chat = () => {
  const { sessionId: paramSessionId } = useParams<{ sessionId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isConversationsSheetOpen, setIsConversationsSheetOpen] = useState(false);
  const [newChatTrigger, setNewChatTrigger] = useState(0);
  const [currentlyDisplayedSessionId, setCurrentlyDisplayedSessionId] = useState<string | null>(null);
  const [resetChatTrigger, setResetChatTrigger] = useState(0);

  const {
    conversations,
    loading: conversationsLoading,
    error: conversationsError,
    fetchConversations,
    // Placeholder for actual delete/rename to be added to hook and used here later
    // deleteConversation: hookDeleteConversation,
    // renameConversation: hookRenameConversation,
  } = useConversations();


  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    setCurrentlyDisplayedSessionId(paramSessionId ?? null);
  }, [paramSessionId]);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const shouldOpenMostRecent = queryParams.get('openMostRecent') === 'true';

    if (shouldOpenMostRecent && !paramSessionId && !conversationsLoading && conversations && conversations.length > 0) {
      const sortedConversations = [...conversations].sort((a, b) => {
          const dateA = new Date(a.last_updated_at || a.created_at || 0).getTime();
          const dateB = new Date(b.last_updated_at || b.created_at || 0).getTime();
          return dateB - dateA;
      });
      const mostRecentSessionId = sortedConversations[0]?.session_id;

      if (mostRecentSessionId) {
        navigate(`/chat/${mostRecentSessionId}`, { replace: true });
      }
    }
  }, [location.search, paramSessionId, conversations, conversationsLoading, navigate]);

  const handleNewChatFromSheet = () => {
    setNewChatTrigger(prev => prev + 1);
    navigate('/chat');
    setIsConversationsSheetOpen(false);
  };

  const handleSelectConversation = (sessionId: string) => {
    navigate(`/chat/${sessionId}`);
    setIsConversationsSheetOpen(false);
  };

  const handleDeleteConversation = async (sessionIdToDelete: string) => {
    console.log("Placeholder: Attempting to delete in ChatPage:", sessionIdToDelete);
    toast({ title: "Delete (Placeholder)", description: `Would delete ${sessionIdToDelete}`});
    // This will later call the actual hookDeleteConversation
    if (currentlyDisplayedSessionId && sessionIdToDelete === currentlyDisplayedSessionId) {
        setResetChatTrigger(prev => prev + 1);
        navigate('/chat');
    }
    // await fetchConversations(); // Or hook updates state
  };

  const handleRenameConversation = async (sessionIdToRename: string, newTitle: string) => {
    console.log("Placeholder: Attempting to rename in ChatPage:", sessionIdToRename, "to", newTitle);
    toast({ title: "Rename (Placeholder)", description: `Would rename ${sessionIdToRename} to ${newTitle}`});
    // This will later call the actual hookRenameConversation
    // await fetchConversations(); // Or hook updates state
  };


  if (authLoading) {
    return (
      <div className="h-full flex flex-col bg-background"> {/* Changed min-h-screen to h-full */}
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4 pt-24"> {/* pt-24 might be too much if Navbar is h-16 (4rem) and this main has pt-16 already from parent */}
          <div className="animate-pulse-soft">Loading...</div>
        </main>
      </div>
    );
  }

  return (
    // Changed min-h-screen to h-full
    <div className="h-full flex flex-col bg-background">
      <Navbar /> {/* Fixed, h-16 */}
      
      {/* This container is a flex child (flex-1) and also a flex container (flex-col) */}
      {/* It needs to account for the fixed Navbar above it. pt-16 does this. */}
      <div className="flex-1 pt-16 flex flex-col"> {/* This should correctly take up space below Navbar */}
        
        {/* Chat Page Header: sticky relative to viewport, offset by Navbar height */}
        <div className="p-4 border-b flex items-center justify-between sticky top-16 bg-background z-20">
            <div className="flex items-center">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsConversationsSheetOpen(true)}
                    aria-label="Open conversations menu"
                    className="mr-2"
                >
                    <MenuIcon className="h-5 w-5" />
                </Button>
                <h1 className="text-xl font-bold">
                    Chat with Kal
                </h1>
            </div>
        </div>
        
        {/* Chat Interface Wrapper: flex-1 makes it take remaining space in its parent */}
        {/* overflow-hidden is good for containing content and for performance with scrolling children */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <ChatInterface
            sessionId={paramSessionId}
            newChatTrigger={newChatTrigger}
            resetTrigger={resetChatTrigger}
          />
        </div>
      </div>

      <ConversationsSheet
        isOpen={isConversationsSheetOpen}
        onOpenChange={setIsConversationsSheetOpen}
        conversations={conversations}
        conversationsLoading={conversationsLoading}
        conversationsError={conversationsError}
        activeSessionId={currentlyDisplayedSessionId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChatFromSheet}
        fetchConversations={fetchConversations}
      />
    </div>
  );
};

export default Chat;
