import { ChatSession } from '@/types';
import { ConversationItem } from './ConversationItem';
import { Skeleton } from '@/components/ui/skeleton';

interface ConversationListProps {
  conversations: ChatSession[];
  currentSessionId?: string;
  loading: boolean;
  onDelete: (id: string) => Promise<void>;
  onClose?: () => void;
  isMobile: boolean; // Added isMobile prop
}

export const ConversationList = ({ 
  conversations, 
  currentSessionId, 
  loading, 
  onDelete,
  onClose,
  isMobile // Destructure isMobile
}: ConversationListProps) => {
  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex flex-col space-y-2 p-3">
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    );
  }
  
  if (conversations.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-muted-foreground">No conversations found</p>
      </div>
    );
  }
  
  return (
    <div className="p-2">
      {conversations.map((conversation) => (
        <ConversationItem 
          key={conversation.session_id}
          conversation={conversation}
          isActive={currentSessionId === conversation.session_id}
          onDelete={onDelete}
          onClose={onClose}
          isMobile={isMobile} // Pass isMobile to ConversationItem
        />
      ))}
    </div>
  );
};
