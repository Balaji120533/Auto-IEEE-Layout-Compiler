'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const EASE = [0.22, 1, 0.36, 1] as const;

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? 'Something went wrong. Try again.');
        setLoading(false);
        return;
      }

      // Signed up — sign in immediately so the user lands in the editor
      // without a separate login step.
      const result = await signIn('credentials', { email, password, redirect: false });
      setLoading(false);
      if (result?.error) {
        // Account was created but auto-login failed for some reason —
        // send them to login instead of leaving them stuck.
        router.push('/login');
        return;
      }
      router.push('/editor');
    } catch {
      setError('Could not reach the server. Try again.');
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-white text-black flex items-center justify-center px-6 overflow-hidden">
      <div aria-hidden="true" className="absolute -inset-x-[10%] -top-[10%] bottom-0 pointer-events-none" style={{ filter: 'blur(70px)', opacity: 0.6 }}>
        <div className="aurora-blob" style={{ width: 520, height: 440, left: -60, top: -60, background: 'radial-gradient(circle at 40% 40%, rgba(0,113,227,.32), rgba(0,113,227,0) 70%)', animation: 'drift1 22s ease-in-out infinite' }} />
        <div className="aurora-blob" style={{ width: 460, height: 400, right: -80, top: 40, background: 'radial-gradient(circle at 50% 50%, rgba(175,82,222,.26), rgba(175,82,222,0) 70%)', animation: 'drift2 26s ease-in-out infinite' }} />
      </div>

      <motion.div
        className="relative w-full max-w-sm bg-white rounded-3xl p-10"
        style={{ boxShadow: '0 24px 60px rgba(0,0,0,.14)' }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <p className="text-[15px] font-semibold tracking-tight text-[#1d1d1f]">Auto‑IEEE</p>

        <h1 className="mt-6 text-[34px] leading-tight font-semibold tracking-tight text-[#1d1d1f]">Create an account</h1>
        <p className="mt-2 text-[15px] text-[#6e6e73] leading-relaxed">Start typesetting your papers in minutes.</p>

        <button
          type="button"
          onClick={() => signIn('google', { callbackUrl: '/editor' })}
          className="mt-8 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-full border border-[#d2d2d7] text-sm font-medium hover:bg-[#f5f5f7] transition-colors"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <div className="flex items-center gap-3 my-6">
          <div className="h-px flex-1 bg-[#e3e3e6]" />
          <span className="text-xs text-[#a1a1a6]">or</span>
          <div className="h-px flex-1 bg-[#e3e3e6]" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            required
            placeholder="Full name"
            value={name}
            onChange={e => setName(e.target.value)}
            className="apple-fld"
          />
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="apple-fld"
          />
          <input
            type="password"
            required
            minLength={8}
            placeholder="Password (min. 8 characters)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="apple-fld"
          />

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="pill pill-primary w-full py-3 text-sm mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#6e6e73]">
          Already have an account?{' '}
          <Link href="/login" className="text-[#0071e3] hover:text-[#0077ed]">
            Sign in
          </Link>
        </p>
      </motion.div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.99 10.99 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.43.34-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}
