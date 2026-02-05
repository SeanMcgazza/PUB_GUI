'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import type { NavKey } from '@/lib/role-config';
import { 
  Scissors, LayoutDashboard, Calendar, ClipboardList, 
  Users, Sparkles, UserCog, Settings, Menu, Plus, Bell, LogOut
} from 'lucide-react';

// Each nav item now has a key for role-based filtering
const allNavItems: { key: NavKey; href: string; icon: typeof LayoutDashboard; label: string }[] = [
  { key: 'dashboard', href: '/app', icon: LayoutDashboard, label: 'Dashboard' },
  { key: 'calendar',  href: '/app/calendar', icon: Calendar, label: 'Calendar' },
  { key: 'bookings',  href: '/app/bookings', icon: ClipboardList, label: 'Bookings' },
  { key: 'clients',   href: '/app/clients', icon: Users, label: 'Clients' },
  { key: 'services',  href: '/app/services', icon: Sparkles, label: 'Services' },
  { key: 'staff',     href: '/app/staff', icon: UserCog, label: 'Staff' },
  { key: 'settings',  href: '/app/settings', icon: Settings, label: 'Settings' },
];

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { isNavVisible, navLabel } = useRoleAccess();

  // Filter and relabel nav items based on role
  const navItems = useMemo(() => {
    return allNavItems
      .filter((item) => isNavVisible(item.key))
      .map((item) => ({
        ...item,
        label: navLabel(item.key, item.label),
      }));
  }, [isNavVisible, navLabel]);

  // For mobile bottom nav, show first 5 visible items
  const mobileNavItems = navItems.slice(0, 5);
  
  return (
    <div className="min-h-screen bg-cream">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white border-r border-border">
        <div className="flex flex-col flex-1 pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center gap-2 px-4 mb-8">
            <div className="p-2 bg-gold rounded-xl">
              <Scissors className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-xl text-warm-brown">ChairTime</span>
          </div>
          
          <nav className="flex-1 px-3 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/app' && pathname.startsWith(item.href));
              
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all',
                      isActive 
                        ? 'bg-gold/10 text-gold font-medium' 
                        : 'text-muted-foreground hover:bg-muted hover:text-warm-brown'
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute left-0 w-1 h-6 bg-gold rounded-r-full"
                      />
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>
          
          <div className="px-3 mt-auto space-y-3">
            <Link href="/app/bookings/new">
              <Button className="w-full btn-pill bg-gold hover:bg-gold-dark text-white">
                <Plus className="w-4 h-4 mr-2" />
                New Booking
              </Button>
            </Link>
            
            {/* User info & sign out */}
            <div className="border-t border-border pt-3">
              <div className="px-1 mb-2">
                <p className="text-sm font-medium text-warm-brown truncate">
                  {profile?.business_name || user?.user_metadata?.business_name || 'My Salon'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email || ''}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="w-full justify-start text-muted-foreground hover:text-dusty-rose"
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
          <div className="p-1.5 bg-gold rounded-lg">
            <Scissors className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-warm-brown">ChairTime</span>
        </Link>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-dusty-rose rounded-full" />
          </Button>
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
        {mobileNavItems.map((item, index) => {
          const isActive = pathname === item.href || 
            (item.href !== '/app' && pathname.startsWith(item.href));
          
          // Insert FAB in the middle (after index 2)
          if (index === 2) {
            return (
              <div key="fab" className="flex items-center gap-2">
                <MobileNavItem item={item} isActive={isActive} />
                <Link href="/app/bookings/new">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-14 h-14 bg-gold rounded-full flex items-center justify-center shadow-soft-lg -mt-6"
                  >
                    <Plus className="w-6 h-6 text-white" />
                  </motion.button>
                </Link>
              </div>
            );
          }
          
          return <MobileNavItem key={item.href} item={item} isActive={isActive} />;
        })}
      </nav>
    </div>
  );
}

function MobileNavItem({ item, isActive }: { item: { href: string; icon: typeof LayoutDashboard; label: string }; isActive: boolean }) {
  return (
    <Link href={item.href}>
      <div className={cn(
        'flex flex-col items-center gap-1 px-3 py-1',
        isActive ? 'text-gold' : 'text-muted-foreground'
      )}>
        <item.icon className="w-5 h-5" />
        <span className="text-[10px] font-medium">{item.label}</span>
      </div>
    </Link>
  );
}
