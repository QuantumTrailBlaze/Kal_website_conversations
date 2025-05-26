import { useState, useRef, useEffect, ChangeEvent } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { SendIcon, ExternalLink, Paperclip } from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatFileSize } from '@/lib/utils';
import { API_ENDPOINTS, API_AUTH } from '@/config';

// File handling constants
const ALLOWED_EXTENSIONS = ['.pdf', '.txt', '.docx']; 
const MAX_FILE_SIZE_MB_CONFIG = 12; 
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB_CONFIG * 1024 * 1024;

export const QuickChatWidget = () => {
  const [inputValue, setInputValue] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const chatHistoryRef = useRef<HTMLDivElement>(null);
  const greetingAttemptedRef = useRef(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { messages, loading, sendMessage, notifyAgentFileUploaded, sessionId: localWidgetSessionId } = useChat();

  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const fetchInitialGreeting = async () => {
      if (user && messages.length === 0 && !loading && !greetingAttemptedRef.current) {
        greetingAttemptedRef.current = true;
        await sendMessage("", true); 
      } else if (!user) {
        greetingAttemptedRef.current = false;
      }
    };
    fetchInitialGreeting();
  }, [user, messages.length, loading, sendMessage, localWidgetSessionId]);

  const handleExpandChat = () => {
    const isChatActiveInWidget = messages.length > 0;
    if (isChatActiveInWidget) {
      navigate('/chat?openMostRecent=true');
    } else {
      navigate('/chat');
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to use the chat.',
        variant: 'destructive',
      });
      return;
    }
    await sendMessage(inputValue);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) {
      toast({ title: "Authentication Error", description: "Please sign in to upload files.", variant: "destructive" });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }

    const file = event.target.files[0];
    
    const MAX_FILE_SIZE_MB = 10;
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
       toast({
          title: "File Too Large",
          description: `Please select a file smaller than ${MAX_FILE_SIZE_MB}MB. Your file is ${formatFileSize(file.size)}.`,
          variant: "destructive",
       });
       if (fileInputRef.current) fileInputRef.current.value = "";
       return;
    }

    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(fileExtension) && !ALLOWED_EXTENSIONS.includes(fileExtension.replace('.',''))) {
        const isDocx = fileExtension === '.docx';
        const isDoc = fileExtension === '.doc';
        const acceptAttributeValues = (fileInputRef.current?.accept || "").split(',');
        const canAcceptDoc = acceptAttributeValues.includes('.doc') || acceptAttributeValues.includes('application/msword');
        const canAcceptDocx = acceptAttributeValues.includes('.docx') || acceptAttributeValues.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document');

        let shouldReject = true;
        if (isDocx && canAcceptDocx) shouldReject = false;
        if (isDoc && canAcceptDoc) shouldReject = false;
        if (ALLOWED_EXTENSIONS.includes(fileExtension)) shouldReject = false;

        if (shouldReject) {
            toast({
                title: 'Invalid File Type',
                description: `Only ${ALLOWED_EXTENSIONS.join(', ')} files are allowed. You selected a "${fileExtension}" file.`,
                variant: 'destructive',
            });
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }
    }

    setIsUploading(true);
    toast({ title: "Uploading...", description: `Sending "${file.name}" to Kal.` });

    const formData = new FormData();
    formData.append('user_id', user.id);
    formData.append('file', file);

    const uploadUrl = `${API_ENDPOINTS.fileManagerApi}/api/files`;

    try {
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_AUTH.bearerToken}`,
        },
        body: formData,
      });

      if (response.ok) {
        toast({
          title: "File Sent",
          description: `"${file.name}" sent to Kal. It will appear in "My Files" once processed.`,
          variant: "success",
        });

        // --- MODIFIED: Use notifyAgentFileUploaded ---
        try {
            await notifyAgentFileUploaded(file.name); 
            // This will send the request with file_uploaded_name set
            // and an empty query to the backend.
        } catch (notifyError) {
            // notifyAgentFileUploaded already handles its own toasts for errors
            console.error("QuickChatWidget: Error calling notifyAgentFileUploaded:", notifyError);
        }
        // --- END MODIFICATION ---

      } else {
        const errorBody = await response.text(); 
        let errorDetail = `Could not upload "${file.name}". Status: ${response.status}.`;
        try {
            const errorJson = JSON.parse(errorBody);
            errorDetail = errorJson.detail || errorJson.message || errorDetail;
        } catch (e) { 
            errorDetail += ` Server response: ${errorBody.substring(0,100)}` 
        }

        toast({
          title: "Upload Failed",
          description: errorDetail,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Upload Error",
        description: error.message || `An unexpected error occurred while uploading "${file.name}".`,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; 
      }
    }
  };

  const chatAreaHeight = "h-56";

  return (
    <Card className="glass-card h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Quick Chat with Kal</CardTitle>
        <TooltipProvider delayDuration={200}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        aria-label="Open full chat"
                        onClick={handleExpandChat}
                    >
                        <ExternalLink className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent className="z-50">
                    <p>Open full chat</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-6 pt-0 overflow-hidden">
        <div
          ref={chatHistoryRef}
          className={`space-y-3 overflow-y-auto pr-2 mb-4 flex-grow ${chatAreaHeight}`}
        >
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.type === 'human' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`
                  rounded-lg px-3 py-2 text-sm break-words
                  ${msg.type === 'human'
                    ? 'bg-primary text-primary-foreground max-w-[75%]'
                    : 'bg-muted' 
                  }
                `}
              >
                {msg.type === 'human' ? (
                  msg.content
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (messages.length === 0 || messages[messages.length - 1]?.type === 'human') && (
             <div className="flex justify-start">
                <div className="max-w-[75%] rounded-lg px-3 py-2 text-sm bg-muted">
                   <Skeleton className="h-4 w-16" />
                </div>
             </div>
          )}
        </div>

        <div className="flex items-end gap-2 pt-4 border-t border-border mt-auto">
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full flex-shrink-0 text-muted-foreground hover:text-primary"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Attach file"
                  disabled={loading || !user || isUploading}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Attach file</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
            accept=".pdf,.txt,.doc,.docx" 
          />

          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={user ? "Ask me anything..." : "Sign in to chat..."}
            className="min-h-[40px] max-h-[100px] resize-none flex-1 text-sm"
            rows={1}
            disabled={loading || !user || isUploading}
          />
          <Button
            type="button"
            size="icon"
            onClick={handleSend}
            disabled={loading || (!inputValue.trim()) || !user || isUploading}
            className="h-10 w-10 rounded-full flex-shrink-0"
          >
            <SendIcon className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
