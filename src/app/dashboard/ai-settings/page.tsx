'use client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sparkles, Loader2, FlaskConical, Bot } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

const schema = z.object({
  businessName: z.string().optional(),
  businessDescription: z.string().optional(),
  productDetails: z.string().optional(),
  targetAudience: z.string().optional(),
  goal: z.enum(['engagement', 'leads', 'sales', 'followers']),
  tone: z.enum(['friendly', 'professional', 'aggressive', 'luxury']),
  customInstructions: z.string().optional(),
  replyToDMs: z.boolean(),
  replyToComments: z.boolean(),
  autoSendDMs: z.boolean(),
  maxDMsPerHour: z.coerce.number().min(1).max(50),
  maxRepliesPerHour: z.coerce.number().min(1).max(100),
});
type FormData = z.infer<typeof schema>;

const GOALS = [
  { value: 'engagement', label: 'Engagement', desc: 'Build rapport and keep conversations going' },
  { value: 'leads', label: 'Leads', desc: 'Qualify contacts and capture info' },
  { value: 'sales', label: 'Sales', desc: 'Close deals and drive purchases' },
  { value: 'followers', label: 'Followers', desc: 'Grow your audience and community' },
];

const TONES = [
  { value: 'friendly', label: 'Friendly', emoji: '😊', desc: 'Warm, casual, approachable' },
  { value: 'professional', label: 'Professional', emoji: '💼', desc: 'Polished, business-like' },
  { value: 'aggressive', label: 'Bold', emoji: '⚡', desc: 'Direct, urgent, no fluff' },
  { value: 'luxury', label: 'Luxury', emoji: '💎', desc: 'Sophisticated, exclusive' },
];

