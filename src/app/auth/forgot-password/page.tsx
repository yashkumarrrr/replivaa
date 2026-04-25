'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { ArrowLeft, Loader2, Mail } from 'lucide-react';
import api from '@/lib/api';

const schema = z.object({ email: z.string().email('Invalid email') });
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await api.post('/auth/forgot-password', data);
      setSent(true);
    } catch {
      toast.error('Something went wrong. Try again.');
    }
  };

  if (sent) {
    return (
      <div className="text-center animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <Mail className="text-green-600" size={28} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Check your email</h1>
        <p className="text-gray-500 mt-2 max-w-sm mx-auto">
          If that email exists, we&apos;ve sent a reset link. Check your inbox and spam folder.
        </p>
        <Link href="/auth/login" className="btn-secondary mt-6 inline-flex">
          <ArrowLeft size={16} /> Back to login
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Forgot password?</h1>
        <p className="text-gray-500 mt-2">Enter your email and we&apos;ll send you a reset link.</p>
      </div>
      <div className="card p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="label">Email address</label>
            <input {...register('email')} type="email" placeholder="you@example.com" className="input" />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3">
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
            {isSubmitting ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      </div>
      <p className="text-center text-sm text-gray-500 mt-6">
        <Link href="/auth/login" className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700">
          <ArrowLeft size={14} /> Back to login
        </Link>
      </p>
    </div>
  );
}
