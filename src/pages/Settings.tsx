import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { BottomNav } from '@/components/BottomNav';
import { useAuth } from '@/hooks/useAuth';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Mail, Lock, User, Bell, Sparkles, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { OnboardingStatus, OnboardingStepData } from '@/types'; // Import OnboardingStepData
import { format, isValid, parseISO } from 'date-fns';
import { API_ENDPOINTS, API_AUTH } from '@/config';
import { toast } from '@/hooks/use-toast';
import { PersonalizationPathModal } from '@/components/modals/PersonalizationPathModal';
import { OnboardingWizardModal } from '@/components/modals/OnboardingWizardModal';

const Settings = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [receiveSummaries, setReceiveSummaries] = useState(true);
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null | 'error' | 'loading'>('loading');

  // State for onboarding modals (mirrors Dashboard.tsx)
  const [isPersonalizationModalOpen, setIsPersonalizationModalOpen] = useState(false);
  const [isStartingOnboarding, setIsStartingOnboarding] = useState(false);
  const [isWizardModalOpen, setIsWizardModalOpen] = useState(false);
  const [initialWizardData, setInitialWizardData] = useState<OnboardingStepData | null>(null);
  const [onboardingStatusLoadingSettings, setOnboardingStatusLoadingSettings] = useState(false);


  const fetchAndSetOnboardingStatus = async (userId: string) => {
    setOnboardingStatus('loading'); // Set to loading before fetch
    try {
      const response = await fetch(`${API_ENDPOINTS.mentorAgent}/api/onboarding/status?user_id=${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${API_AUTH.bearerToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.warn('Onboarding status not found for user (Settings):', userId);
          const newStatus = { user_id: userId, completed: false, completed_at: null, path_taken: null };
          localStorage.setItem('onboardingStatus', JSON.stringify(newStatus));
          setOnboardingStatus(newStatus);
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } else {
        const data: OnboardingStatus = await response.json();
        localStorage.setItem('onboardingStatus', JSON.stringify(data));
        setOnboardingStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch onboarding status (Settings):', error);
      toast({
        title: 'Error',
        description: 'Could not fetch onboarding status.',
        variant: 'destructive',
      });
      setOnboardingStatus('error'); // Set to error on failure
    }
  };
  
  // Initialize display name and fetch onboarding status
  useEffect(() => {
    if (user) {
      setDisplayName(user.user_metadata?.display_name || user.email?.split('@')[0] || '');
      fetchAndSetOnboardingStatus(user.id);
    } else if (!authLoading) {
      // If no user and not loading, set status to null or error if appropriate
      setOnboardingStatus(null);
    }
  }, [user, authLoading]); // Depend on user and authLoading

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || onboardingStatus === 'loading') {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4 pt-24 pb-24">
          <div className="animate-pulse-soft">Loading Settings...</div>
        </main>
        <BottomNav />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleSaveChanges = () => {
    console.log('Saving display name:', displayName);
    // TODO: Implement Supabase update user metadata
    toast({ title: 'Profile Updated', description: 'Display name changes will be saved (mocked).' });
  };

  const handleChangeEmail = () => {
    console.log('Change Email clicked');
    toast({ title: 'Feature Coming Soon', description: 'Email change functionality is not yet implemented.' });
  };

  const handleChangePassword = () => {
    console.log('Change Password clicked');
    toast({ title: 'Feature Coming Soon', description: 'Password change functionality is not yet implemented.' });
  };

  const handleDeleteAccount = () => {
    console.warn('Delete Account clicked');
    toast({ title: 'Confirmation Required', description: 'Account deletion is a critical action (mocked).', variant: 'destructive' });
  };

  // --- Onboarding Modal Logic (mirrored from Dashboard.tsx) ---
  const handlePersonalizationAction = () => {
    setIsPersonalizationModalOpen(true);
  };

  const handleClosePersonalizationModalInSettings = () => {
    setIsPersonalizationModalOpen(false);
  };

  const handleConfirmPathInSettings = async (chosenPath: string) => {
    if (!user) {
      toast({ title: 'Error', description: 'User not found. Please log in again.', variant: 'destructive' });
      return;
    }
    setIsStartingOnboarding(true);
    console.log(`Settings: Starting onboarding for user ${user.id} with path ${chosenPath}`);

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
      console.log('Onboarding started successfully via API (Settings):', result);
      
      // Update localStorage and local state for onboardingStatus
      const newStatus = { user_id: user.id, completed: false, completed_at: null, path_taken: chosenPath };
      localStorage.setItem('onboardingStatus', JSON.stringify(newStatus));
      setOnboardingStatus(newStatus); // Update state to reflect path taken

      toast({
        title: 'Personalization Path Selected!',
        description: 'Let\'s get started with some questions.',
      });

      if (result && result.question_key && result.message_to_user && (result.next_action === 'ask_user' || result.next_action === 'display_form_element')) {
          setInitialWizardData(result); 
          setIsWizardModalOpen(true);    
      } else if (result && result.next_action === 'complete') { 
          console.log('Onboarding path completed immediately after start (Settings).');
          const completedStatus = { user_id: user.id, completed: true, completed_at: new Date().toISOString(), path_taken: chosenPath };
          localStorage.setItem('onboardingStatus', JSON.stringify(completedStatus));
          setOnboardingStatus(completedStatus); // Update state
          toast({ title: 'Personalization Complete!', description: 'Setup finished instantly.' });
      } else {
          console.error("Backend response for /start did not contain expected first step data or completion signal (Settings):", result);
          toast({
              title: 'Error',
              description: 'Received an unexpected response from the server. Cannot start questions.',
              variant: 'destructive',
          });
      }

    } catch (error: any) {
      console.error('Failed to start onboarding via API (Settings):', error);
      toast({
        title: 'Error Starting Personalization',
        description: error.message || 'Could not start the selected path. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsStartingOnboarding(false);
      setIsPersonalizationModalOpen(false); // Close path modal regardless of outcome
    }
  };
  
  const handleCloseWizardModalInSettings = async () => {
    const storedStatusString = localStorage.getItem('onboardingStatus');
    let isCompleted = false;
    if (storedStatusString) {
        try {
            const parsedStatus: OnboardingStatus = JSON.parse(storedStatusString);
            isCompleted = parsedStatus?.completed === true;
        } catch (e) {
            console.error("Error parsing onboardingStatus from localStorage (Settings)", e);
        }
    }
    console.log(`Closing wizard (Settings). Is onboarding completed? ${isCompleted}`);

    if (!isCompleted && user?.id) {
        console.log(`Onboarding not complete (Settings). Attempting to delete preferences for user: ${user.id}`);
        try {
            const deleteEndpoint = `/api/users/${encodeURIComponent(user.id)}/preferences`;
            const deleteUrl = `${import.meta.env.VITE_MENTOR_AGENT_API_URL}${deleteEndpoint}`;

            const response = await fetch(deleteUrl, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${API_AUTH.bearerToken}` }
            });

            if (!response.ok) {
              let errorDetails = `HTTP error! status: ${response.status}`;
              try { const errorData = await response.json(); errorDetails = errorData.detail || errorData.message || errorDetails; } catch (jsonError) { /* Ignore */ }
              throw new Error(errorDetails);
            }
            console.log(`Successfully called delete preferences endpoint for user (Settings): ${user.id}`);
            toast({ title: 'Onboarding Paused', description: 'Your progress has been reset.', variant: 'default' });
        } catch (error: any) {
            console.error('Failed to delete user preferences on wizard close (Settings):', error);
            toast({ title: 'Cleanup Issue', description: error.message || 'Could not fully reset onboarding state.', variant: 'warning' });
        }
    } else if (isCompleted) {
         console.log(`Onboarding completed (Settings). Skipping preference deletion for user: ${user?.id}`);
    }
    
    setIsWizardModalOpen(false);
    setInitialWizardData(null); 

    // Re-fetch status to ensure Settings UI is up-to-date
    if (user) {
      setOnboardingStatusLoadingSettings(true);
      await fetchAndSetOnboardingStatus(user.id);
      setOnboardingStatusLoadingSettings(false);
    }
  };

  // --- End Onboarding Modal Logic ---


  const formatCompletionDate = (dateString: string | undefined | null): string => {
    if (!dateString) return 'N/A';
    try {
      const date = parseISO(dateString);
      if (isValid(date)) {
        return format(date, 'MMMM d, yyyy');
      }
      return 'Invalid Date';
    } catch (e) {
      console.error("Error formatting date:", e);
      return 'Invalid Date';
    }
  };

  const renderPersonalizationContent = () => {
    if (onboardingStatus === 'loading' || onboardingStatusLoadingSettings) {
      return <p className="text-sm text-muted-foreground animate-pulse-soft">Loading status...</p>;
    }
    if (onboardingStatus === 'error') {
       return <p className="text-sm text-destructive">Could not load personalization status. Please try refreshing.</p>;
    }
    if (onboardingStatus && onboardingStatus.completed === true) {
      return (
        <div className="text-sm space-y-1">
          <p><span className="font-medium">Status:</span> Completed</p>
          <p><span className="font-medium">Last completed:</span> {formatCompletionDate(onboardingStatus.completed_at)}</p>
          <p><span className="font-medium">Path Taken:</span> {onboardingStatus.path_taken || 'N/A'}</p>
        </div>
      );
    }
    const statusText = onboardingStatus === null || onboardingStatus.completed === false
      ? 'Not yet completed.'
      : 'Unknown status.'; // Should ideally not happen if loading/error handled
    return (
      <div className="text-sm space-y-1">
         <p><span className="font-medium">Status:</span> {statusText}</p>
      </div>
    );
  };

  const getPersonalizationButtonText = () => {
     if (onboardingStatus && typeof onboardingStatus === 'object' && onboardingStatus.completed === true) {
       return 'Update Personalization';
     }
     return 'Start Personalization';
  };


  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24 pb-24 px-4">
        <div className="container max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Settings</h1>

          <div className="grid gap-8">
            {/* Account Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" /> Account Management
                </CardTitle>
                <CardDescription>Manage your email, password, and account status.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Email:</span>
                    <span className="text-sm font-medium">{user.email}</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleChangeEmail}>
                    Change Email
                  </Button>
                </div>
                <Separator />
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                   <div className="flex items-center gap-2">
                     <Lock className="h-4 w-4 text-muted-foreground" />
                     <span className="text-sm text-muted-foreground">Password:</span>
                     <span className="text-sm font-medium">********</span>
                   </div>
                  <Button variant="outline" size="sm" onClick={handleChangePassword}>
                    Change Password
                  </Button>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-6">
                 <Button variant="destructive" size="sm" onClick={handleDeleteAccount}>
                   <Trash2 className="mr-2 h-4 w-4" /> Delete Account
                 </Button>
              </CardFooter>
            </Card>

            {/* Profile Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" /> Profile Settings
                </CardTitle>
                <CardDescription>Update your public display name.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    type="text"
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your display name"
                  />
                </div>
              </CardContent>
              <CardFooter className="border-t pt-6">
                <Button size="sm" onClick={handleSaveChanges}>Save Changes</Button>
              </CardFooter>
            </Card>

            {/* Notifications Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" /> Notification Preferences
                </CardTitle>
                <CardDescription>Control how you receive communications.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between space-x-4">
                  <Label htmlFor="emailSummaries" className="flex flex-col space-y-1">
                    <span>Receive email summaries and tips</span>
                    <span className="font-normal leading-snug text-muted-foreground">
                      Get periodic updates and helpful content delivered to your inbox.
                    </span>
                  </Label>
                  <Switch
                    id="emailSummaries"
                    checked={receiveSummaries}
                    onCheckedChange={setReceiveSummaries}
                    aria-label="Toggle email summaries"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Mentor Personalization Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" /> Mentor Personalization (Kal)
                </CardTitle>
                <CardDescription>
                  Help Kal tailor guidance to your unique goals and learning style by completing this personalization.
                </CardDescription>
              </CardHeader>
              <CardContent>
                 {renderPersonalizationContent()}
              </CardContent>
              <CardFooter className="border-t pt-6">
                <Button
                  size="sm"
                  onClick={handlePersonalizationAction}
                  disabled={onboardingStatus === 'loading' || onboardingStatus === 'error' || isStartingOnboarding || onboardingStatusLoadingSettings}
                >
                  {(isStartingOnboarding || onboardingStatusLoadingSettings) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {getPersonalizationButtonText()}
                </Button>
              </CardFooter>
            </Card>

            {/* Danger Zone Alert */}
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Danger Zone</AlertTitle>
              <AlertDescription>
                Deleting your account is permanent and cannot be undone. All your data will be removed.
                Proceed with caution. The "Delete Account" button is in the Account Management section above.
              </AlertDescription>
            </Alert>

          </div>
        </div>
      </main>

      <BottomNav />

      {/* Modals for Onboarding Flow */}
      <PersonalizationPathModal
        isOpen={isPersonalizationModalOpen}
        onClose={handleClosePersonalizationModalInSettings}
        onConfirmPath={handleConfirmPathInSettings}
      />

      {initialWizardData && user && (
        <OnboardingWizardModal
            isOpen={isWizardModalOpen}
            onClose={handleCloseWizardModalInSettings}
            initialStepData={initialWizardData}
            userId={user.id}
        />
      )}
    </div>
  );
};

export default Settings;