export default function AISettingsPage() {
  const [loading, setLoading] = useState(true);
  const [testMsg, setTestMsg] = useState('');
  const [testReply, setTestReply] = useState('');
  const [testing, setTesting] = useState(false);

  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      goal: 'engagement',
      tone: 'friendly',
      replyToDMs: true,
      replyToComments: true,
      autoSendDMs: true,
      maxDMsPerHour: 20,
      maxRepliesPerHour: 30,
    },
  });

  const goal = watch('goal');
  const tone = watch('tone');

  useEffect(() => {
    api.get('/ai/settings').then(r => {
      if (r.data) reset(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [reset]);

  const onSubmit = async (data: FormData) => {
    try {
      await api.put('/ai/settings', data);
      toast.success('AI settings saved!');
    } catch {
      toast.error('Failed to save settings');
    }
  };

  const testAI = async () => {
    if (!testMsg.trim()) return;
    setTesting(true);
    setTestReply('');
    try {
      const { data } = await api.post('/ai/test-reply', { message: testMsg });
      setTestReply(data.reply);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Test failed');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8 max-w-3xl">
      <div>
        <h1 className="page-title">AI Settings</h1>
        <p className="page-subtitle">Train your AI to sound like you and achieve your goals.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

        {/* Business Context */}
        <div className="card p-6 space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <Bot size={18} className="text-brand-600" />
            <h2 className="font-semibold text-gray-900">Business Context</h2>
          </div>
          <p className="text-sm text-gray-500 -mt-2">This is what your AI knows about you. The more detail, the better it sounds.</p>

          <div>
            <label className="label">Business name</label>
            <input {...register('businessName')} placeholder="e.g. Luna Wellness Studio" className="input" />
          </div>

          <div>
            <label className="label">About your business</label>
            <textarea
              {...register('businessDescription')}
              rows={3}
              placeholder="What do you do? Who are you? What makes you different?"
              className="input resize-none"
            />
          </div>

          <div>
            <label className="label">Products / Services</label>
            <textarea
              {...register('productDetails')}
              rows={3}
              placeholder="List your main offerings, prices, key features…"
              className="input resize-none"
            />
          </div>

          <div>
            <label className="label">Target audience</label>
            <input
              {...register('targetAudience')}
              placeholder="e.g. Women aged 25–40 interested in wellness and self-care"
              className="input"
            />
          </div>
        </div>

        {/* Goal */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-1">Primary Goal</h2>
          <p className="text-sm text-gray-500 mb-5">What should your AI be optimised to achieve?</p>
          <div className="grid grid-cols-2 gap-3">
            {GOALS.map(g => (
              <button
                key={g.value}
                type="button"
                onClick={() => setValue('goal', g.value as any, { shouldDirty: true })}
                className={cn(
                  'text-left p-4 rounded-xl border-2 transition-all',
                  goal === g.value
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-100 bg-white hover:border-gray-200'
                )}
              >
                <p className={cn('font-medium text-sm', goal === g.value ? 'text-white' : 'text-gray-900')}>{g.label}</p>
                <p className={cn('text-xs mt-0.5', goal === g.value ? 'text-gray-300' : 'text-gray-500')}>{g.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Tone */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-1">Tone of Voice</h2>
          <p className="text-sm text-gray-500 mb-5">How should your AI communicate?</p>
          <div className="grid grid-cols-2 gap-3">
            {TONES.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => setValue('tone', t.value as any, { shouldDirty: true })}
                className={cn(
                  'text-left p-4 rounded-xl border-2 transition-all',
                  tone === t.value
                    ? 'border-brand-600 bg-brand-50'
                    : 'border-gray-100 bg-white hover:border-gray-200'
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{t.emoji}</span>
                  <p className={cn('font-medium text-sm', tone === t.value ? 'text-brand-700' : 'text-gray-900')}>{t.label}</p>
                </div>
                <p className="text-xs mt-1 text-gray-500">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Instructions */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-1">Custom Instructions</h2>
          <p className="text-sm text-gray-500 mb-4">Anything else your AI should know or avoid?</p>
          <textarea
            {...register('customInstructions')}
            rows={4}
            placeholder="e.g. Never mention competitor names. Always end with a question. If someone asks pricing, say 'DM me for a custom quote'."
            className="input resize-none"
          />
        </div>

        {/* Automation Rules */}
        <div className="card p-6 space-y-5">
          <h2 className="font-semibold text-gray-900">Automation Rules</h2>

          <div className="space-y-3">
            {[
              { name: 'replyToDMs', label: 'Reply to DMs', desc: 'AI responds to incoming direct messages' },
              { name: 'replyToComments', label: 'Reply to comments', desc: 'AI replies to comments on your posts' },
              { name: 'autoSendDMs', label: 'Send follow-up DMs', desc: 'Auto-DM users who comment (after replying)' },
            ].map(({ name, label, desc }) => (
              <label key={name} className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-0.5">
                  <input
                    type="checkbox"
                    {...register(name as any)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 rounded-full peer-checked:bg-gray-900 transition-colors" />
                  <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{label}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
              </label>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
            <div>
              <label className="label">Max DMs per hour</label>
              <input type="number" {...register('maxDMsPerHour')} min={1} max={50} className="input" />
              <p className="text-xs text-gray-400 mt-1">Recommended: 20 (avoid bans)</p>
            </div>
            <div>
              <label className="label">Max comment replies / hour</label>
              <input type="number" {...register('maxRepliesPerHour')} min={1} max={100} className="input" />
              <p className="text-xs text-gray-400 mt-1">Recommended: 30</p>
            </div>
          </div>
        </div>

        <button type="submit" disabled={isSubmitting || !isDirty} className="btn-primary px-8 py-3">
          {isSubmitting ? <><Loader2 size={15} className="animate-spin" /> Saving…</> : 'Save Settings'}
        </button>
      </form>

      {/* Test AI Reply */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <FlaskConical size={18} className="text-brand-600" />
          <h2 className="font-semibold text-gray-900">Test Your AI</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">Send a test message to see how your AI would reply (uses current saved settings).</p>

        <div className="flex gap-3">
          <input
            value={testMsg}
            onChange={e => setTestMsg(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && testAI()}
            placeholder="e.g. Hey! How much does this cost?"
            className="input flex-1"
          />
          <button onClick={testAI} disabled={testing || !testMsg.trim()} className="btn-primary px-5">
            {testing ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
            {testing ? 'Thinking…' : 'Test'}
          </button>
        </div>

        {testReply && (
          <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100 animate-slide-up">
            <div className="flex items-center gap-2 mb-2">
              <Bot size={14} className="text-brand-600" />
              <span className="text-xs font-medium text-gray-500">AI Reply</span>
            </div>
            <p className="text-sm text-gray-800 leading-relaxed">{testReply}</p>
          </div>
        )}
      </div>
    </div>
  );
}
