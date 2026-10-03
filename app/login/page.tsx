"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/context/auth-context";
import { supabase } from "@/lib/supabase/client";
import { normalizeUsername, toLoginEmail } from "@/lib/supabase/login";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const next = searchParams.get("next") || "/";

  // Already signed in — go where you were headed
  useEffect(() => {
    if (!loading && user) {
      router.replace(next);
    }
  }, [loading, user, router, next]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const clean = normalizeUsername(username);
    if (!clean) {
      setError("Enter your username.");
      return;
    }
    setBusy(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: toLoginEmail(clean),
      password,
    });
    setBusy(false);
    if (signInError) {
      setError(
        signInError.message === "Invalid login credentials"
          ? "Incorrect username or password."
          : signInError.message
      );
      return;
    }
    router.replace(next);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardContent className="p-8 space-y-6">
          <div className="text-center space-y-1">
            <div className="font-sans text-sm font-semibold tracking-[0.12em] text-black uppercase">
              Varnika Console
            </div>
            <p className="text-xs text-neutral-500">
              Sign in with your staff account.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-neutral-600">Username</label>
              <input
                type="text"
                required
                autoCapitalize="none"
                autoCorrect="off"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. anand"
                className="w-full px-2.5 py-2 bg-white border border-[#E6E3DB] text-xs focus:outline-none focus:border-black rounded-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-neutral-600">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-2.5 py-2 bg-white border border-[#E6E3DB] text-xs focus:outline-none focus:border-black rounded-xs"
              />
            </div>

            {error && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-xs text-red-700 rounded-xs">
                {error}
              </div>
            )}

            <Button variant="default" size="sm" className="w-full" disabled={busy}>
              {busy ? "Signing in…" : "Sign In"}
            </Button>
          </form>

          <p className="text-[11px] text-neutral-400 text-center leading-relaxed">
            Ask the administrator for your username and password.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
