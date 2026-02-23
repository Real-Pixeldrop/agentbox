"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Bot, Zap, Globe, Shield } from 'lucide-react';

const rotatingTexts = [
  { title: "Deploy AI agents in minutes", subtitle: "Connect to WhatsApp, Email, Slack and more — no code required" },
  { title: "Your team, amplified", subtitle: "Each agent handles a role: support, sales, scheduling, operations" },
  { title: "One dashboard, full control", subtitle: "Monitor conversations, costs, and performance in real time" },
  { title: "Built on open infrastructure", subtitle: "Powered by Claude, deployed on your own gateway" },
];

export default function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  const { signIn, signUp } = useAuth();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTextIndex((prev) => (prev + 1) % rotatingTexts.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (mode === 'signin') {
        const { error: err } = await signIn(email, password);
        if (err) setError(err);
      } else if (mode === 'signup') {
        if (password.length < 6) {
          setError('Password must be at least 6 characters');
          setLoading(false);
          return;
        }
        const { error: err } = await signUp(email, password, fullName);
        if (err) {
          setError(err);
        } else {
          setMessage('Account created! Check your email to confirm.');
          setMode('signin');
        }
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0C] flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A0A0C] via-[#0F0A1A] to-[#1A0A2E]" />
        
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />

        {/* Glow effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[120px]" />

        {/* Content */}
        <div className="relative z-10 p-12 flex flex-col justify-between w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-blue-500 rounded-xl flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              AgentBox
            </span>
            <span className="text-[9px] bg-violet-500/20 text-violet-300 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
              Beta
            </span>
          </div>

          {/* Rotating text */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="min-h-[140px]">
                <h2 className="text-4xl font-bold text-white leading-tight transition-all duration-500">
                  {rotatingTexts[currentTextIndex].title}
                </h2>
                <p className="text-lg text-slate-400 mt-3 transition-all duration-500">
                  {rotatingTexts[currentTextIndex].subtitle}
                </p>
              </div>

              {/* Dots */}
              <div className="flex gap-2">
                {rotatingTexts.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      index === currentTextIndex ? 'w-8 bg-violet-400' : 'w-1.5 bg-white/20'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/5">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-slate-300">Powered by Claude</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/5">
                <Globe className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-slate-300">Multi-channel</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/5">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-slate-300">Your infrastructure</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-3 justify-center">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-blue-500 rounded-xl flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">AgentBox</span>
              <span className="text-[9px] bg-violet-500/20 text-violet-300 px-1.5 py-0.5 rounded font-bold">BETA</span>
            </div>
            <p className="text-sm text-slate-500 mt-2">AI agents, deployed in minutes</p>
          </div>

          <div className="bg-[#111118] rounded-2xl border border-white/[0.06] p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-2">
              {mode === 'signin' && 'Welcome back'}
              {mode === 'signup' && 'Create your account'}
              {mode === 'reset' && 'Reset password'}
            </h2>
            <p className="text-slate-500 mb-6">
              {mode === 'signin' && 'Sign in to manage your AI agents.'}
              {mode === 'signup' && 'Get started for free. No credit card required.'}
              {mode === 'reset' && 'Enter your email to receive a reset link.'}
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                {error}
              </div>
            )}

            {message && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-sm text-emerald-400">
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Full name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-transparent text-white placeholder:text-slate-600 transition-all"
                    placeholder="John Doe"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-transparent text-white placeholder:text-slate-600 transition-all"
                    placeholder="you@company.com"
                    required
                  />
                </div>
              </div>

              {mode !== 'reset' && (
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 bg-white/[0.04] border border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-transparent text-white placeholder:text-slate-600 transition-all"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              )}

              {mode === 'signin' && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => { setMode('reset'); setError(null); setMessage(null); }}
                    className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white py-3 px-4 rounded-lg font-medium transition-all disabled:opacity-50 shadow-lg shadow-violet-500/20"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                ) : (
                  <>
                    {mode === 'signin' && 'Sign in'}
                    {mode === 'signup' && 'Create account'}
                    {mode === 'reset' && 'Send reset link'}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-sm">
              {mode === 'signin' && (
                <p className="text-slate-500">
                  Don&apos;t have an account?{' '}
                  <button
                    onClick={() => { setMode('signup'); setError(null); setMessage(null); }}
                    className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
                  >
                    Sign up free
                  </button>
                </p>
              )}
              {(mode === 'signup' || mode === 'reset') && (
                <p className="text-slate-500">
                  Already have an account?{' '}
                  <button
                    onClick={() => { setMode('signin'); setError(null); setMessage(null); }}
                    className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
                  >
                    Sign in
                  </button>
                </p>
              )}
            </div>
          </div>

          <p className="text-center text-xs text-slate-600 mt-6">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
