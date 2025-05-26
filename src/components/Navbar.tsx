import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  MenuIcon,
  XIcon,
  UserIcon,
  LogOutIcon,
  HomeIcon,
  MessageSquareIcon,
  CalendarDaysIcon,
  FolderIcon,
  SettingsIcon,
  LayoutDashboardIcon, // This is the icon we want for consistency
  LayoutGrid // Will remain imported but not used for these specific dashboard links
} from 'lucide-react';

export const Navbar = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isDashboardPage = location.pathname === '/dashboard';
  const isHomePage = location.pathname === '/';

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const getUserInitial = () => {
    if (!user?.email) return 'U';
    return user.email.charAt(0).toUpperCase();
  };

  const navItems = [
    { href: '/', label: 'Home', icon: HomeIcon },
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboardIcon }, // Dropdown uses LayoutDashboardIcon
    { href: '/chat', label: 'Chat', icon: MessageSquareIcon },
    { href: '/schedule', label: 'Schedule', icon: CalendarDaysIcon },
    { href: '/files', label: 'Files', icon: FolderIcon },
    { href: '/settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 px-6 py-4 transition-all duration-300 ${
      scrolled ? 'bg-white/80 backdrop-blur-md shadow-sm dark:bg-background/80' : 'bg-transparent'
    }`}>
      <div className="container flex items-center justify-between mx-auto">
        {/* Left Group: Logo & New Mobile-Only Dashboard Icon Link */}
        <div className="flex items-center">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary">Kalassa</span>
          </Link>
          {/* NEW Mobile-Only "Dashboard" Icon Link - Icon changed to LayoutDashboardIcon */}
          {!(isDashboardPage || isHomePage) && (
            <Link
              to="/dashboard"
              className="md:hidden flex items-center text-muted-foreground hover:text-foreground transition-colors ml-4" // ml-4 for spacing
              aria-label="Go to Dashboard"
            >
              <LayoutDashboardIcon className="h-5 w-5" /> {/* Icon changed */}
            </Link>
          )}
        </div>

        {/* Center Group: Conditional "Back to Dashboard" Link (Desktop) - Icon changed to LayoutDashboardIcon */}
        <div className="hidden md:flex items-center"> {/* This parent div ensures it's part of desktop layout */}
          {!(isDashboardPage || isHomePage) && (
            <Link
              to="/dashboard"
              className="hidden md:flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors" // Link itself also controls responsive visibility
              aria-label="Go to Dashboard"
            >
              <LayoutDashboardIcon className="h-4 w-4 mr-2" /> {/* Icon changed */}
              Dashboard
            </Link>
          )}
        </div>

        {/* Right Group: Auth Buttons / User Menu */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative w-8 h-8 rounded-full">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user.user_metadata?.avatar_url} />
                    <AvatarFallback>{getUserInitial()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {navItems.map((item) => (
                  <DropdownMenuItem key={item.label} asChild>
                    <Link to={item.href} className="flex items-center w-full cursor-pointer">
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer text-red-600 dark:text-red-500 focus:bg-red-100 dark:focus:bg-red-900/50 focus:text-red-700 dark:focus:text-red-400">
                  <LogOutIcon className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="sm">Sign up</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2"
          onClick={toggleMobileMenu}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? (
            <XIcon className="h-6 w-6" />
          ) : (
            <MenuIcon className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-white dark:bg-background shadow-lg py-4 px-6 md:hidden animate-fade-in">
          <div className="space-y-4">
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              {user ? (
                <div className="space-y-1">
                  <div className="flex items-center space-x-3 px-2 py-2 mb-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user.user_metadata?.avatar_url} />
                      <AvatarFallback>{getUserInitial()}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium truncate">{user.email}</span>
                  </div>
                  {navItems.map((item) => (
                     <Link
                       key={item.label}
                       to={item.href}
                       className="flex items-center w-full px-2 py-2 text-sm font-medium rounded-md text-foreground/80 hover:text-primary hover:bg-accent"
                     >
                       <item.icon className="mr-3 h-5 w-5" />
                       {item.label}
                     </Link>
                  ))}
                  <div className="pt-2 mt-2 border-t border-border">
                    <Button
                      variant="ghost"
                      className="w-full justify-start px-2 py-2 text-red-600 dark:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-700 dark:hover:text-red-400"
                      onClick={() => signOut()}
                    >
                      <LogOutIcon className="mr-3 h-5 w-5" />
                      Log out
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link to="/login">
                    <Button variant="ghost" className="w-full justify-start">
                      <UserIcon className="mr-2 h-4 w-4" />
                      Log in
                    </Button>
                  </Link>
                  <Link to="/signup">
                    <Button className="w-full">Sign up</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
