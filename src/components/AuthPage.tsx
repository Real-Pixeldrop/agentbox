"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Bot, Globe, Shield, Box } from 'lucide-react';

const rotatingTexts = [
  { title: "Déployez vos agents IA en quelques minutes", subtitle: "WhatsApp, Email, Slack et plus — aucun code nécessaire" },
  { title: "Votre équipe, décuplée", subtitle: "Chaque agent gère un rôle : support, ventes, planification, opérations" },
  { title: "Un dashboard, contrôle total", subtitle: "Suivez les conversations, les coûts et la performance en temps réel" },
  { title: "Sécurité maximale", subtitle: "Vos données restent chez vous, chiffrées et isolées" },
];

const rotatingTextsEn = [
  { title: "Deploy AI agents in minutes", subtitle: "Connect to WhatsApp, Email, Slack and more — no code required" },
  { title: "Your team, amplified", subtitle: "Each agent handles a role: support, sales, scheduling, operations" },
  { title: "One dashboard, full control", subtitle: "Monitor conversations, costs, and performance in real time" },
  { title: "Maximum security", subtitle: "Your data stays with you, encrypted and isolated" },
];

type Lang = 'FR' | 'EN';

const labels = {
  FR: {
    welcomeBack: 'Bon retour',
    createAccount: 'Créer un compte',
    resetPassword: 'Mot de passe oublié',
    signInSubtitle: 'Connectez-vous pour gérer vos agents IA.',
    signUpSubtitle: 'Commencez gratuitement. Sans carte bancaire.',
    resetSubtitle: 'Entrez votre email pour recevoir un lien de réinitialisation.',
    fullName: 'Nom complet',
    email: 'Email',
    password: 'Mot de passe',
    forgotPassword: 'Mot de passe oublié ?',
    signIn: 'Se connecter',
    signUp: 'Créer mon compte',
    sendReset: 'Envoyer le lien',
    noAccount: "Pas encore de compte ?",
    signUpFree: "S'inscrire gratuitement",
    hasAccount: 'Déjà un compte ?',
    signInLink: 'Se connecter',
    orContinueWith: 'Ou continuer avec',
    google: 'Google',
    termsPrefix: 'En continuant, vous acceptez nos ',
    termsLink: 'Conditions d\'utilisation',
    termsAnd: ' et ',
    privacyLink: 'Politique de confidentialité',
    termsSuffix: '.',
    passwordMin: 'Le mot de passe doit contenir au moins 6 caractères',
    accountCreated: 'Compte créé ! Vérifiez votre email pour confirmer.',
    unexpectedError: 'Une erreur inattendue est survenue',
    e2eEncryption: 'Chiffrement de bout en bout',
    e2eEncryptionSub: 'AES-256',
    isolatedWorkspace: 'Espace isolé',
    isolatedWorkspaceSub: 'Environnement privé sandboxé',
    sandboxedExecution: 'Exécution sandboxée',
    sandboxedExecutionSub: 'Aucun accès réseau, limites de ressources',
  },
  EN: {
    welcomeBack: 'Welcome back',
    createAccount: 'Create your account',
    resetPassword: 'Reset password',
    signInSubtitle: 'Sign in to manage your AI agents.',
    signUpSubtitle: 'Get started for free. No credit card required.',
    resetSubtitle: 'Enter your email to receive a reset link.',
    fullName: 'Full name',
    email: 'Email',
    password: 'Password',
    forgotPassword: 'Forgot password?',
    signIn: 'Sign in',
    signUp: 'Create account',
    sendReset: 'Send reset link',
    noAccount: "Don't have an account?",
    signUpFree: 'Sign up free',
    hasAccount: 'Already have an account?',
    signInLink: 'Sign in',
    orContinueWith: 'Or continue with',
    google: 'Google',
    termsPrefix: 'By continuing, you agree to our ',
    termsLink: 'Terms of Service',
    termsAnd: ' and ',
    privacyLink: 'Privacy Policy',
    termsSuffix: '.',
    passwordMin: 'Password must be at least 6 characters',
    accountCreated: 'Account created! Check your email to confirm.',
    unexpectedError: 'An unexpected error occurred',
    e2eEncryption: 'End-to-end encryption',
    e2eEncryptionSub: 'AES-256',
    isolatedWorkspace: 'Isolated workspace',
    isolatedWorkspaceSub: 'Private sandboxed environment',
    sandboxedExecution: 'Sandboxed execution',
    sandboxedExecutionSub: 'No network access, resource limits',
  },
};

