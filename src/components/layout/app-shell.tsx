'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { usePub } from '@/hooks/usePub';
import { 
  Beer, LayoutDashboard, ClipboardList, 
  UtensilsCrossed, QrCode, Settings, LogOut
} from 'lucide-react';

const navItems = [
  { href: '/app', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/app/orders', icon: ClipboardList, label: 'Orders' },
  { href: '/app/menu', icon: UtensilsCrossed, label: 'Menu' },
  { href: '/app/tables', icon: QrCode, label: 'Tables' },
  { href: '/app/settings', icon: Settings, label: 'Settings' },
];

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { pub } = usePub();

  // For mobile bottom nav, show first 4 items
  const mobileNavItems = navItems.slice(0, 4);
  
  return (
    <div className="min-h-screen bg-cream">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white border-r border-border">
        <div className="flex flex-col flex-1 pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center gap-2 px-4 mb-8">
            <div className="p-2 bg-amber-600 rounded-xl">
              <Beer className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-xl text-warm-brown">BarTab</span>
          </div>
          
          <nav className="flex-1 px-3 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/app' && pathname.startsWith(item.href));
              
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all relative',
                      isActive 
                        ? 'bg-amber-600/10 text-amber-600 font-medium' 
                        : 'text-muted-foreground hover:bg-muted hover:text-warm-brown'
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute left-0 w-1 h-6 bg-amber-600 rounded-r-full"
                      />
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>
          
          <div className="px-3 mt-auto space-y-3">
            {/* User info & sign out */}
            <div className="border-t border-border pt-3">
              <div className="px-1 mb-2">
                <p className="text-sm font-medium text-warm-brown truncate">
                  {pub?.name || 'My Pub'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email || ''}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="w-full justify-start text-muted-foreground hover:text-red-500"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </aside>
      
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-lg border-b border-border h-14 flex items-center justify-between px-4">
        <Link href="/app" className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-600 rounded-lg">
            <Beer className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-warm-brown">BarTab</span>
        </Link>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{pub?.name}</span>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="md:pl-64 pt-14 md:pt-0 pb-20 md:pb-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="min-h-screen"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      
      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border h-16 flex items-center justify-around px-2">
        {mobileNavItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/app' && pathname.startsWith(item.href));
          
          return (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                'flex flex-col items-center gap-1 px-3 py-1',
                isActive ? 'text-amber-600' : 'text-muted-foreground'
              )}>
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
