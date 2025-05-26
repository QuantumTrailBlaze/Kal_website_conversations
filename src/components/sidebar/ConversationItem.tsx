import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquareIcon, TrashIcon, AlertTriangleIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ChatSession } from '@/types';

interface ConversationItemProps {
  conversation: ChatSession;
  isActive: boolean;
  onDelete: (id: string) => Promise<void>; // Signature matches the async handler
  onClose?: () => void;
  isMobile: boolean;
}

export const ConversationItem = ({ 
  conversation, 
  isActive, 
  onDelete,
  onClose,
  isMobile 
}: ConversationItemProps) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDeleteConfirm = async () => {
    // No change needed here, it correctly calls the onDelete prop
    await onDelete(conversation.session_id); 
    setIsDeleteDialogOpen(false); 
  };

  const handleLinkClick = () => {
    if (isMobile && onClose) {
      onClose();
    }
  };

  return (
    <div 
      className={`p-2 rounded-lg transition-all duration-200 flex justify-between items-center group ${
        isActive
          ? 'bg-primary/10 hover:bg-primary/15' 
          : 'hover:bg-muted'
      }`}
    >
      <Link 
        to={`/chat/${conversation.session_id}`} 
        className="flex-1 min-w-0"
        onClick={handleLinkClick}
      >
        <div className="flex items-start space-x-3">
          <MessageSquareIcon 
            className={`h-5 w-5 mt-0.5 shrink-0 ${
              isActive 
                ? 'text-primary' 
                : 'text-muted-foreground'
            }`} 
          />
          <div className="overflow-hidden">
            <h3 className="text-sm font-medium truncate">
              {conversation.title || 'Untitled Conversation'}
            </h3>
            <p className="text-xs text-muted-foreground truncate">
              {formatDistanceToNow(new Date(conversation.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
      </Link>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2"
            aria-label="Delete conversation"
            onClick={(e) => {
              e.stopPropagation(); 
              setIsDeleteDialogOpen(true);
            }}
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center space-x-2">
              <AlertTriangleIcon className="h-6 w-6 text-destructive" />
              <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="pt-2">
              Are you sure you want to permanently delete this conversation? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
