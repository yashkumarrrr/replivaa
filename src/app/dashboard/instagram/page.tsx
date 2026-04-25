'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Instagram, CheckCircle2, AlertCircle, Loader2, Unlink, ToggleLeft, ToggleRight, Users, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { cn, formatDate } from '@/lib/utils';

interface IGAccount {
  id: string;
  username: string;
  isActive: boolean;
  automationOn: boolean;
  followerCount?: number;
  profilePicUrl?: string;
  connectedAt: string;
  webhookVerified: boolean;
}

export default function InstagramPage() {
  const searchParams = useSearchParams();
  const [account, setAccount] = useState<IGAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (searchParams.get('success') === 'true') toast.success('Instagram connected successfully!');
    if (searchParams.get('error')) toast.error('Failed to connect Instagram. Please try again.');

    api.get('/instagram/status').then(r => {
      setAccount(r.data.account);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [searchParams]);

  const connect = async () => {
    setConnecting(true);
    try {
      const { data } = await api.get('/instagram/auth-url');
      window.location.href = data.url;
    } catch {
      toast.error('Failed to get auth URL');
      setConnecting(false);
    }
  };

  const disconnect = async () => {
    if (!confirm('Disconnect your Instagram account? Automation will stop.')) return;
    setDisconnecting(true);
    try {
      await api.delete('/instagram/disconnect');
      setAccount(null);
      toast.success('Instagram disconnected');
    } catch {
      toast.error('Failed to disconnect');
    } finally {
      setDisconnecting(false);
    }
  };

  const toggleAutomation = async () => {
    if (!account) return;
    setToggling(true);
    try {
      const { data } = await api.post('/instagram/toggle-automation', { enabled: !account.automationOn });
      setAccount(prev => prev ? { ...prev, automationOn: data.automationOn } : prev);
      toast.success(`Automation ${data.automationOn ? 'enabled' : 'paused'}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to toggle');
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-gray-400" size={24} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8 max-w-2xl">
      <div>
        <h1 className="page-title">Instagram Account</h1>
        <p className="page-subtitle">Connect your Instagram Business account to enable AI automation.</p>
      </div>

      {account ? (
        <div className="space-y-5">
          {/* Connected Account Card */}
          <div className="card p-6">
            <div className="flex items-start gap-4">
              <div className="relative">
                {account.profilePicUrl ? (
                  <img src={account.profilePicUrl} alt={account.username} className="w-14 h-14 rounded-full object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                    <Instagram size={24} className="text-white" />
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
                  <CheckCircle2 size={10} className="text-white" strokeWidth={3} />
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-gray-900">@{account.username}</h2>
                  <a
                    href={`https://instagram.com/${account.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  {account.followerCount && (
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <Users size={13} />
                      {account.followerCount.toLocaleString()} followers
                    </span>
                  )}
                  <span className="text-sm text-gray-400">Connected {formatDate(account.connectedAt)}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-5 border-t border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">AI Automation</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {account.automationOn ? 'Actively replying to DMs and comments' : 'Currently paused — no replies being sent'}
                </p>
              </div>
              <button
                onClick={toggleAutomation}
                disabled={toggling}
                className="flex items-center gap-2"
              >
                {toggling ? (
                  <Loader2 size={20} className="animate-spin text-gray-400" />
                ) : account.automationOn ? (
                  <ToggleRight size={32} className="text-green-500 hover:text-green-600 transition-colors" />
                ) : (
                  <ToggleLeft size={32} className="text-gray-300 hover:text-gray-400 transition-colors" />
                )}
              </button>
            </div>
          </div>

          {/* Status Badges */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Account', status: account.isActive, ok: 'Active', fail: 'Inactive' },
              { label: 'Webhook', status: account.webhookVerified, ok: 'Verified', fail: 'Not verified' },
              { label: 'Automation', status: account.automationOn, ok: 'Running', fail: 'Paused' },
            ].map(({ label, status, ok, fail }) => (
              <div key={label} className="card p-4 text-center">
                <div className={cn('w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center', status ? 'bg-green-100' : 'bg-gray-100')}>
                  {status
                    ? <CheckCircle2 size={16} className="text-green-600" />
                    : <AlertCircle size={16} className="text-gray-400" />}
                </div>
                <p className="text-xs font-medium text-gray-700">{label}</p>
                <p className={cn('text-xs mt-0.5', status ? 'text-green-600' : 'text-gray-400')}>{status ? ok : fail}</p>
              </div>
            ))}
          </div>

          {/* Webhook Info */}
          {!account.webhookVerified && (
            <div className="card p-5 border-amber-200 bg-amber-50">
              <div className="flex gap-3">
                <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Webhook not verified</p>
                  <p className="text-sm text-amber-700 mt-1">
                    To receive real-time DMs and comments, configure your Meta webhook URL to:
                  </p>
                  <code className="block text-xs bg-amber-100 text-amber-800 px-3 py-2 rounded-lg mt-2 break-all">
                    {process.env.NEXT_PUBLIC_API_URL}/api/webhook/instagram
                  </code>
                  <p className="text-xs text-amber-600 mt-2">Verify token: set <code>META_WEBHOOK_VERIFY_TOKEN</code> in your .env</p>
                </div>
              </div>
            </div>
          )}

          {/* Disconnect */}
          <div className="card p-5">
            <h3 className="text-sm font-medium text-gray-900">Disconnect account</h3>
            <p className="text-sm text-gray-500 mt-1">This will stop all automation and remove your account from InstaClient AI.</p>
            <button
              onClick={disconnect}
              disabled={disconnecting}
              className="btn-danger mt-3 text-sm px-4 py-2"
            >
              {disconnecting ? <Loader2 size={14} className="animate-spin" /> : <Unlink size={14} />}
              {disconnecting ? 'Disconnecting…' : 'Disconnect Instagram'}
            </button>
          </div>
        </div>
      ) : (
        /* Not Connected State */
        <div className="space-y-6">
          <div className="card p-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center mx-auto mb-5">
              <Instagram size={30} className="text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Connect your Instagram</h2>
            <p className="text-gray-500 mt-2 max-w-sm mx-auto text-sm leading-relaxed">
              Link your Instagram Business account to let AI automatically reply to DMs and comments on your behalf.
            </p>
            <button onClick={connect} disabled={connecting} className="btn-primary mt-6 px-8 py-3">
              {connecting ? <Loader2 size={16} className="animate-spin" /> : <Instagram size={16} />}
              {connecting ? 'Redirecting…' : 'Connect Instagram Business Account'}
            </button>
          </div>

          {/* Requirements */}
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Requirements</h3>
            <div className="space-y-3">
              {[
                { ok: true, text: 'Instagram Business or Creator account' },
                { ok: true, text: 'Connected to a Facebook Page' },
                { ok: true, text: 'Meta App with Instagram Basic Display API' },
                { ok: false, text: 'Personal accounts are not supported' },
              ].map(({ ok, text }, i) => (
                <div key={i} className="flex items-center gap-2.5 text-sm">
                  <div className={cn('w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0', ok ? 'bg-green-100' : 'bg-red-50')}>
                    {ok
                      ? <CheckCircle2 size={10} className="text-green-600" strokeWidth={3} />
                      : <span className="text-red-500 text-xs leading-none">✕</span>}
                  </div>
                  <span className={cn(ok ? 'text-gray-700' : 'text-gray-400')}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