export default function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [lang, setLang] = useState<Lang>('FR');

  const { signIn, signUp } = useAuth();
  const t = labels[lang];
  const texts = lang === 'FR' ? rotatingTexts : rotatingTextsEn;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTextIndex((prev) => (prev + 1) % texts.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [texts.length]);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) setError(error.message);
    } catch {
      setError(t.unexpectedError);
    } finally {
      setGoogleLoading(false);
    }
  };

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
          setError(t.passwordMin);
          setLoading(false);
          return;
        }
        const { error: err } = await signUp(email, password, fullName);
        if (err) {
          setError(err);
        } else {
          setMessage(t.accountCreated);
          setMode('signin');
        }
      } else if (mode === 'reset') {
        const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (err) setError(err.message);
        else {
          setMessage(lang === 'FR' ? 'Email de réinitialisation envoyé.' : 'Reset email sent.');
          setMode('signin');
        }
      }
    } catch {
      setError(t.unexpectedError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0C] flex">
      {/* Left Side - Branding with background image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80')`,
          }}
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A0A0C]/95 via-[#0F0A1A]/90 to-[#1A0A2E]/80" />

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />

        {/* Glow effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/8 rounded-full blur-[120px]" />

        {/* Content */}
        <div className="relative z-10 p-12 flex flex-col justify-between w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
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
                  {texts[currentTextIndex].title}
                </h2>
                <p className="text-lg text-slate-400 mt-3 transition-all duration-500">
                  {texts[currentTextIndex].subtitle}
                </p>
              </div>

              {/* Dots */}
              <div className="flex gap-2">
                {texts.map((_, index) => (
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
                <Lock className="w-4 h-4 text-emerald-400" />
                <div className="flex flex-col">
                  <span className="text-sm text-slate-300">{t.e2eEncryption}</span>
                  <span className="text-[10px] text-slate-500">{t.e2eEncryptionSub}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/5">
                <Shield className="w-4 h-4 text-blue-400" />
                <div className="flex flex-col">
                  <span className="text-sm text-slate-300">{t.isolatedWorkspace}</span>
                  <span className="text-[10px] text-slate-500">{t.isolatedWorkspaceSub}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/5">
                <Box className="w-4 h-4 text-violet-400" />
                <div className="flex flex-col">
                  <span className="text-sm text-slate-300">{t.sandboxedExecution}</span>
                  <span className="text-[10px] text-slate-500">{t.sandboxedExecutionSub}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        {/* Language toggle */}
        <div className="absolute top-6 right-6">
          <button
            onClick={() => setLang(lang === 'FR' ? 'EN' : 'FR')}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5"
          >
            <Globe className="w-3.5 h-3.5" />
            {lang === 'FR' ? 'EN' : 'FR'}
          </button>
        </div>

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
          </div>

          <div className="bg-[#111118] rounded-2xl border border-white/[0.06] p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-2">
              {mode === 'signin' && t.welcomeBack}
              {mode === 'signup' && t.createAccount}
              {mode === 'reset' && t.resetPassword}
            </h2>
            <p className="text-slate-500 mb-6">
              {mode === 'signin' && t.signInSubtitle}
              {mode === 'signup' && t.signUpSubtitle}
              {mode === 'reset' && t.resetSubtitle}
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

            {/* Google Sign In */}
            {mode !== 'reset' && (
              <>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading}
                  className="w-full flex items-center justify-center gap-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white py-3 px-4 rounded-lg font-medium transition-all disabled:opacity-50 mb-6"
                >
                  {googleLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      {t.google}
                    </>
                  )}
                </button>

                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/[0.06]"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-[#111118] px-3 text-slate-600">{t.orContinueWith}</span>
                  </div>
                </div>
              </>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">{t.fullName}</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-transparent text-white placeholder:text-slate-600 transition-all"
                    placeholder="Jean Dupont"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">{t.email}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-transparent text-white placeholder:text-slate-600 transition-all"
                    placeholder="vous@entreprise.com"
                    required
                  />
                </div>
              </div>

              {mode !== 'reset' && (
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">{t.password}</label>
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
                    {t.forgotPassword}
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
                    {mode === 'signin' && t.signIn}
                    {mode === 'signup' && t.signUp}
                    {mode === 'reset' && t.sendReset}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-sm">
              {mode === 'signin' && (
                <p className="text-slate-500">
                  {t.noAccount}{' '}
                  <button
                    onClick={() => { setMode('signup'); setError(null); setMessage(null); }}
                    className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
                  >
                    {t.signUpFree}
                  </button>
                </p>
              )}
              {(mode === 'signup' || mode === 'reset') && (
                <p className="text-slate-500">
                  {t.hasAccount}{' '}
                  <button
                    onClick={() => { setMode('signin'); setError(null); setMessage(null); }}
                    className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
                  >
                    {t.signInLink}
                  </button>
                </p>
              )}
            </div>
          </div>

          <p className="text-center text-xs text-slate-600 mt-6">
            {t.termsPrefix}
            <a href="/legal/terms" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:text-violet-300 transition-colors">
              {t.termsLink}
            </a>
            {t.termsAnd}
            <a href="/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:text-violet-300 transition-colors">
              {t.privacyLink}
            </a>
            {t.termsSuffix}
            {' · '}
            <a href="/legal/dpa" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:text-violet-300 transition-colors">
              DPA
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
