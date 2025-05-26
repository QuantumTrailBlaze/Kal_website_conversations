import { MessageSquarePlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NewChatButtonProps {
  onClick: () => void;
}

export const NewChatButton = ({ onClick }: NewChatButtonProps) => {
  return (
    <div className="p-4">
      <Button 
        variant="outline" 
        className="w-full justify-start" 
        onClick={onClick}
      >
        <MessageSquarePlusIcon className="h-4 w-4 mr-2" />
        New Chat
      </Button>
    </div>
  );
};
