'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, MessageSquare, Users, Sparkles,
  CreditCard, Instagram, LogOut, Menu, X, Zap
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { cn, getInitials, trialDaysLeft } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/conversations', label: 'Conversations', icon: MessageSquare },
  { href: '/dashboard/leads', label: 'Leads', icon: Users },
  { href: '/dashboard/ai-settings', label: 'AI Settings', icon: Sparkles },
  { href: '/dashboard/instagram', label: 'Instagram', icon: Instagram },
  { href: '/dashboard/billing', label: 'Billing', icon: CreditCard },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, fetchMe, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login');
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          Loading…
        </div>
      </div>
    );
  }

  if (!user) return null;

  const daysLeft = trialDaysLeft(user.trialEndsAt);
  const showTrialBanner = user.isTrialActive && daysLeft <= 3;

  const Sidebar = ({ mobile = false }) => (
    <aside className={cn(
      'flex flex-col bg-white border-r border-gray-100',
      mobile ? 'w-full h-full' : 'w-60 h-screen sticky top-0'
    )}>
      {/* Logo */}
      <div className="p-5 border-b border-gray-100">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
            <span className="text-white text-xs font-bold">IC</span>
          </div>
          <span className="font-semibold text-gray-900">RepliVa AI</span>
        </Link>
      </div>

      {/* Trial Banner */}
      {showTrialBanner && (
        <div className="mx-3 mt-3 p-3 rounded-lg bg-brand-50 border border-brand-100">
          <p className="text-xs font-medium text-brand-700">
            {daysLeft === 0 ? 'Trial expired' : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left in trial`}
          </p>
          <Link href="/dashboard/billing" className="text-xs text-brand-600 hover:underline mt-0.5 block">
            Upgrade now →
          </Link>
        </div>
      )}

      {/* Automation Status */}
      {user.instagramAccount && (
        <div className="mx-3 mt-3 px-3 py-2.5 rounded-lg bg-gray-50 flex items-center gap-2">
          <div className={cn(
            'w-2 h-2 rounded-full',
            user.instagramAccount.automationOn ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
          )} />
          <span className="text-xs text-gray-600">
            AI {user.instagramAccount.automationOn ? 'Active' : 'Paused'}
          </span>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 mt-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = href === '/dashboard' ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
                active
                  ? 'bg-gray-900 text-white font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-gray-100">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-medium">{getInitials(user.name, user.email)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user.name || 'User'}</p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
          <button onClick={logout} className="text-gray-400 hover:text-gray-600 transition-colors" title="Sign out">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-72 h-full">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-40">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-600">
            <Menu size={20} />
          </button>
          <span className="font-semibold text-gray-900">RepliVa AI</span>
          <div className="w-5" />
        </header>

        <div className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
