'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { usePub } from '@/hooks/usePub';
import {
  Beer,
  LayoutDashboard,
  ClipboardList,
  UtensilsCrossed,
  QrCode,
  Settings,
  LogOut,
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
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="min-h-screen bg-atmosphere text-[color:var(--theme-text-primary)]">
      {/* Desktop slim sidebar — icon-only by default; expands on hover/focus */}
      <motion.aside
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        animate={{ width: expanded ? 220 : 72 }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        className="hidden md:flex md:flex-col md:fixed md:inset-y-0 z-30 glass-strong border-r border-glass overflow-hidden"
      >
        <div className="flex flex-col flex-1 pt-5 pb-4">
          <div className="flex items-center gap-3 px-4 mb-8 h-10">
            <div className="p-2 bg-primary-gradient rounded-xl shrink-0 glow-primary-sm">
              <Beer className="w-5 h-5 text-white" />
            </div>
            <AnimatePresence>
              {expanded && (
                <motion.span
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  className="font-serif text-xl whitespace-nowrap"
                >
                  BarTab
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          <nav className="flex-1 px-3 space-y-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/app' && pathname.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href} aria-label={item.label}>
                  <div
                    className={cn(
                      'flex items-center gap-3 px-3 h-11 rounded-xl transition-colors relative',
                      isActive
                        ? 'bg-[color:var(--theme-surface-card)] text-[color:var(--theme-primary-glow)]'
                        : 'text-[color:var(--theme-text-muted)] hover:bg-[color:var(--theme-surface-card)]/60'
                    )}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    <AnimatePresence>
                      {expanded && (
                        <motion.span
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -8 }}
                          className="text-sm font-medium whitespace-nowrap"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {isActive && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-[color:var(--theme-primary)]"
                      />
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>

          <div className="px-3 mt-auto">
            <div className="border-t border-glass pt-3">
              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="px-1 mb-2"
                  >
                    <p className="text-sm font-medium truncate">
                      {pub?.name || 'My Pub'}
                    </p>
                    <p className="text-xs text-[color:var(--theme-text-muted)] truncate">
                      {user?.email || ''}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                aria-label="Sign out"
                className={cn(
                  'w-full text-[color:var(--theme-text-muted)] hover:text-[color:var(--theme-danger)]',
                  expanded ? 'justify-start' : 'justify-center'
                )}
              >
                <LogOut className="w-4 h-4 shrink-0" />
                {expanded && <span className="ml-2">Sign Out</span>}
              </Button>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Mobile top header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 glass border-b border-glass h-14 flex items-center justify-between px-4">
        <Link href="/app" className="flex items-center gap-2">
          <div className="p-1.5 bg-primary-gradient rounded-lg">
            <Beer className="w-4 h-4 text-white" />
          </div>
          <span className="font-serif">BarTab</span>
        </Link>
        <span className="text-sm text-[color:var(--theme-text-muted)]">
          {pub?.name}
        </span>
      </header>

      {/* Main content — leave room for the slim sidebar */}
      <main className="md:pl-[72px] pt-14 md:pt-0 pb-20 md:pb-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="min-h-screen"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass border-t border-glass h-16 flex items-center justify-around px-2">
        {navItems.slice(0, 5).map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/app' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className="flex-1"
            >
              <div
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-1',
                  isActive
                    ? 'text-[color:var(--theme-primary-glow)]'
                    : 'text-[color:var(--theme-text-muted)]'
                )}
              >
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
