// src/components/ChatInterface.tsx
import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { SendIcon, PaperclipIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { ChatMessage as ChatMessageComponent } from '@/components/ChatMessage';
import { useChat } from '@/hooks/useChat';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { API_AUTH, API_ENDPOINTS } from '@/config';
import { ChatMessage } from '@/types';

interface ChatInterfaceProps {
  sessionId?: string;
  newChatTrigger?: number;
  resetTrigger?: number;
}

export const ChatInterface = ({ sessionId: propSessionId, newChatTrigger, resetTrigger }: ChatInterfaceProps) => {
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);

  const {
    messages,
    loading,
    sendMessage,
    fetchMessages,
    createNewChat,
  } = useChat({ sessionId: propSessionId });

  useEffect(() => {
    if (messagesContainerRef.current) {
        const { scrollHeight, clientHeight, scrollTop } = messagesContainerRef.current;
        // Auto-scroll if user is near the bottom or if it's their own new message
        const isScrolledToBottom = scrollHeight - clientHeight <= scrollTop + 50; // 50px buffer for smoother experience

        if (messages.length > 0 && (isScrolledToBottom || messages[messages.length-1]?.type === 'human')) {
             messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        } else if (messages.length === 0) { // Scroll to bottom for empty chat (e.g. after reset)
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }
  }, [messages]);

  useEffect(() => {
    if (newChatTrigger && newChatTrigger > 0) {
      createNewChat();
      setInputValue('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newChatTrigger]);

  useEffect(() => {
    if (resetTrigger && resetTrigger > 0) {
      createNewChat();
      setInputValue('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetTrigger]);

  useEffect(() => {
    if (propSessionId) {
      fetchMessages(propSessionId);
      setInputValue('');
    } else if (!propSessionId && (!newChatTrigger || newChatTrigger === 0) && (!resetTrigger || resetTrigger === 0)) {
      setInputValue('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propSessionId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isUploading || loading) return;
    if (!user) {
      toast({ title: 'Authentication required', description: 'Please sign in to chat', variant: 'destructive' });
      return;
    }
    await sendMessage(inputValue);
    setInputValue('');
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileButtonClick = () => {
    if (isUploading || loading || !user) return;
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!user) {
      toast({ title: 'Authentication required', description: 'Please sign in to upload files', variant: 'destructive' });
      return;
    }
    const MAX_FILE_SIZE_MB = 10;
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        toast({ title: "File Too Large", description: `Max file size is ${MAX_FILE_SIZE_MB}MB. Your file is ${(file.size / (1024*1024)).toFixed(2)}MB.`, variant: "destructive" });
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
    }
    const ALLOWED_EXTENSIONS = ['.pdf', '.txt', '.doc', '.docx'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
        toast({ title: "Invalid File Type", description: `Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}. You selected: ${fileExtension}`, variant: "destructive" });
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
    }
    setIsUploading(true);
    const formData = new FormData();
    formData.append('user_id', String(user.id));
    formData.append('file', file);
    try {
      toast({ title: 'Uploading file', description: `Uploading ${file.name}...` });
      const response = await fetch(API_ENDPOINTS.userRag, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${API_AUTH.bearerToken}` },
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({detail: `Upload failed with status: ${response.status}`}));
        throw new Error(errorData.detail || `Upload failed with status: ${response.status}`);
      }
      toast({ title: 'File uploaded successfully', description: `${file.name} has been uploaded. I will consider it in our conversation.`, variant: "success" });
      await sendMessage(`I've uploaded a file: ${file.name}. Please consider its content in our discussion.`);
    } catch (error) {
      console.error('File upload error:', error);
      toast({ title: 'File upload failed', description: error instanceof Error ? error.message : 'An unknown error occurred', variant: 'destructive' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const adjustHeight = () => {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    };
    textarea.addEventListener('input', adjustHeight);
    adjustHeight(); // Initial adjustment
    return () => textarea.removeEventListener('input', adjustHeight);
  }, [inputValue]); // Re-run when inputValue changes for initial height setting on new messages

  const showWelcomeMessage = !propSessionId && messages.length === 0 && !loading;

  return (
    // Main container: flex column, full height, background, and overflow hidden to clip its own content if necessary
    <div className="flex flex-col h-full bg-background overflow-hidden">
      
      {/* Message Area: flex-1 to take available space, scrollable, styled as a box */}
      <div 
        ref={messagesContainerRef} 
        className="flex-1 overflow-y-auto p-4 bg-muted/20 rounded-lg mb-3" // Using bg-muted/20 for a subtle box on dark bg, added mb-3
      >
        {showWelcomeMessage && (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">Start Chatting with Kal</h2>
            <p className="text-muted-foreground mb-8 max-w-md">
              {user ?
                'Ask any question to get started. Kal is ready to help you with your learning journey.' :
                'Please sign in to start chatting.'}
            </p>
          </div>
        )}
        {/* Removed pt-4 from here, padding is now on the parent message box */}
        <div className="flex flex-col space-y-2"> 
          {messages.map((message: ChatMessage, index: number) => (
            <ChatMessageComponent
              key={message.id || index}
              message={message}
              isLast={index === messages.length - 1}
            />
          ))}
          {loading && messages.length > 0 && messages[messages.length - 1]?.type === 'human' && (
            <div className="py-3 px-4 sm:px-0 animate-fade-in"> {/* Keep px for consistency if needed, or rely on parent padding */}
              <div className="flex items-start space-x-3">
                <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2 mt-1">
                  <Skeleton className="h-4 w-24" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-11/12" />
                  </div>
                </div>
              </div>
            </div>
          )}
           {loading && messages.length === 0 && ( // Skeleton for initial load
            <div className="py-3 px-4 sm:px-0 animate-fade-in">
              <div className="flex items-start space-x-3">
                <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2 mt-1">
                  <Skeleton className="h-4 w-24" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-11/12" />
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} style={{ height: '1px' }} /> {/* For scrolling to bottom */}
        </div>
      </div>

      {/* Input Area: Sits at the bottom of the flex column */}
      <Card className="border-t rounded-none bg-background"> {/* Removed mt-auto, relies on flex layout */}
        <form onSubmit={handleSubmit} className="p-3 flex items-end gap-2">
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  disabled={isUploading || loading || !user}
                  onClick={handleFileButtonClick}
                  className="h-9 w-9 rounded-full flex-shrink-0 text-muted-foreground hover:text-primary"
                  aria-label="Attach file"
                >
                  <PaperclipIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top"><p>Attach file (PDF, TXT, DOC, DOCX)</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileUpload}
            accept=".pdf,.txt,.doc,.docx"
            disabled={isUploading || loading || !user}
          />
          <Textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={user ? "Ask Kal anything..." : "Sign in to chat..."}
            className="min-h-[40px] max-h-[120px] resize-none flex-1 text-sm"
            disabled={isUploading || loading || !user}
            rows={1}
          />
          <Button
            type="submit"
            size="icon"
            disabled={isUploading || loading || !inputValue.trim() || !user}
            className="h-9 w-9 rounded-full flex-shrink-0"
            aria-label="Send message"
          >
            <SendIcon className="h-4 w-4" />
          </Button>
        </form>
      </Card>
    </div>
  );
};
