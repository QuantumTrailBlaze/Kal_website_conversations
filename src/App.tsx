import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/use-theme";
import { BottomNav } from '@/components/BottomNav';

import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import Settings from "./pages/Settings";
import SchedulePage from "./pages/SchedulePage";
import RecommendationsPage from "./pages/RecommendationsPage";
import FilesPage from "./pages/FilesPage";
import NotFound from "./pages/NotFound";
import { logConfig } from "./config";

// Log configuration in development mode
logConfig();

const queryClient = new QueryClient();

const App = () => {
  const location = useLocation();
  const showBottomNav = location.pathname === '/dashboard';

  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="system">
          <TooltipProvider>
            <AuthProvider>
              <Toaster />
              <Sonner />
              {/* This div ensures the main content area and BottomNav correctly share vertical space */}
              <div className="h-full flex flex-col">
                {/* Removed px-4 sm:px-6 lg:px-8 from here */}
                <main className="flex-1 overflow-y-auto">
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/chat" element={<Chat />} />
                    <Route path="/chat/:sessionId" element={<Chat />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/schedule" element={<SchedulePage />} />
                    <Route path="/recommendations" element={<RecommendationsPage />} />
                    <Route path="/files" element={<FilesPage />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
                {showBottomNav && <BottomNav />}
              </div>
            </AuthProvider>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
};

export default App;
