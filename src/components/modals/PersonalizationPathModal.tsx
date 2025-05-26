import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  // DialogClose, // No longer needed for explicit button in header
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"; // CardContent removed as not directly used
import { Loader2, AlertTriangle } from 'lucide-react'; // X removed as default is handled by DialogContent
import { API_ENDPOINTS, API_AUTH } from '@/config';
import { OnboardingPath } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface PersonalizationPathModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmPath: (pathKey: string) => void;
}

export const PersonalizationPathModal: React.FC<PersonalizationPathModalProps> = ({
  isOpen,
  onClose,
  onConfirmPath,
}) => {
  const [paths, setPaths] = useState<OnboardingPath[]>([]);
  const [selectedPathKey, setSelectedPathKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedPathKey(null);
      setError(null);
      setPaths([]);
      fetchPaths();
    }
  }, [isOpen]);

  const fetchPaths = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_ENDPOINTS.mentorAgent}/api/onboarding/paths`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${API_AUTH.bearerToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
         let errorDetails = `HTTP error! status: ${response.status}`;
         try {
           const errorData = await response.json();
           errorDetails = errorData.detail || errorData.message || errorDetails;
         } catch (jsonError) { /* Ignore */ }
        throw new Error(errorDetails);
      }

      const data = await response.json();
      if (data && Array.isArray(data.paths)) {
        setPaths(data.paths);
      } else {
        console.error('Invalid response format from API:', data);
        throw new Error('Received invalid data format for onboarding paths.');
      }
    } catch (err: any) {
      console.error('Failed to fetch onboarding paths:', err);
      const errorMessage = err.message || 'Could not load personalization paths. Please try again later.';
      setError(errorMessage);
      toast({
        title: 'Error Loading Paths',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    if (selectedPathKey) {
      onConfirmPath(selectedPathKey);
      // onClose(); // Dashboard's handleConfirmPath will handle closing or next steps
    } else {
       toast({
         title: 'Selection Required',
         description: 'Please select a personalization path before continuing.',
         variant: 'default',
       });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open && !isLoading) { // Prevent closing if loading
        onClose();
      }
    }}>
      <DialogContent 
        className="sm:max-w-[550px] bg-card text-card-foreground border-border shadow-lg rounded-lg"
        onInteractOutside={(e) => { // Prevent closing via overlay click when loading
          if (isLoading) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => { // Prevent closing via Escape key when loading
            if (isLoading) {
                e.preventDefault();
            }
        }}
        // showCloseButton prop defaults to true, so the DialogContent will render its own X button
      >
        {/* The DialogHeader no longer needs pr-10 as the explicit X button is removed. 
            The default X button from DialogContent is absolutely positioned. */}
        <DialogHeader> 
          <DialogTitle className="text-xl font-semibold">Choose Your Personalization Path</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Select how deep you'd like to go to help Kal understand your goals and learning style.
          </DialogDescription>
           {/* Explicit Close Button removed from here */}
        </DialogHeader>

        <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto px-1 custom-scrollbar">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-10 space-y-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-muted-foreground">Loading paths...</span>
            </div>
          )}

          {error && !isLoading && (
            <div className="flex flex-col items-center justify-center py-10 text-center text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-4">
              <AlertTriangle className="h-8 w-8 mb-2" />
              <p className="font-semibold">Error Loading Paths</p>
              <p className="text-sm mb-4">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchPaths} disabled={isLoading}>
                Retry
              </Button>
            </div>
          )}

          {!isLoading && !error && paths.length > 0 && (
            <RadioGroup
              value={selectedPathKey ?? undefined}
              onValueChange={setSelectedPathKey}
              className="grid gap-3"
              disabled={isLoading}
            >
              {paths.map((path) => (
                <Card
                  key={path.path_key}
                  className={cn(
                    "cursor-pointer transition-all border-2 hover:shadow-md",
                    selectedPathKey === path.path_key
                      ? "border-primary ring-2 ring-primary/30 bg-primary/5"
                      : "border-border hover:border-muted-foreground/50 bg-card"
                  )}
                  onClick={() => !isLoading && setSelectedPathKey(path.path_key)}
                  role="radio"
                  aria-checked={selectedPathKey === path.path_key}
                  tabIndex={0}
                  onKeyDown={(e) => { if (!isLoading && (e.key === ' ' || e.key === 'Enter')) setSelectedPathKey(path.path_key); }}
                >
                  <CardHeader className="flex flex-row items-start space-x-4 p-4">
                     <RadioGroupItem value={path.path_key} id={path.path_key} className="mt-1 flex-shrink-0" />
                     <div className="flex-grow space-y-1">
                       <label htmlFor={path.path_key} className="block cursor-pointer">
                         <CardTitle className="text-base font-medium leading-tight">{path.display_name}</CardTitle>
                         <CardDescription className="text-sm text-muted-foreground mt-1">{path.description}</CardDescription>
                       </label>
                     </div>
                  </CardHeader>
                </Card>
              ))}
            </RadioGroup>
          )}

           {!isLoading && !error && paths.length === 0 && (
             <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
               <p>No personalization paths are currently available.</p>
               <p className="text-sm mt-1">Please check back later.</p>
             </div>
           )}
        </div>

        <DialogFooter className="mt-2 pt-4 border-t border-border">
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedPathKey || isLoading}
            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Start Selected Path
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
