'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CreditCard, CheckCircle2, Zap, ArrowRight, Loader2, ExternalLink, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { cn, formatDate } from '@/lib/utils';

interface BillingStatus {
  subStatus: string | null;
  subPlan: string | null;
  trialEndsAt: string;
  isTrialActive: boolean;
  trialDaysLeft: number;
  stripeCustomerId: string | null;
}

interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: string;
  date: number;
  pdfUrl: string | null;
}

const PLAN_FEATURES = [
  'Unlimited AI replies to DMs',
  'Unlimited comment replies',
  'Lead detection & tracking',
  'Custom tone & goal settings',
  'Full conversation history',
  'Automation rate limiting',
  'Email support',
];

export default function BillingPage() {
  const searchParams = useSearchParams();
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);

  useEffect(() => {
    if (searchParams.get('success') === 'true') toast.success('Subscription activated! Welcome to Pro 🎉');
    if (searchParams.get('canceled') === 'true') toast('Checkout cancelled.', { icon: 'ℹ️' });

    Promise.all([
      api.get('/billing/status'),
      api.get('/billing/invoices'),
    ]).then(([b, inv]) => {
      setBilling(b.data);
      setInvoices(inv.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [searchParams]);

  const checkout = async () => {
    setCheckingOut(true);
    try {
      const { data } = await api.post('/billing/create-checkout');
      window.location.href = data.url;
    } catch {
      toast.error('Failed to open checkout');
      setCheckingOut(false);
    }
  };

  const openPortal = async () => {
    setOpeningPortal(true);
    try {
      const { data } = await api.post('/billing/portal');
      window.location.href = data.url;
    } catch {
      toast.error('Failed to open billing portal');
      setOpeningPortal(false);
    }
  };

  const isActive = billing?.subStatus === 'active';
  const isTrial = billing?.isTrialActive;
  const isPastDue = billing?.subStatus === 'past_due';
  const isCanceled = billing?.subStatus === 'canceled';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-gray-400" size={24} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8 max-w-3xl">
      <div>
        <h1 className="page-title">Billing</h1>
        <p className="page-subtitle">Manage your subscription and payment details.</p>
      </div>

      {/* Current Status */}
      <div className="card p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-sm text-gray-500">Current plan</p>
            <div className="flex items-center gap-3 mt-1">
              <h2 className="text-2xl font-bold text-gray-900">
                {isActive ? 'Pro' : isTrial ? 'Free Trial' : 'Free'}
              </h2>
              <span className={cn(
                'badge',
                isActive ? 'badge-green' : isTrial ? 'badge-blue' : isPastDue ? 'badge-red' : 'badge-gray'
              )}>
                {isActive ? 'Active' : isTrial ? `${billing?.trialDaysLeft}d left` : isPastDue ? 'Past due' : 'Inactive'}
              </span>
            </div>
          </div>

          {isActive ? (
            <button onClick={openPortal} disabled={openingPortal} className="btn-secondary gap-2">
              {openingPortal ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
              Manage Billing
            </button>
          ) : (
            <button onClick={checkout} disabled={checkingOut} className="btn-primary gap-2 px-6 py-2.5">
              {checkingOut ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
              {checkingOut ? 'Loading…' : 'Upgrade to Pro'}
            </button>
          )}
        </div>

        {isTrial && (
          <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-100">
            <p className="text-sm text-blue-700">
              <strong>Trial ends {formatDate(billing!.trialEndsAt)}</strong> — upgrade now to keep your automation running.
            </p>
          </div>
        )}

        {isPastDue && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-100 flex items-start gap-2">
            <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">
              Your payment failed. Update your payment method to keep your account active.
            </p>
          </div>
        )}
      </div>

      {/* Pricing Card */}
      {!isActive && (
        <div className="card p-8 border-2 border-gray-900 relative overflow-hidden">
          <div className="absolute top-4 right-4 bg-gray-900 text-white text-xs font-medium px-3 py-1 rounded-full">
            Most popular
          </div>

          <div className="flex items-end gap-1 mb-2">
            <span className="text-4xl font-bold text-gray-900">$10</span>
            <span className="text-gray-500 mb-1.5">/month</span>
          </div>
          <p className="text-sm text-gray-500 mb-6">Everything you need to grow on Instagram with AI.</p>

          <ul className="space-y-3 mb-8">
            {PLAN_FEATURES.map(f => (
              <li key={f} className="flex items-center gap-3 text-sm text-gray-700">
                <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          <button onClick={checkout} disabled={checkingOut} className="btn-primary w-full py-3 text-base">
            {checkingOut ? <Loader2 size={16} className="animate-spin" /> : null}
            {checkingOut ? 'Redirecting to checkout…' : 'Get started — $10/month'}
            {!checkingOut && <ArrowRight size={16} />}
          </button>

          <p className="text-center text-xs text-gray-400 mt-3">Secured by Stripe · Cancel anytime</p>
        </div>
      )}

      {/* Invoices */}
      {invoices.length > 0 && (
        <div className="card overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Invoices</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {invoices.map(inv => (
              <div key={inv.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    ${(inv.amount / 100).toFixed(2)} {inv.currency.toUpperCase()}
                  </p>
                  <p className="text-xs text-gray-400">{formatDate(new Date(inv.date * 1000))}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn('badge', inv.status === 'paid' ? 'badge-green' : 'badge-red')}>
                    {inv.status}
                  </span>
                  {inv.pdfUrl && (
                    <a href={inv.pdfUrl} target="_blank" rel="noopener noreferrer"
                      className="text-brand-600 hover:text-brand-700 text-xs flex items-center gap-1">
                      PDF <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manage existing sub */}
      {isActive && (
        <div className="card p-5">
          <h3 className="text-sm font-medium text-gray-900">Manage subscription</h3>
          <p className="text-sm text-gray-500 mt-1">Update payment method, view invoices, or cancel your plan.</p>
          <button onClick={openPortal} disabled={openingPortal} className="btn-secondary mt-3 gap-2">
            {openingPortal ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}
            Open Billing Portal
          </button>
        </div>
      )}
    </div>
  );
}
