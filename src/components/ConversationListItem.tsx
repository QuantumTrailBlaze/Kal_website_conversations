// src/components/ConversationListItem.tsx
import { useState } from 'react';
import { ChatSession } from '@/types'; // Assuming this type exists
import { Button } from '@/components/ui/button';
import { Trash2Icon, Edit3Icon, CheckIcon, XIcon, MessageSquareTextIcon, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ConversationListItemProps {
  conversation: ChatSession;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => Promise<void>;
  onRename: (sessionId: string, newTitle: string) => Promise<void>;
}

export const ConversationListItem = ({
  conversation,
  isActive,
  onSelect,
  onDelete,
  onRename,
}: ConversationListItemProps) => {
  const [isRenaming, setIsRenaming] = useState(false);
  // Use conversation.title, fall back to summary, then to a generic name
  const initialTitle = conversation.title || conversation.summary || `Chat from ${new Date(conversation.created_at || Date.now()).toLocaleDateString()}`;
  const [newTitle, setNewTitle] = useState(initialTitle);
  const [isProcessing, setIsProcessing] = useState(false); // For delete/rename actions

  const handleRenameStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNewTitle(initialTitle);
    setIsRenaming(true);
  };

  const handleRenameConfirm = async (e: React.MouseEvent | React.FormEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (newTitle.trim() && newTitle.trim() !== initialTitle) {
      setIsProcessing(true);
      await onRename(conversation.session_id, newTitle.trim());
      setIsProcessing(false);
    }
    setIsRenaming(false);
  };

  const handleRenameCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRenaming(false);
    setNewTitle(initialTitle);
  };

  const handleDeleteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsProcessing(true);
    await onDelete();
    // setIsProcessing(false); // Component might unmount
  };

  const displayTitle = initialTitle;
  const shortTitle = displayTitle.length > 40 ? `${displayTitle.substring(0, 37)}...` : displayTitle;

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          "group flex items-center justify-between p-2 pr-1 rounded-md hover:bg-accent cursor-pointer", // Reduced right padding for tighter controls
          isActive && "bg-accent text-accent-foreground"
        )}
        onClick={!isRenaming ? onSelect : undefined}
      >
        {isRenaming ? (
          <form onSubmit={handleRenameConfirm} className="flex-grow flex items-center gap-1 mr-1">
            <Input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameConfirm(e);
                if (e.key === 'Escape') handleRenameCancel(e as any);
              }}
              className="h-8 text-sm flex-grow"
              autoFocus
              disabled={isProcessing}
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="submit" variant="ghost" size="icon" className="h-7 w-7 text-green-500 hover:text-green-600" disabled={isProcessing}>
                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckIcon className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top"><p>Save</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" variant="ghost" size="icon" onClick={handleRenameCancel} className="h-7 w-7 text-red-500 hover:text-red-600" disabled={isProcessing}>
                  <XIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top"><p>Cancel</p></TooltipContent>
            </Tooltip>
          </form>
        ) : (
          <>
            <div className="flex items-center overflow-hidden mr-2 flex-grow min-w-0"> {/* Ensure text truncates */}
              <MessageSquareTextIcon className="h-4 w-4 mr-2 flex-shrink-0 text-muted-foreground" />
              <span className="text-sm truncate" title={displayTitle}>
                {shortTitle}
              </span>
            </div>
            <div className="flex items-center opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex-shrink-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handleRenameStart} className="h-7 w-7 hover:text-primary" disabled={isProcessing}>
                    <Edit3Icon className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top"><p>Rename</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handleDeleteClick} disabled={isProcessing} className="h-7 w-7 hover:text-destructive">
                    {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2Icon className="h-3.5 w-3.5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top"><p>Delete</p></TooltipContent>
              </Tooltip>
            </div>
          </>
        )}
      </div>
    </TooltipProvider>
  );
};
