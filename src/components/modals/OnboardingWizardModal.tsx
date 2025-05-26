import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  // DialogClose, // No longer needed for explicit button
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardHeader } from "@/components/ui/card"; // CardContent, CardTitle, CardDescription removed as not directly used
import { Progress } from "@/components/ui/progress";
import { Loader2, AlertTriangle, CheckCircle, PartyPopper } from 'lucide-react'; // X removed as default is handled
import { API_ENDPOINTS, API_AUTH } from '@/config';
import { OnboardingStepData, OnboardingStatus } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface OnboardingWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStepData: OnboardingStepData;
  userId: string;
}

type AnswerType = string | string[] | number | null;

export const OnboardingWizardModal: React.FC<OnboardingWizardModalProps> = ({
  isOpen,
  onClose,
  initialStepData,
  userId,
}) => {
  const [currentStepData, setCurrentStepData] = useState<OnboardingStepData>(initialStepData);
  const [currentAnswer, setCurrentAnswer] = useState<AnswerType>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setCurrentStepData(initialStepData);
      setCurrentAnswer(null);
      setIsLoading(false);
      setError(null);
      setIsCompleted(false);
      setProgress(initialStepData.question_key ? 10 : 0);
    }
  }, [isOpen, initialStepData]);

  const handleAnswerChange = (value: AnswerType) => {
    setCurrentAnswer(value);
  };

  const handleSubmitAnswer = async () => {
    if (currentStepData.response_type !== 'acknowledgement' && (currentAnswer === null || (typeof currentAnswer === 'string' && currentAnswer.trim() === "") || (Array.isArray(currentAnswer) && currentAnswer.length === 0))) {
      toast({ title: "Input Required", description: "Please provide an answer.", variant: "default" });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_ENDPOINTS.mentorAgent}/api/onboarding/process`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_AUTH.bearerToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          current_step: currentStepData.question_key,
          answer: currentAnswer,
        }),
      });

      if (!response.ok) {
        let errorDetails = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorDetails = errorData.detail || errorData.message || errorDetails;
        } catch (jsonError) { /* Ignore */ }
        throw new Error(errorDetails);
      }

      const nextStepData: OnboardingStepData = await response.json();
      
      if (nextStepData.next_action === 'complete') {
        setIsCompleted(true);
        setCurrentStepData(nextStepData);
        setProgress(100);
        const currentStatusString = localStorage.getItem('onboardingStatus');
        let currentStatus: Partial<OnboardingStatus> = {};
        if (currentStatusString) {
            currentStatus = JSON.parse(currentStatusString);
        }
        localStorage.setItem('onboardingStatus', JSON.stringify({
            ...currentStatus,
            user_id: userId,
            completed: true,
            completed_at: new Date().toISOString(),
        }));
        toast({ title: "Personalization Complete!", description: "You're all set up." });
      } else if (nextStepData.next_action === 'ask_user' || nextStepData.next_action === 'display_form_element') {
        setCurrentStepData(nextStepData);
        setCurrentAnswer(null);
        setProgress(prev => Math.min(prev + 10, 95));
      } else if (nextStepData.next_action === 'error') {
        setError(nextStepData.error || "An unknown error occurred.");
        toast({ title: "Error", description: nextStepData.error || "Could not process your answer.", variant: "destructive" });
      } else {
        setError("Received an unexpected response from the server.");
        toast({ title: "Error", description: "Unexpected server response.", variant: "destructive" });
      }
    } catch (err: any) {
      console.error('Failed to process answer:', err);
      const errorMessage = err.message || 'Could not submit your answer. Please try again.';
      setError(errorMessage);
      toast({
        title: 'Submission Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderInput = () => {
    if (!currentStepData || currentStepData.next_action !== 'ask_user' && currentStepData.next_action !== 'display_form_element') return null;

    switch (currentStepData.response_type) {
      case 'text':
      case 'special_age_gender':
        return (
          <Input
            type="text"
            placeholder="Your answer..."
            value={(currentAnswer as string) || ''}
            onChange={(e) => handleAnswerChange(e.target.value)}
            className="mt-2 bg-background border-border focus:ring-primary"
            disabled={isLoading}
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            placeholder="Enter a number..."
            value={(currentAnswer as number) || ''}
            onChange={(e) => handleAnswerChange(e.target.value === '' ? null : parseFloat(e.target.value))}
            className="mt-2 bg-background border-border focus:ring-primary"
            disabled={isLoading}
          />
        );
      case 'single_choice':
        return (
          <RadioGroup
            value={currentAnswer as string}
            onValueChange={(value) => handleAnswerChange(value)}
            className="mt-3 grid gap-3"
            disabled={isLoading}
          >
            {currentStepData.options?.map((option) => (
              <Card
                key={option}
                className={cn(
                  "cursor-pointer transition-all border-2 hover:shadow-md",
                  currentAnswer === option
                    ? "border-primary ring-2 ring-primary/30 bg-primary/5"
                    : "border-border hover:border-muted-foreground/50 bg-card"
                )}
                onClick={() => !isLoading && handleAnswerChange(option)}
                role="radio"
                aria-checked={currentAnswer === option}
                tabIndex={0}
                onKeyDown={(e) => { if (!isLoading && (e.key === ' ' || e.key === 'Enter')) handleAnswerChange(option); }}
              >
                <CardHeader className="flex flex-row items-center space-x-3 p-4">
                  <RadioGroupItem value={option} id={`option-${option}`} className="flex-shrink-0" />
                  <Label htmlFor={`option-${option}`} className="font-normal text-sm cursor-pointer flex-grow">
                    {option}
                  </Label>
                </CardHeader>
              </Card>
            ))}
          </RadioGroup>
        );
      case 'multi_choice':
        return (
          <div className="mt-3 grid gap-3">
            {currentStepData.options?.map((option) => (
              <Card
                key={option}
                className={cn(
                  "cursor-pointer transition-all border-2 hover:shadow-md",
                  (currentAnswer as string[])?.includes(option)
                    ? "border-primary ring-2 ring-primary/30 bg-primary/5"
                    : "border-border hover:border-muted-foreground/50 bg-card"
                )}
                onClick={() => {
                  if (isLoading) return;
                  const currentSelection = (currentAnswer as string[]) || [];
                  const newSelection = currentSelection.includes(option)
                    ? currentSelection.filter(item => item !== option)
                    : [...currentSelection, option];
                  handleAnswerChange(newSelection);
                }}
                role="checkbox"
                aria-checked={(currentAnswer as string[])?.includes(option)}
                tabIndex={0}
                 onKeyDown={(e) => {
                    if (!isLoading && (e.key === ' ' || e.key === 'Enter')) {
                        const currentSelection = (currentAnswer as string[]) || [];
                        const newSelection = currentSelection.includes(option)
                            ? currentSelection.filter(item => item !== option)
                            : [...currentSelection, option];
                        handleAnswerChange(newSelection);
                    }
                 }}
              >
                <CardHeader className="flex flex-row items-center space-x-3 p-4">
                  <Checkbox
                    id={`option-${option}`}
                    checked={(currentAnswer as string[])?.includes(option)}
                    onCheckedChange={() => { /* Click handled by Card */ }}
                    className="flex-shrink-0"
                    disabled={isLoading}
                  />
                  <Label htmlFor={`option-${option}`} className="font-normal text-sm cursor-pointer flex-grow">
                    {option}
                  </Label>
                </CardHeader>
              </Card>
            ))}
          </div>
        );
      case 'acknowledgement':
        return <p className="text-sm text-muted-foreground mt-2">Click "Next" to continue.</p>;
      default:
        return <p className="text-destructive mt-2">Unsupported question type: {currentStepData.response_type}</p>;
    }
  };

  const formattedMessage = useMemo(() => {
    return currentStepData.message_to_user.replace(/\n/g, '<br />');
  }, [currentStepData.message_to_user]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        // Allow closing via Escape key or overlay click only if not loading OR if completed
        if (!isLoading || isCompleted) {
          onClose();
        }
      }
    }}>
      <DialogContent 
        showCloseButton={!isCompleted} // Hide default 'X' when completed
        className="sm:max-w-lg bg-card text-card-foreground border-border shadow-xl rounded-lg flex flex-col max-h-[90vh]"
        onInteractOutside={(e) => { // Prevent closing via overlay click when loading and not completed
          if (isLoading && !isCompleted) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => { // Prevent closing via Escape key when loading and not completed
            if (isLoading && !isCompleted) {
                e.preventDefault();
            }
        }}
      >
        <DialogHeader className={cn(!isCompleted && "pr-10")}> {/* Add padding-right if default close button is shown */}
          <DialogTitle className="text-xl font-semibold">
            {isCompleted ? "Personalization Complete!" : "Tell Us More About You"}
          </DialogTitle>
          {!isCompleted && currentStepData.question_key && (
            <DialogDescription className="text-muted-foreground">
              Your answers help us tailor Kal to your needs.
            </DialogDescription>
          )}
          {/* Explicit DialogClose button removed */}
        </DialogHeader>

        {!isCompleted && (
          <div className="pt-2 pb-1"> {/* Relies on DialogContent p-6 for horizontal padding */}
            <Progress value={progress} className="w-full h-2" />
          </div>
        )}

        <div className="flex-grow overflow-y-auto py-4 space-y-4 custom-scrollbar"> {/* Relies on DialogContent p-6 for horizontal padding */}
          {isCompleted ? (
            <div className="flex flex-col items-center justify-center text-center py-8 space-y-4">
              <PartyPopper className="h-16 w-16 text-primary animate-bounce" />
              <h3 className="text-2xl font-semibold text-foreground">You're All Set!</h3>
              {currentStepData.message_to_user && (
                 <p className="text-muted-foreground" dangerouslySetInnerHTML={{ __html: formattedMessage }} />
              )}
              <p className="text-muted-foreground">
                Kal is now better equipped to guide your learning journey.
              </p>
            </div>
          ) : (
            <>
              {currentStepData.message_to_user && (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                   <p className="text-foreground text-base" dangerouslySetInnerHTML={{ __html: formattedMessage }} />
                </div>
              )}
              {renderInput()}
              {error && (
                <div className="mt-3 p-3 bg-destructive/10 border border-destructive/30 rounded-md text-sm text-destructive flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className="pt-4 border-t border-border mt-auto"> {/* Relies on DialogContent p-6 for horizontal padding */}
          {isCompleted ? (
            <Button onClick={onClose} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
              <CheckCircle className="mr-2 h-4 w-4" />
              Done
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmitAnswer}
              disabled={isLoading || (!currentAnswer && currentStepData.response_type !== 'acknowledgement' && !(Array.isArray(currentAnswer) && currentAnswer.length > 0))}
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {currentStepData.response_type === 'acknowledgement' ? 'Continue' : 'Next'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
