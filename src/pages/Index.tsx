import { Navbar } from '@/components/Navbar';
import { HeroSection } from '@/components/HeroSection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRightIcon, BrainIcon, GraduationCapIcon, LightbulbIcon, MessageSquareIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <HeroSection />
        
        {/* Features Section */}
        <section className="py-20 bg-white">
          <div className="container px-4 md:px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                How Mentor Helps You Learn
              </h2>
              <p className="text-lg text-muted-foreground">
                Our AI-powered platform adapts to your unique learning style and helps you achieve your goals faster.
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Feature 1 */}
              <Card className="glass-card card-hover">
                <CardHeader className="pb-2">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <BrainIcon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">
                    Customized Learning Paths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Receive actionable advice and curated resources based on your individual needs.
                  </p>
                </CardContent>
              </Card>
              
              {/* Feature 2 */}
              <Card className="glass-card card-hover">
                <CardHeader className="pb-2">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <MessageSquareIcon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">
                    Skill Enhancement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Practice daily challenges, build projects, and collaborate with others—all guided by Kalassa.
                  </p>
                </CardContent>
              </Card>
              
              {/* Feature 3 */}
              <Card className="glass-card card-hover">
                <CardHeader className="pb-2">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <LightbulbIcon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">
                    Goal-Oriented Mentorship
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Stay focused with clear milestones and progress tracking.
                  </p>
                </CardContent>
              </Card>
              
              {/* Feature 4 */}
              <Card className="glass-card card-hover">
                <CardHeader className="pb-2">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <GraduationCapIcon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">
                    Knowledge Tracking
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Track your progress and see how your knowledge grows over time.
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <div className="mt-16 text-center">
              <Link to="/signup">
                <Button size="lg">
                  Take the First Step Today
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-primary/10 to-accent/10">
          <div className="container px-4 md:px-6">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to start your journey?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Kalassa isn’t just a tool—it’s your partner in success. Whether you’re aiming to master programming, improve productivity, or learn something new, Kalassa provides the mentorship you need to thrive.
              </p>
              <Link to="/signup">
                <Button size="lg" className="btn-gradient">
                  Get Started for Free
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="bg-white py-12 border-t">
        <div className="container px-4 md:px-6">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <h3 className="text-lg font-semibold mb-4">Kalassa</h3>
              <p className="text-sm text-muted-foreground">
               Kalassa is more than an app; it’s a commitment to helping you achieve greatness. Let’s grow together!
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link to="/" className="text-sm text-muted-foreground hover:text-primary">Home</Link></li>
                <li><Link to="/dashboard" className="text-sm text-muted-foreground hover:text-primary">Dashboard</Link></li>
                <li><Link to="/chat" className="text-sm text-muted-foreground hover:text-primary">Chat</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-muted-foreground hover:text-primary">Privacy Policy</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-primary">Terms of Service</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-primary">Cookie Policy</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <ul className="space-y-2">
                <li><a href="mailto:info@mentor.ai" className="text-sm text-muted-foreground hover:text-primary">info@mentor.ai</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-primary">Support</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t text-center">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Kalassa. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
