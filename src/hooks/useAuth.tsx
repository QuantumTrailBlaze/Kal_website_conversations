import React, { useState, useEffect, createContext, useContext } from 'react';
    import { Session, User } from '@supabase/supabase-js';
    import { supabase } from '@/lib/supabase';
    import { toast } from '@/hooks/use-toast';

    interface AuthContextType {
      session: Session | null;
      user: User | null;
      loading: boolean;
      signUp: (email: string, password: string) => Promise<void>;
      signIn: (email: string, password: string) => Promise<void>;
      signOut: () => Promise<void>;
    }

    const AuthContext = createContext<AuthContextType | undefined>(undefined);

    export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
      const [session, setSession] = useState<Session | null>(null);
      const [user, setUser] = useState<User | null>(null);
      const [loading, setLoading] = useState(true);

      useEffect(() => {
        // Get initial session
        const getInitialSession = async () => {
          try {
            const { data: { session: initialSession } } = await supabase.auth.getSession();
            setSession(initialSession);
            setUser(initialSession?.user ?? null);
          } catch (error) {
            console.error('Error fetching initial session:', error);
          } finally {
            setLoading(false);
          }
        };

        getInitialSession();

        // Set up listener for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (_event, newSession) => {
            setSession(newSession);
            setUser(newSession?.user ?? null);
            setLoading(false);
          }
        );

        return () => {
          subscription.unsubscribe();
        };
      }, []);

      const signUp = async (email: string, password: string) => {
        try {
          setLoading(true);
          const { error } = await supabase.auth.signUp({ email, password });

          if (error) {
            throw error;
          }

          toast({
            title: 'Success!',
            description: 'Please check your email for verification link',
          });
        } catch (error: any) {
          toast({
            title: 'Sign up failed',
            description: error.message,
            variant: 'destructive',
          });
          throw error;
        } finally {
          setLoading(false);
        }
      };

      const signIn = async (email: string, password: string) => {
        try {
          setLoading(true);
          const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            throw error;
          }

          toast({
            title: 'Welcome back!',
            description: 'You have successfully signed in',
          });
        } catch (error: any) {
          toast({
            title: 'Sign in failed',
            description: error.message,
            variant: 'destructive',
          });
          throw error;
        } finally {
          setLoading(false);
        }
      };

      const signOut = async () => {
        try {
          setLoading(true);
          await supabase.auth.signOut();
          toast({
            title: 'Signed out',
            description: 'You have been successfully signed out',
          });
        } catch (error: any) {
          toast({
            title: 'Sign out failed',
            description: error.message,
            variant: 'destructive',
          });
        } finally {
          setLoading(false);
        }
      };

      const value = {
        session,
        user,
        loading,
        signUp,
        signIn,
        signOut,
      };

      return (
        <AuthContext.Provider value={value}>
          {children}
        </AuthContext.Provider>
      );
    };

    export const useAuth = () => {
      const context = useContext(AuthContext);
      if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
      }
      return context;
    };
