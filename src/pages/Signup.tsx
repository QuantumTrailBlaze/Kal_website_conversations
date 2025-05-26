import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthForm } from '@/components/AuthForm';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/hooks/useAuth';

const Signup = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center p-4 pt-24">
        <div className="w-full max-w-md">
          <AuthForm />
        </div>
      </main>
    </div>
  );
};

export default Signup;
