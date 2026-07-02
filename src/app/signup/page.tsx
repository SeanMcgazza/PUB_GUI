'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Beer, Mail, Lock, User, Loader2, ArrowRight, Check, X } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validation = useMemo(() => {
    const hasBusinessName = businessName.trim().length >= 2;
    const hasEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const hasPassword = password.length >= 6;
    const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

    return {
      hasBusinessName,
      hasEmail,
      hasPassword,
      passwordsMatch,
      isValid: hasBusinessName && hasEmail && hasPassword && passwordsMatch,
    };
  }, [businessName, email, password, confirmPassword]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validation.isValid) return;

    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            business_name: businessName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      setSuccess(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="site-theme min-h-screen bg-[#F9F7F5] flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 bg-[color:var(--theme-success)]/15 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-[color:var(--theme-success)]" />
          </div>
          <h1 className="font-display font-semibold text-3xl text-[#2D3A4B] mb-2">Check your email</h1>
          <p className="text-muted-foreground mb-6">
            We&apos;ve sent a confirmation link to <strong>{email}</strong>. 
            Click it to activate your account.
          </p>
          <Link href="/login">
            <Button variant="outline" className="btn-pill">
              Back to Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="site-theme min-h-screen bg-[#F9F7F5] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="p-3 bg-[#2D3A4B] rounded-2xl">
              <Beer className="w-7 h-7 text-white" />
            </div>
          </Link>
          <h1 className="font-display font-semibold text-3xl text-[#2D3A4B] mt-4">Create your pub</h1>
          <p className="text-muted-foreground mt-1">Start taking orders in minutes</p>
        </div>

        <Card className="shadow-soft">
          <CardContent className="p-6">
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <Label htmlFor="businessName">Pub / Bar / Restaurant Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="businessName"
                    type="text"
                    placeholder="The Local Pub"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    autoComplete="email"
                  />
                </div>
                {email.length > 0 && !validation.hasEmail && (
                  <p className="text-sm text-[color:var(--theme-danger)] mt-1 flex items-center gap-1">
                    <X className="w-3 h-3" /> Enter a valid email
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    autoComplete="new-password"
                  />
                </div>
                {password.length > 0 && !validation.hasPassword && (
                  <p className="text-sm text-[color:var(--theme-danger)] mt-1 flex items-center gap-1">
                    <X className="w-3 h-3" /> At least 6 characters
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    autoComplete="new-password"
                  />
                </div>
                {confirmPassword.length > 0 && !validation.passwordsMatch && (
                  <p className="text-sm text-[color:var(--theme-danger)] mt-1 flex items-center gap-1">
                    <X className="w-3 h-3" /> Passwords don&apos;t match
                  </p>
                )}
                {confirmPassword.length > 0 && validation.passwordsMatch && (
                  <p className="text-sm text-[color:var(--theme-success)] mt-1 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Passwords match
                  </p>
                )}
              </div>

              {error && (
                <div className="p-3 bg-[color:var(--theme-danger)]/10 border border-[color:var(--theme-danger)]/30 rounded-lg">
                  <p className="text-sm text-[color:var(--theme-danger)]">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={!validation.isValid || loading}
                className="w-full bg-[#2D3A4B] hover:bg-[#1F2A38] text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-[#5D7A7D] hover:text-[#4A6265] font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
