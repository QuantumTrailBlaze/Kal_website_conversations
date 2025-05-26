import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

// Form validation schema
const authSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type AuthFormValues = z.infer<typeof authSchema>;

export const AuthForm = () => {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');

  // Initialize react-hook-form
  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Handle form submission
  const onSubmit = async (data: AuthFormValues) => {
    setIsLoading(true);
    
    try {
      if (activeTab === 'login') {
        await signIn(data.email, data.password);
        navigate('/dashboard');
      } else {
        await signUp(data.email, data.password);
        toast({
          title: 'Account created!',
          description: 'Please check your email for verification',
        });
        // Switch to login tab after signup
        setActiveTab('login');
        form.reset();
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      // Error is already handled in the auth context
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto glass-card">
      <CardHeader>
        <CardTitle className="text-center text-2xl">
          {activeTab === 'login' ? 'Welcome back' : 'Create an account'}
        </CardTitle>
        <CardDescription className="text-center">
          {activeTab === 'login' 
            ? 'Enter your credentials to access your account' 
            : 'Sign up to get started with Mentor'}
        </CardDescription>
      </CardHeader>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'signup')} className="w-full">
        <TabsList className="grid grid-cols-2 w-[90%] mx-auto">
          <TabsTrigger value="login">Log in</TabsTrigger>
          <TabsTrigger value="signup">Sign up</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab}>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <CardContent className="space-y-4 pt-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="you@example.com" 
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {activeTab === 'login' ? 'Logging in...' : 'Signing up...'}
                    </>
                  ) : (
                    activeTab === 'login' ? 'Log in' : 'Sign up'
                  )}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </TabsContent>
      </Tabs>
    </Card>
  );
};
