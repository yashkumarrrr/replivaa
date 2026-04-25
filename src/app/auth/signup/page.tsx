'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Loader2, Check } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
type FormData = z.infer<typeof schema>;

const perks = [
  '3-day free trial, no credit card required',
  'AI replies to DMs & comments automatically',
  'Convert followers into leads & sales',
];

export default function SignupPage() {
  const router = useRouter();
  const { fetchMe } = useAuthStore();
  const [showPass, setShowPass] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await api.post('/auth/signup', data);
      localStorage.setItem('access_token', res.data.accessToken);
      await fetchMe();
      toast.success('Account created! Welcome to InstaClient AI 🚀');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Signup failed');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Start your free trial</h1>
        <p className="text-gray-500 mt-2">3 days free — no credit card needed</p>
      </div>

      <div className="card p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="label">Full name</label>
            <input {...register('name')} type="text" placeholder="Alex Johnson" className="input" autoComplete="name" />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div>
            <label className="label">Email address</label>
            <input {...register('email')} type="email" placeholder="you@example.com" className="input" autoComplete="email" />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div>
            <label className="label">Password</label>
            <div className="relative">
              <input
                {...register('password')}
                type={showPass ? 'text' : 'password'}
                placeholder="Min. 8 characters"
                className="input pr-10"
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3 mt-2">
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
            {isSubmitting ? 'Creating account…' : 'Create free account'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-100 space-y-2">
          {perks.map((perk) => (
            <div key={perk} className="flex items-center gap-2.5 text-sm text-gray-600">
              <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <Check size={10} className="text-green-600" strokeWidth={3} />
              </div>
              {perk}
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-sm text-gray-500 mt-6">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-brand-600 font-medium hover:text-brand-700">Sign in</Link>
      </p>
    </div>
  );
}
