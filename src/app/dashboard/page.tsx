'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MessageSquare, Users, Zap, TrendingUp, Instagram, ArrowRight, CheckCircle2, XCircle, Clock } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { cn, timeAgo } from '@/lib/utils';
import toast from 'react-hot-toast';

interface DashboardData {
  stats: {
    totalConversations: number;
    totalLeads: number;
    messagesThisWeek: number;
    aiRepliesThisWeek: number;
    successRate: number;
  };
  recentActivity: Array<{
    type: string;
    status: string;
    source: string;
    createdAt: string;
    error?: string;
  }>;
  automationStatus: boolean;
}

function StatCard({ icon: Icon, label, value, sub, color }: any) {
  return (
    <div className="card p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', color)}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    api.get('/dashboard/overview')
      .then(r => setData(r.data))
      .catch(() => {});
  }, []);

  const toggleAutomation = async () => {
    if (!user?.instagramAccount) return;
    setToggling(true);
    try {
      const newState = !data?.automationStatus;
      await api.post('/instagram/toggle-automation', { enabled: newState });
      setData(prev => prev ? { ...prev, automationStatus: newState } : prev);
      toast.success(`Automation ${newState ? 'enabled' : 'paused'}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to toggle');
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">Good {greeting()}, {user?.name?.split(' ')[0] || 'there'} 👋</h1>
          <p className="page-subtitle">Here&apos;s what&apos;s happening with your Instagram automation.</p>
        </div>

        {user?.instagramAccount ? (
          <button
            onClick={toggleAutomation}
            disabled={toggling}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
              data?.automationStatus
                ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                : 'bg-gray-900 text-white hover:bg-gray-800'
            )}
          >
            <div className={cn('w-2 h-2 rounded-full', data?.automationStatus ? 'bg-green-500 animate-pulse' : 'bg-gray-400')} />
            {data?.automationStatus ? 'Automation Active' : 'Enable Automation'}
          </button>
        ) : (
          <Link href="/dashboard/instagram" className="btn-primary gap-2">
            <Instagram size={16} /> Connect Instagram
          </Link>
        )}
      </div>

      {/* No Instagram Warning */}
      {!user?.instagramAccount && (
        <div className="card p-6 border-dashed border-2 border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
              <Instagram size={24} className="text-gray-400" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">Connect your Instagram account</p>
              <p className="text-sm text-gray-500 mt-0.5">Link your Instagram Business account to start automating replies.</p>
            </div>
            <Link href="/dashboard/instagram" className="btn-primary flex-shrink-0">
              Connect <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={MessageSquare} label="Conversations" value={data?.stats.totalConversations ?? '—'} sub="All time" color="bg-blue-50 text-blue-600" />
        <StatCard icon={Users} label="Leads" value={data?.stats.totalLeads ?? '—'} sub="All time" color="bg-purple-50 text-purple-600" />
        <StatCard icon={Zap} label="AI Replies" value={data?.stats.aiRepliesThisWeek ?? '—'} sub="This week" color="bg-brand-50 text-brand-600" />
        <StatCard icon={TrendingUp} label="Success Rate" value={data ? `${data.stats.successRate}%` : '—'} sub="This week" color="bg-green-50 text-green-600" />
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="p-6 border-b border-gray-50">
          <h2 className="font-semibold text-gray-900">Recent Activity</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {!data?.recentActivity?.length ? (
            <div className="p-8 text-center text-sm text-gray-400">
              No activity yet. Connect Instagram and enable automation to get started.
            </div>
          ) : (
            data.recentActivity.slice(0, 10).map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-6 py-3.5">
                <div className={cn('flex-shrink-0', item.status === 'success' ? 'text-green-500' : item.status === 'failed' ? 'text-red-400' : 'text-yellow-500')}>
                  {item.status === 'success' ? <CheckCircle2 size={16} /> : item.status === 'failed' ? <XCircle size={16} /> : <Clock size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700">{formatActivityType(item.type)} via {item.source || 'system'}</p>
                  {item.error && <p className="text-xs text-red-400 truncate">{item.error}</p>}
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">{timeAgo(item.createdAt)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { href: '/dashboard/conversations', icon: MessageSquare, title: 'View Conversations', desc: 'See all DMs and replies' },
          { href: '/dashboard/ai-settings', icon: Zap, title: 'Configure AI', desc: 'Set tone, goal, and context' },
          { href: '/dashboard/leads', icon: Users, title: 'Manage Leads', desc: 'Track converted contacts' },
        ].map(({ href, icon: Icon, title, desc }) => (
          <Link key={href} href={href} className="card p-5 hover:shadow-elevated transition-shadow group">
            <Icon size={20} className="text-gray-400 group-hover:text-brand-600 transition-colors" />
            <p className="font-medium text-gray-900 mt-3">{title}</p>
            <p className="text-sm text-gray-500 mt-0.5">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}

function formatActivityType(type: string) {
  const map: Record<string, string> = {
    dm_sent: 'AI replied to DM',
    ai_reply: 'AI replied to comment',
    webhook: 'Webhook received',
    error: 'Error occurred',
    rate_limit: 'Rate limit hit',
  };
  return map[type] || type;
}
