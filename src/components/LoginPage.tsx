import React, { useState } from 'react';
import { LogIn, AlertCircle, LoaderCircle } from 'lucide-react';

interface LoginPageProps {
  onSignIn: (email: string, password: string) => Promise<void>;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSignIn }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await onSignIn(email.trim(), password);
    } catch (error: any) {
      const message = error?.code === 'auth/invalid-credential'
        ? 'Incorrect email or password.'
        : error?.message || 'Unable to sign in.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-slate-950">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-8">
        <div className="flex items-center gap-3 mb-8">
          <img src="/favicon.svg" alt="Yimaru logo" className="w-11 h-11" />
          <div>
            <h1 className="text-xl font-bold text-slate-900">Yimaru</h1>
            <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Content Admin</p>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
        <p className="mt-1 text-sm text-slate-500">Sign in to manage and publish content.</p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <label className="block">
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Email</span>
            <input
              type="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              required
              autoComplete="email"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm text-slate-900 outline-none focus:border-[#9A288D] focus:ring-2 focus:ring-[#9A288D]/20"
              placeholder="admin@company.com"
            />
          </label>

          <label className="block">
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Password</span>
            <input
              type="password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              required
              autoComplete="current-password"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm text-slate-900 outline-none focus:border-[#9A288D] focus:ring-2 focus:ring-[#9A288D]/20"
              placeholder="Enter your password"
            />
          </label>

          {error && (
            <p className="flex items-start gap-2 rounded-xl bg-rose-50 px-3 py-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#9A288D] px-4 py-3 text-sm font-bold text-white shadow-md shadow-[#9A288D]/25 transition hover:bg-[#812175] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
            <span>{isSubmitting ? 'Signing in...' : 'Sign in'}</span>
          </button>
        </form>
      </div>
    </main>
  );
};
