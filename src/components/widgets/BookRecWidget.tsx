import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ExternalLink, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';
import { API_ENDPOINTS, API_AUTH } from '@/config';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

// Define a type for the book recommendation data
interface BookRecommendation {
  image_url: string | null;
  title: string;
  author: string;
  category: string;
  reason: string;
}

export const BookRecWidget = () => {
  const { user } = useAuth();
  const [recommendation, setRecommendation] = useState<BookRecommendation | null>(null);
  const [loading, setLoading] = useState(true); // Start true for initial load attempt
  const [error, setError] = useState<string | null>(null);
  const [imageValid, setImageValid] = useState(false);
  const hasFetchedForThisSessionRef = useRef(false); // Tracks if we've ATTEMPTED to fetch for this user in this browser session

  useEffect(() => {
    const initializeRecommendation = async () => {
      // --- 1. Handle No User ---
      if (!user) {
        console.log("BookRecWidget: No user, resetting state.");
        setLoading(false);
        setRecommendation(null);
        setError(null);
        setImageValid(false);
        hasFetchedForThisSessionRef.current = false; // Reset fetch attempt flag for the session
        return;
      }

      const storageKey = `bookRec-${user.id}`;

      // --- 2. Check if Already Attempted Fetch/Load in this Session for this User ---
      if (hasFetchedForThisSessionRef.current) {
        console.log("BookRecWidget: Already attempted fetch/load for this user in this session. Current recommendation state:", recommendation ? "Exists" : "Null", "Loading state:", loading);
        // If we already "attempted" and there's no recommendation, it means the previous attempt resulted in no data or an error.
        // We should not trigger a new loading sequence.
        // If loading is true here, it means this effect ran while a previous one (for the same user) was still in its async fetch.
        // The `hasFetchedForThisSessionRef` should prevent a new fetch, but we ensure loading is eventually false.
        if (loading && !recommendation && !error) { // If still loading from a previous cycle but we decided not to fetch now
             // This case is tricky. If loading is true, an operation is in flight.
             // The ref guard should prevent a *new* operation.
             // If loading is true, and we have no rec/error, it implies the fetch is ongoing.
             // Let's ensure loading is false if we are *not* proceeding to fetch.
        } else if (!loading && !recommendation && !error) {
            // Attempted, not loading, no rec, no error -> implies 204 or empty data from previous attempt.
        } else if (error) {
            // Attempted, and there's an error state.
        }
        // The primary goal of this block is to prevent a new fetch if one was already ATTEMPTED.
        // If loading is true, it means a fetch might be in progress from the initial mount, let it complete.
        // The key is not to START a new fetch.
        return;
      }

      // --- 3. Try Loading from Session Storage ---
      const storedRecString = sessionStorage.getItem(storageKey);
      if (storedRecString) {
        try {
          const storedRec: BookRecommendation = JSON.parse(storedRecString);
          console.log("BookRecWidget: Found recommendation in sessionStorage:", storedRec);
          setRecommendation(storedRec);
          if (storedRec.image_url) {
            const img = new Image();
            img.onload = () => { console.log("BookRecWidget (Storage): Image loaded successfully."); setImageValid(true); };
            img.onerror = () => { console.warn(`BookRecWidget (Storage): Image failed to load: ${storedRec.image_url}`); setImageValid(false); };
            img.src = storedRec.image_url;
          } else {
            setImageValid(false);
          }
          setLoading(false);
          hasFetchedForThisSessionRef.current = true; // Mark as "loaded from storage" for this session
          return;
        } catch (e) {
          console.error("BookRecWidget: Error parsing stored recommendation, will fetch fresh.", e);
          sessionStorage.removeItem(storageKey); // Clear invalid stored data
        }
      }

      // --- 4. Proceed to Fetch from API (Not loaded from session storage and not yet attempted for this session ref) ---
      console.log("BookRecWidget: Attempting API fetch for user:", user.id);
      setLoading(true);
      setError(null);
      setImageValid(false); // Reset image validity before new fetch
      
      hasFetchedForThisSessionRef.current = true; // <<< KEY CHANGE: Mark attempt as made BEFORE the API call

      const targetUserId = user.id;
      const baseUrl = API_ENDPOINTS.bookRecommendation;
      const token = API_AUTH.bearerToken;
      const fullUrl = `${baseUrl}/api/users/${encodeURIComponent(targetUserId)}/book-recommendations`;

      console.log("BookRecWidget: Request URL:", fullUrl);
      console.log("BookRecWidget: Token being used (first 10 chars):", token ? token.substring(0, 10) + "..." : "TOKEN_MISSING_OR_EMPTY");

      try {
        const response = await fetch(fullUrl, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
        console.log(`BookRecWidget: Response status for ${fullUrl}: ${response.status}`);

        if (response.status === 204) {
            console.log("BookRecWidget: API returned 204 No Content.");
            setRecommendation(null);
            setImageValid(false);
            sessionStorage.removeItem(storageKey); // No valid rec to store
        } else if (response.ok) {
            const responseData = await response.json();
            console.log("BookRecWidget: Successfully fetched raw responseData:", JSON.stringify(responseData));

            if (responseData && responseData.recommendations && responseData.recommendations.length > 0) {
                const firstBook: BookRecommendation = responseData.recommendations[0];
                console.log("BookRecWidget: Extracted firstBook:", JSON.stringify(firstBook));
                setRecommendation(firstBook);
                sessionStorage.setItem(storageKey, JSON.stringify(firstBook)); 

                if (firstBook.image_url) {
                  console.log("BookRecWidget (API): Image URL found:", firstBook.image_url, ". Validating...");
                  const img = new Image();
                  img.onload = () => { console.log("BookRecWidget (API): Image loaded successfully."); setImageValid(true); };
                  img.onerror = () => { console.warn(`BookRecWidget (API): Image failed to load: ${firstBook.image_url}`); setImageValid(false); };
                  img.src = firstBook.image_url;
                } else {
                  console.log("BookRecWidget (API): No image_url in firstBook.");
                  setImageValid(false);
                }
            } else {
                console.log("BookRecWidget: No recommendations in API response data or invalid structure.");
                setRecommendation(null);
                setImageValid(false);
                sessionStorage.removeItem(storageKey); // No valid rec to store
            }
        } else { // Handle !response.ok
          const errorBodyText = await response.text();
          console.error(`BookRecWidget: API Error - Status ${response.status}, Body: ${errorBodyText}`);
          let errorMsg = `HTTP error! status: ${response.status}`;
          try {
              const errorData = JSON.parse(errorBodyText);
              errorMsg = errorData.detail || errorData.message || `Failed with status: ${response.status}`;
          } catch (e) {
            errorMsg = response.statusText || errorMsg;
          }
          sessionStorage.removeItem(storageKey); // Clear potentially stale storage on error
          throw new Error(errorMsg);
        }
      } catch (err: any) {
        console.error('BookRecWidget: CATCH BLOCK - Error during fetch/processing:', err);
        const displayError = err.message || 'Could not load recommendation.';
        setError(displayError);
        setRecommendation(null); // Ensure no stale recommendation is shown
        setImageValid(false);    // Ensure image is marked invalid
        // DO NOT reset hasFetchedForThisSessionRef.current here on error. The "attempt" for this session has been made.
        toast({
          title: "Error",
          description: `Book Recommendation: ${displayError}`,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    initializeRecommendation();

  }, [user]); 

  return (
    <Card className="glass-card h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Book Recommendation</CardTitle>
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link to="/recommendations" aria-label="View all recommendations">
                <Button variant="ghost" size="icon" className="h-6 w-6" tabIndex={-1}>
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>View all recommendations</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardHeader>
      <CardContent className="pt-4 flex-grow flex flex-col">

        {loading && (
          <div className="space-y-3 h-full flex flex-col justify-center items-center flex-grow">
            <Skeleton className="h-32 w-24" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-full mt-2" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        )}

        {error && !loading && (
          <div className="h-full flex flex-col justify-center items-center text-center px-4 space-y-1 flex-grow">
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Recommendation currently unavailable.
            </p>
            {/* Optional: If you want to still show the actual error for debugging in UI, make it smaller */}
            {/* <p className="text-xs text-destructive/70 mt-1">({error})</p> */}
          </div>
        )}

        {!loading && !error && !user && (
           <div className="h-full flex justify-center items-center flex-grow">
             <p className="text-sm text-muted-foreground text-center px-4">Sign in to see recommendations.</p>
           </div>
        )}

        {!loading && !error && user && recommendation && (
          <>
            <div className="space-y-3 text-center sm:text-left sm:flex sm:space-x-4 sm:items-start">
              <div className="flex-shrink-0 mx-auto sm:mx-0 mb-4 sm:mb-0">
                {recommendation.image_url && imageValid ? (
                  <img
                    src={recommendation.image_url}
                    alt={`Cover of ${recommendation.title}`}
                    className="h-32 w-auto max-w-[8rem] object-contain rounded-md shadow-md mx-auto bg-muted"
                    onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'; 
                        setImageValid(false); 
                        console.warn(`BookRecWidget: Image render error for ${recommendation.image_url}`);
                      }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-32 w-24 bg-muted/50 rounded-md shadow-inner text-xs text-muted-foreground mx-auto">
                    No Image
                  </div>
                )}
              </div>

              <div className="flex-1">
                <h3 className="text-base font-semibold leading-tight mt-0">{recommendation.title}</h3>
                <p className="text-sm text-muted-foreground">by {recommendation.author}</p>
                <p className="text-xs text-muted-foreground mt-1">Category: {recommendation.category}</p>
                <div className="mt-3 text-left">
                  <h4 className="text-sm font-medium">Why this book?</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {recommendation.reason}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {!loading && !error && user && !recommendation && (
           <div className="h-full flex justify-center items-center flex-grow">
             <p className="text-sm text-muted-foreground text-center px-4">No book recommendation available right now.</p>
           </div>
        )}
      </CardContent>
    </Card>
  );
};
