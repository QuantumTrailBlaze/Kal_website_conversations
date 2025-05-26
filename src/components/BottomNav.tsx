import { Link, useLocation } from 'react-router-dom';
    import { HomeIcon, MessageSquareIcon, CalendarDaysIcon, FolderIcon, SettingsIcon } from 'lucide-react';
    import { cn } from '@/lib/utils';

    const navItems = [
      { href: '/', label: 'Home', icon: HomeIcon }, // Changed href to '/'
      { href: '/chat', label: 'Chat', icon: MessageSquareIcon },
      { href: '/schedule', label: 'Schedule', icon: CalendarDaysIcon }, // Assuming a /schedule route exists or will be added
      { href: '/files', label: 'File Management', icon: FolderIcon }, // Assuming a /files route
      { href: '/settings', label: 'Settings', icon: SettingsIcon }, // Assuming a /settings route
    ];

    export const BottomNav = () => {
      const location = useLocation();

      return (
        <nav className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md mx-auto">
          <div className="bg-background/80 dark:bg-neutral-900/80 backdrop-blur-md rounded-full shadow-lg border border-border/20 px-4 py-2">
            <ul className="flex justify-around items-center">
              {navItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <li key={item.label}>
                    <Link
                      to={item.href}
                      className={cn(
                        "flex flex-col items-center justify-center space-y-1 p-2 rounded-md transition-colors duration-200",
                        isActive
                          ? "text-primary"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="text-xs font-medium">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>
      );
    };
