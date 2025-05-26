import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { API_ENDPOINTS, API_AUTH } from '@/config';
// import { toast } from '@/hooks/use-toast'; // Kept commented as per your snippet
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, ExternalLink } from 'lucide-react'; // Added AlertCircle
import { Link } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button'; // Added Button for the icon

// Define a type for the quote recommendation data
interface Quote {
  quote_text: string;
  author: string | null; // Author can be null
}

export const HighlightWidget = () => {
  const { user } = useAuth();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedQuoteForSessionRef = useRef(false);

  useEffect(() => {
    const fetchQuote = async () => {
      if (!user) {
        setLoading(false);
        setQuote(null);
        setError(null);
        if (hasFetchedQuoteForSessionRef.current) {
          hasFetchedQuoteForSessionRef.current = false; // Reset for potential new user or re-login
        }
        // sessionStorage.removeItem(`dailyQuote-${user?.id}`); // Removed as user would be null here
        return;
      }

      const storageKey = `dailyQuote-${user.id}`;

      if (hasFetchedQuoteForSessionRef.current) {
        if (loading) setLoading(false); // Ensure loading spinner stops if it was somehow stuck
        return;
      }

      const storedQuoteString = sessionStorage.getItem(storageKey);
      if (storedQuoteString) {
        try {
          const storedQuoteData: Quote = JSON.parse(storedQuoteString);
          setQuote(storedQuoteData);
          setLoading(false);
          hasFetchedQuoteForSessionRef.current = true;
          return;
        } catch (e) {
          console.error("HighlightWidget: Error parsing stored quote, fetching fresh.", e);
          sessionStorage.removeItem(storageKey);
        }
      }

      console.log("HighlightWidget: Attempting API fetch for quote for user:", user.id);
      setLoading(true);
      setError(null);
      // setQuote(null); // Avoid clearing if there was a previous error and user is retrying

      hasFetchedQuoteForSessionRef.current = true; // Mark attempt

      try {
        const response = await fetch(
          `${API_ENDPOINTS.quoteRecommendation}/api/users/${user.id}/quote-recommendations`,
          {
            headers: {
              'Authorization': `Bearer ${API_AUTH.bearerToken}`,
              'Content-Type': 'application/json',
            },
          }
        );
        
        console.log(`HighlightWidget: Quote API Response Status: ${response.status}`);

        if (response.status === 204) {
          console.log("HighlightWidget: API returned 204 No Content for quote.");
          setQuote(null); // No quote available
          sessionStorage.removeItem(storageKey); // Ensure no stale data is kept if API explicitly says no content
        } else if (response.ok) {
          const responseData = await response.json();
          if (responseData && responseData.recommendations && responseData.recommendations.length > 0) {
            const firstQuote: Quote = responseData.recommendations[0];
            setQuote(firstQuote);
            sessionStorage.setItem(storageKey, JSON.stringify(firstQuote));
          } else {
            console.log("HighlightWidget: No recommendations in quote API response data or invalid structure.");
            setQuote(null); // No recommendations in array
            sessionStorage.removeItem(storageKey);
          }
        } else { // Handle !response.ok and not 204
          let errorMsg = `HTTP error! status: ${response.status}`;
          try {
              const errorData = await response.json();
              errorMsg = errorData.detail || errorData.message || errorMsg;
          } catch (e) { /* Ignore if parsing error body fails */ }
          console.error(`HighlightWidget: Quote API Error - Status ${response.status}, Message: ${errorMsg}`);
          sessionStorage.removeItem(storageKey);
          throw new Error(errorMsg);
        }
      } catch (err: any) {
        console.error('HighlightWidget: Failed to fetch quote:', err);
        setError(err.message || 'Could not load quote.');
        setQuote(null); // Clear quote on error
        // Do not reset hasFetchedQuoteForSessionRef on error here; the attempt was made.
      } finally {
        setLoading(false);
      }
    };

    fetchQuote();
  }, [user]); // Primary dependency

  return (
    <Card className="glass-card h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Today's Highlight</CardTitle>
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link to="/highlights" aria-label="View all highlights">
                <Button variant="ghost" size="icon" className="h-6 w-6" tabIndex={-1}>
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>View all highlights</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardHeader>
      <CardContent className="pt-4 flex-1 flex flex-col justify-center">
        {loading && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2 ml-auto mt-2" /> {/* Author placeholder */}
          </div>
        )}
        {error && !loading && (
          <div className="flex flex-col justify-center items-center text-center h-full">
            <AlertCircle className="h-5 w-5 text-muted-foreground mb-1" />
            <p className="text-xs text-muted-foreground">Quote currently unavailable.</p>
            {/* <p className="text-xs text-destructive/70 mt-1">({error})</p> */}
          </div>
        )}
        {!loading && !error && !user && (
          <div className="flex justify-center items-center h-full">
            <p className="text-sm text-muted-foreground">Sign in to see your daily highlight.</p>
          </div>
        )}
        {!loading && !error && user && quote && (
          <blockquote className="text-center md:text-left">
            <p className="text-base md:text-lg italic text-foreground relative pl-6 pr-6 
                          before:content-['“'] before:absolute before:left-0 before:-top-1 md:before:-top-2 
                          before:text-4xl before:text-muted-foreground/30 before:font-serif 
                          after:content-['”'] after:absolute after:-right-0.5 after:-bottom-2 md:after:-bottom-3 
                          after:text-4xl after:text-muted-foreground/30 after:font-serif">
              {quote.quote_text}
            </p>
            {quote.author && (
              <footer className="mt-2 text-xs md:text-sm text-muted-foreground text-right pr-2">
                — {quote.author}
              </footer>
            )}
          </blockquote>
        )}
        {!loading && !error && user && !quote && (
          <div className="flex justify-center items-center h-full">
            <p className="text-sm text-muted-foreground">No highlight available today.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
