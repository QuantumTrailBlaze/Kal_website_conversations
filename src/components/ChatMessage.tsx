import { useState, useEffect, useRef } from 'react';
    import ReactMarkdown from 'react-markdown';
    import remarkGfm from 'remark-gfm';
    import { ClipboardIcon, CheckIcon } from 'lucide-react';
    import { cn } from '@/lib/utils';
    import { Button } from '@/components/ui/button';
    import { toast } from '@/hooks/use-toast';
    import { ChatMessage as ChatMessageType } from '@/types';

    interface ChatMessageProps {
      message: ChatMessageType;
      isLast?: boolean;
    }

    export const ChatMessage = ({ message, isLast }: ChatMessageProps) => {
      const { content, type } = message;
      const [copied, setCopied] = useState(false);
      const messageRef = useRef<HTMLDivElement>(null);

      const isHuman = type === 'human';

      const copyToClipboard = async () => {
        try {
          await navigator.clipboard.writeText(content);
          setCopied(true);
          toast({
            title: 'Copied to clipboard',
            description: 'Message content has been copied to clipboard',
          });
          setTimeout(() => setCopied(false), 2000);
        } catch (error) {
          console.error('Failed to copy:', error);
          toast({
            title: 'Failed to copy',
            description: 'Could not copy message to clipboard',
            variant: 'destructive',
          });
        }
      };

      useEffect(() => {
        if (isLast && messageRef.current) {
          messageRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
      }, [isLast]);

      return (
        <div
          ref={messageRef}
          className={cn(
            "py-3 px-4 sm:px-6 group animate-fade-in flex items-end",
            isHuman ? "justify-end" : "justify-start"
          )}
        >
          <div
            className={cn(
              "relative max-w-[75%] rounded-lg px-3 py-2 text-sm break-words",
              isHuman
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted'
            )}
          >
            {isHuman ? (
              <p>{content}</p>
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
              </div>
            )}

            <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                onClick={copyToClipboard}
                className="h-6 w-6 rounded-full bg-background/80 hover:bg-background"
              >
                {copied ? (
                  <CheckIcon className="h-3 w-3 text-green-500" />
                ) : (
                  <ClipboardIcon className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        </div>
      );
    };
