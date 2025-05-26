import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth'; // Ensure correct import
import { ArrowRightIcon } from 'lucide-react';

export const HeroSection = () => {
  // This call requires HeroSection to be rendered inside AuthProvider
  const { user } = useAuth(); 

  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      {/* Background elements - with dark mode support */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 dark:from-primary/10 dark:to-accent/10 z-0"></div>
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-radial from-accent/20 to-transparent dark:from-accent/10 opacity-50"></div>
      <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-primary/10 dark:bg-primary/5 rounded-full blur-3xl"></div>
      
      <div className="container relative z-10 px-4 md:px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          <div className="flex flex-col space-y-6 animate-fade-in">
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Empower Your Growth with <span className="text-gradient">Kalassa: Your Ultimate Mentor</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-lg">
              Looking to unlock your full potential? Kalassa is your personalized AI mentor, designed to adapt to your learning style and accelerate your journey toward self-improvement.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              {/* Conditional rendering based on user state from useAuth */}
              {user ? (
                <Link to="/dashboard">
                  <Button size="lg" className="btn-gradient">
                    Go to Dashboard
                    <ArrowRightIcon className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/signup">
                    <Button size="lg" className="btn-gradient">
                      Get Started
                      <ArrowRightIcon className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button size="lg" variant="outline">
                      Log in
                    </Button>
                  </Link>
                </>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-lg md:text-xl text-muted-foreground max-w-lg">
              Why Choose Kalassa?
              </p>
            </div>
            <div className="glass-card p-4 mt-8 shadow-sm">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">24/7</div>
                  <p className="text-sm text-muted-foreground">Available</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">100%</div>
                  <p className="text-sm text-muted-foreground">Personalized</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">∞</div>
                  <p className="text-sm text-muted-foreground">Knowledge</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="relative animate-slide-in-right">
            <div className="relative p-4 rounded-2xl glass-card overflow-hidden">
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-primary/10 dark:bg-primary/5 rounded-full blur-2xl"></div>
              
              <div className="py-3 px-4 bg-primary/10 dark:bg-primary/5 rounded-lg mb-4 flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground shrink-0">
                  <span className="text-sm">You</span>
                </div>
                <div>
                  <p className="text-sm">How can you help me to improve my focus and productivity?</p>
                </div>
              </div>
              
              <div className="py-3 px-4 bg-accent/10 dark:bg-accent/5 rounded-lg flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-accent-foreground shrink-0">
                  <span className="text-sm">Kal</span>
                </div>
                <div>
                  <p className="text-sm">Great question! To enhance your focus and time management, I suggest:</p>
                  <ol className="text-sm list-decimal pl-5 mt-2 space-y-1">
                    <li>Practicing mindfulness to stay present.</li>
                    <li>Using time-blocking for better task organization.</li>
                    <li>Setting clear, achievable daily goals.</li>
                    <li>Taking regular breaks to recharge.</li>
                  </ol>
                  <p className="text-sm mt-2">Would you like me to recommend a simple productivity routine to get started?</p>
                </div>
              </div>
            </div>
            
            <div className="absolute -z-10 -top-4 -left-4 w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 dark:from-primary/10 dark:to-accent/10 rounded-2xl transform rotate-3"></div>
          </div>
        </div>
      </div>
    </section>
  );
};
