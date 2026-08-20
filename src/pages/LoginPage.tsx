/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  Timer, 
  LogIn, 
  Mail, 
  Lock, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/host';
  const { signInWithGoogle, signInWithEmail, currentUser } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If already logged in, redirect
  React.useEffect(() => {
    if (currentUser) {
      navigate(redirectUrl, { replace: true });
    }
  }, [currentUser, navigate, redirectUrl]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      await signInWithGoogle();
      showToast({
        type: 'success',
        title: 'Signed In',
        message: 'Welcome back to Runner Stopwatch Host.'
      });
      navigate(redirectUrl, { replace: true });
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Google sign-in was cancelled or failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      await signInWithEmail(email, password);
      showToast({
        type: 'success',
        title: 'Signed In',
        message: 'Host authentication successful.'
      });
      navigate(redirectUrl, { replace: true });
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setErrorMessage('Invalid email or password. Please check your credentials.');
      } else {
        setErrorMessage(err.message || 'Failed to sign in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
        
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 p-[1px] mx-auto mb-3 shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[15px] flex items-center justify-center">
              <Timer className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight">
            Host Login
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Access race controllers, checkpoint managers, and timing logs
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* Google One-Click Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-3.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-100 font-mono text-xs sm:text-sm font-bold flex items-center justify-center gap-3 transition-all cursor-pointer shadow-lg hover:border-slate-600 disabled:opacity-60 mb-5"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{loading ? 'Authenticating...' : 'Continue with Google'}</span>
        </button>

        <div className="flex items-center gap-3 my-4">
          <div className="h-[1px] bg-slate-800 flex-1" />
          <span className="text-[10px] font-mono text-slate-500 uppercase">Or with Email</span>
          <div className="h-[1px] bg-slate-800 flex-1" />
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleEmailSignIn} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1.5">
              Host Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold font-mono text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-60"
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? 'Signing In...' : 'Sign In as Host'}</span>
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 text-center text-xs font-mono text-slate-400">
          <span>Need a new Host account? </span>
          <Link
            to={`/register${redirectUrl ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`}
            className="text-cyan-400 hover:underline font-bold"
          >
            Create an Account
          </Link>
        </div>

      </div>
    </div>
  );
};
