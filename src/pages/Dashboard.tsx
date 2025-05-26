import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { HighlightWidget } from '@/components/widgets/HighlightWidget';
import { ScheduleWidget } from '@/components/widgets/ScheduleWidget';
import { QuickChatWidget } from '@/components/widgets/QuickChatWidget';
import { BookRecWidget } from '@/components/widgets/BookRecWidget';
import { FileMgmtWidget } from '@/components/widgets/FileMgmtWidget';
// BottomNav is no longer imported or rendered here
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from 'lucide-react';
import { API_ENDPOINTS, API_AUTH } from '@/config';
import { OnboardingStatus, OnboardingStepData } from '@/types';
import { toast } from '@/hooks/use-toast';
import { PersonalizationPathModal } from '@/components/modals/PersonalizationPathModal';
import { OnboardingWizardModal } from '@/components/modals/OnboardingWizardModal';

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [showOnboardingBanner, setShowOnboardingBanner] = useState(false);
  const [onboardingStatusLoading, setOnboardingStatusLoading] = useState(true);
  const [isPersonalizationModalOpen, setIsPersonalizationModalOpen] = useState(false);
  const [isStartingOnboarding, setIsStartingOnboarding] = useState(false);
  
  const [isWizardModalOpen, setIsWizardModalOpen] = useState(false);
  const [initialWizardData, setInitialWizardData] = useState<OnboardingStepData | null>(null);


  useEffect(() => {
    const fetchOnboardingStatus = async () => {
      setOnboardingStatusLoading(true);
      if (!user || authLoading) {
        if (authLoading) return;
        setOnboardingStatusLoading(false);
        return;
      }

      const dismissed = sessionStorage.getItem('hideOnboardingBanner') === 'true';
      if (dismissed) {
        setShowOnboardingBanner(false);
        setOnboardingStatusLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_ENDPOINTS.mentorAgent}/api/onboarding/status?user_id=${user.id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${API_AUTH.bearerToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
             console.warn('Onboarding status not found for user:', user.id);
             localStorage.setItem('onboardingStatus', JSON.stringify({ user_id: user.id, completed: false, completed_at: null, path_taken: null }));
             setShowOnboardingBanner(true);
          } else {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
        } else {
            const data: OnboardingStatus = await response.json();
            localStorage.setItem('onboardingStatus', JSON.stringify(data));
            if (!data.completed) {
              setShowOnboardingBanner(true);
            } else {
              setShowOnboardingBanner(false);
            }
        }
      } catch (error) {
        console.error('Failed to fetch onboarding status:', error);
        toast({
          title: 'Error',
          description: 'Could not fetch onboarding status.',
          variant: 'destructive',
        });
        setShowOnboardingBanner(false);
      } finally {
        setOnboardingStatusLoading(false);
      }
    };

    if (user) {
       fetchOnboardingStatus();
    } else if (!authLoading) {
       setOnboardingStatusLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  const handleMaybeLater = () => {
    setShowOnboardingBanner(false);
    sessionStorage.setItem('hideOnboardingBanner', 'true');
  };

  const handleStartPersonalizationClick = () => {
    setIsPersonalizationModalOpen(true);
  };

  const handleClosePersonalizationModal = () => {
    setIsPersonalizationModalOpen(false);
  };

  const handleConfirmPath = async (chosenPath: string) => {
    if (!user) {
      toast({ title: 'Error', description: 'User not found. Please log in again.', variant: 'destructive' });
      return;
    }
    setIsStartingOnboarding(true);
    console.log(`Dashboard: Starting onboarding for user ${user.id} with path ${chosenPath}`);

    try {
      const response = await fetch(`${API_ENDPOINTS.mentorAgent}/api/onboarding/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_AUTH.bearerToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: user.id, chosen_path: chosenPath }),
      });

      if (!response.ok) {
        let errorDetails = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorDetails = errorData.detail || errorData.message || errorDetails;
        } catch (jsonError) { /* Ignore */ }
        throw new Error(errorDetails);
      }

      const result: OnboardingStepData = await response.json();
      console.log('Onboarding started successfully via API:', result);
      
      localStorage.setItem('onboardingStatus', JSON.stringify({ user_id: user.id, completed: false, completed_at: null, path_taken: chosenPath }));
      setShowOnboardingBanner(false); 

      toast({
        title: 'Personalization Path Selected!',
        description: 'Let\'s get started with some questions.',
      });

      if (result && result.question_key && result.message_to_user && (result.next_action === 'ask_user' || result.next_action === 'display_form_element')) {
          setInitialWizardData(result); 
          setIsWizardModalOpen(true);    
      } else if (result && result.next_action === 'complete') { 
          console.log('Onboarding path completed immediately after start.');
          localStorage.setItem('onboardingStatus', JSON.stringify({ user_id: user.id, completed: true, completed_at: new Date().toISOString(), path_taken: chosenPath }));
          toast({ title: 'Personalization Complete!', description: 'Setup finished instantly.' });
          setShowOnboardingBanner(false);
      } else {
          console.error("Backend response for /start did not contain expected first step data or completion signal:", result);
          toast({
              title: 'Error',
              description: 'Received an unexpected response from the server. Cannot start questions.',
              variant: 'destructive',
          });
      }

    } catch (error: any) {
      console.error('Failed to start onboarding via API:', error);
      toast({
        title: 'Error Starting Personalization',
        description: error.message || 'Could not start the selected path. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsStartingOnboarding(false);
      setIsPersonalizationModalOpen(false);
    }
  };
  
  const handleCloseWizardModal = async () => {
    const storedStatusString = localStorage.getItem('onboardingStatus');
    let isCompleted = false;
    if (storedStatusString) {
        try {
            const storedStatus: OnboardingStatus = JSON.parse(storedStatusString);
            isCompleted = storedStatus?.completed === true;
        } catch (e) {
            console.error("Error parsing onboardingStatus from localStorage", e);
        }
    }
    console.log(`Closing wizard. Is onboarding completed? ${isCompleted}`);

    if (!isCompleted && user?.id) {
        console.log(`Onboarding not complete. Attempting to delete preferences for user: ${user.id}`);
        try {
            const deleteEndpoint = `/api/users/${encodeURIComponent(user.id)}/preferences`;
            const deleteUrl = `${import.meta.env.VITE_MENTOR_AGENT_API_URL}${deleteEndpoint}`;

            const response = await fetch(deleteUrl, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${API_AUTH.bearerToken}`,
                }
            });

            if (!response.ok) {
              // Try to get more details from the error response
              let errorDetails = `HTTP error! status: ${response.status}`;
              try {
                  const errorData = await response.json();
                  errorDetails = errorData.detail || errorData.message || errorDetails;
              } catch (jsonError) { /* Ignore if response is not JSON */ }
              throw new Error(errorDetails);
            }

            console.log(`Successfully called delete preferences endpoint for user: ${user.id}`);
            toast({
              title: 'Onboarding Paused',
              description: 'Your progress has been reset. You can start again anytime.',
              variant: 'default',
            });
        } catch (error: any) {
            console.error('Failed to delete user preferences on wizard close:', error);
            toast({
              title: 'Cleanup Issue',
              description: error.message || 'Could not fully reset onboarding state. Please contact support if issues persist.',
              variant: 'warning',
            });
        }
    } else if (isCompleted) {
         console.log(`Onboarding completed. Skipping preference deletion for user: ${user?.id}`);
    }
    
    setIsWizardModalOpen(false);
    setInitialWizardData(null); 

    // Re-fetch status to ensure UI (like banner) is up-to-date after modal closure
    if (user) {
        const fetchStatus = async () => {
            setOnboardingStatusLoading(true); // Indicate loading while fetching
            try {
                const response = await fetch(`${API_ENDPOINTS.mentorAgent}/api/onboarding/status?user_id=${user.id}`, {
                    headers: { 'Authorization': `Bearer ${API_AUTH.bearerToken}` }
                });
                if (response.ok) {
                    const data: OnboardingStatus = await response.json();
                    localStorage.setItem('onboardingStatus', JSON.stringify(data));
                    if (!data.completed) {
                        const dismissed = sessionStorage.getItem('hideOnboardingBanner') === 'true';
                        if (!dismissed) setShowOnboardingBanner(true);
                    } else {
                        setShowOnboardingBanner(false);
                    }
                } else if (response.status === 404) { // Handle case where status might have been deleted
                    localStorage.setItem('onboardingStatus', JSON.stringify({ user_id: user.id, completed: false, completed_at: null, path_taken: null }));
                    const dismissed = sessionStorage.getItem('hideOnboardingBanner') === 'true';
                    if (!dismissed) setShowOnboardingBanner(true);
                }
            } catch (e) { 
                console.error("Failed to refetch status after wizard close", e); 
            } finally {
                setOnboardingStatusLoading(false);
            }
        };
        fetchStatus();
    }
  };


  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4 pt-24">
          <div className="flex items-center space-x-2">
             <Loader2 className="h-8 w-8 animate-spin text-primary" />
             <span className="text-lg text-muted-foreground">Loading Dashboard...</span>
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 pt-24 pb-24 px-4"> {/* Ensure pb-24 for BottomNav clearance */}
        <div className="container max-w-7xl mx-auto">
          <section className="mb-6">
            <h1 className="text-3xl font-bold mb-1 text-foreground">
              Welcome, {user.user_metadata?.display_name || user.email?.split('@')[0] || 'User'}!
            </h1>
            <p className="text-lg text-muted-foreground">
              Kal is ready to help with your learning journey.
            </p>
          </section>

          {onboardingStatusLoading && (
             <div className="h-16 mb-8 flex items-center justify-center bg-muted/30 rounded-lg animate-pulse">
                <p className="text-sm text-muted-foreground">Checking personalization status...</p>
             </div>
          )}
          {!onboardingStatusLoading && showOnboardingBanner && (
            <section className="mb-8">
              <Alert className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border border-primary/30 rounded-lg shadow-sm">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-6 w-6 text-primary flex-shrink-0" />
                  <AlertDescription className="text-base text-foreground">
                    Get tailored guidance! Help Kal understand your goals and learning style.
                  </AlertDescription>
                </div>
                <div className="flex flex-col items-stretch gap-2 md:flex-row md:items-center md:gap-3 md:w-auto w-full mt-2 md:mt-0">
                  <Button
                    size="sm"
                    className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={handleStartPersonalizationClick}
                    disabled={isStartingOnboarding}
                  >
                    {isStartingOnboarding ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Start Personalization
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full md:w-auto text-muted-foreground hover:bg-muted/50" onClick={handleMaybeLater} disabled={isStartingOnboarding}>
                    Maybe Later
                  </Button>
                </div>
              </Alert>
            </section>
          )}

          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-10 gap-6">
            <div className="lg:col-span-3">
              <HighlightWidget />
            </div>
            <div className="lg:col-span-3">
              <ScheduleWidget />
            </div>
             <div className="md:col-span-2 lg:col-span-4 lg:row-span-2">
               <QuickChatWidget />
             </div>
            <div className="lg:col-span-3">
              <BookRecWidget />
            </div>
            <div className="lg:col-span-3">
              <FileMgmtWidget />
            </div>
          </section>
        </div>
      </main>

      {/* BottomNav is rendered conditionally in App.tsx */}

      <PersonalizationPathModal
        isOpen={isPersonalizationModalOpen}
        onClose={handleClosePersonalizationModal}
        onConfirmPath={handleConfirmPath}
      />

      {initialWizardData && user && (
        <OnboardingWizardModal
            isOpen={isWizardModalOpen}
            onClose={handleCloseWizardModal}
            initialStepData={initialWizardData}
            userId={user.id}
        />
      )}
    </div>
  );
};

export default Dashboard;
