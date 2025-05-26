// src/components/ConversationsSheet.tsx
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { PlusCircleIcon, Loader2, AlertTriangleIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ConversationListItem } from "./ConversationListItem"; // Will be created next
import { ChatSession } from "@/types"; // Assuming this type exists

interface ConversationsSheetProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  conversations: ChatSession[]; // Using existing ChatSession for now
  conversationsLoading: boolean;
  conversationsError: string | null;
  activeSessionId: string | null;
  onSelectConversation: (sessionId: string) => void;
  onNewChat: () => void;
  // onDeleteConversation and onRenameConversation will be added in a later step
  // onDeleteConversation: (sessionId: string) => Promise<void>;
  // onRenameConversation: (sessionId: string, newTitle: string) => Promise<void>;
  fetchConversations?: () => Promise<void>; // Optional for now
}

export const ConversationsSheet = ({
  isOpen,
  onOpenChange,
  conversations,
  conversationsLoading,
  conversationsError,
  activeSessionId,
  onSelectConversation,
  onNewChat,
  fetchConversations,
}: ConversationsSheetProps) => {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-full sm:w-96 flex flex-col p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="text-lg">Your Conversations</SheetTitle>
          {/* <SheetDescription>Manage and switch between your chats.</SheetDescription> */}
        </SheetHeader>

        <div className="p-4 border-b">
          <Button onClick={onNewChat} className="w-full" variant="outline">
            <PlusCircleIcon className="mr-2 h-4 w-4" /> New Chat
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {conversationsLoading && (
              <div className="flex items-center justify-center p-4 text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                <span>Loading chats...</span>
              </div>
            )}

            {!conversationsLoading && conversationsError && (
              <div className="p-4 text-destructive text-center">
                <AlertTriangleIcon className="mx-auto h-8 w-8 mb-2" />
                <p className="font-semibold">Error loading conversations</p>
                <p className="text-sm mb-3">{conversationsError}</p>
                {fetchConversations && (
                  <Button
                    onClick={fetchConversations}
                    variant="outline"
                    size="sm"
                  >
                    Try Again
                  </Button>
                )}
              </div>
            )}

            {!conversationsLoading &&
              !conversationsError &&
              conversations.length === 0 && (
                <div className="p-4 text-center text-muted-foreground">
                  <p>No conversations yet.</p>
                  <p className="text-sm">Start a new chat to see it here.</p>
                </div>
              )}

            {!conversationsLoading &&
              !conversationsError &&
              conversations.length > 0 &&
              conversations.map((conv) => (
                <ConversationListItem
                  key={conv.session_id}
                  conversation={conv}
                  isActive={conv.session_id === activeSessionId}
                  onSelect={() => onSelectConversation(conv.session_id)}
                  // Dummy props for now, will be implemented later
                  onDelete={async () => console.log("Delete action (not implemented yet):", conv.session_id)}
                  onRename={async (sessionId, newTitle) => console.log("Rename action (not implemented yet):", sessionId, newTitle)}
                />
              ))}
          </div>
        </ScrollArea>
        <div className="p-4 border-t mt-auto">
            <SheetClose asChild>
                <Button variant="outline" className="w-full">Close</Button>
            </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
};
