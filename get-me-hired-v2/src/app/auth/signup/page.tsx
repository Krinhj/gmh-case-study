"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Mail, Lock, ArrowRight, ArrowLeft, Eye, EyeOff, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authHelpers } from "@/lib/auth";
import { ThemedPrismaticBurst } from "@/components/ui/themed-prismatic-burst";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error: authError } = await authHelpers.signUp(email, password, "");

      if (authError) {
        setError(authError.message || "Failed to create account");
        setIsLoading(false);
        return;
      }

      // Show success message (email confirmation required)
      setSuccess(true);
      setIsLoading(false);
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError("");
    setIsLoading(true);

    try {
      const { error: authError } = await authHelpers.loginWithGoogle();

      if (authError) {
        setError(authError.message || "Failed to sign up with Google");
        setIsLoading(false);
      }
      // OAuth will redirect automatically
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-4 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        <ThemedPrismaticBurst
          animationType="rotate3d"
          intensity={1.8}
          speed={0.3}
          distort={1.2}
          rayCount={24}
          mixBlendMode="lighten"
          lightColors={['#60a5fa', '#a78bfa', '#22d3ee']}
          darkColors={['#4d3dff', '#ff007a', '#00d4ff']}
        />
      </div>

      <Card className="w-full max-w-2xl relative z-10">
        {/* Back Button */}
        <div className="absolute top-4 left-4 z-10">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Landing
            </Link>
          </Button>
        </div>

        <CardContent className="p-6 lg:p-8">
          {/* Logo & Branding - Centered */}
          <div className="flex flex-col items-center gap-3 mb-6">
            <Image
              src="/getmehired-light.svg"
              alt="GetMeHired Logo"
              width={48}
              height={48}
              className="h-12 w-12"
            />
            <h1 className="text-xl font-bold">GetMeHired</h1>
          </div>

          {/* Form Header - Only show when not success */}
          {!success && (
            <div className="text-center space-y-1.5 mb-6">
              <CardTitle className="text-xl font-bold">Create an account</CardTitle>
              <CardDescription className="text-sm">
                Enter your information to get started with AI-powered résumés
              </CardDescription>
            </div>
          )}

          {/* Success Message */}
          {success ? (
            <div className="space-y-6">
              {/* Icon and Success Header */}
              <div className="flex flex-col items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                  <MailCheck className="h-10 w-10 text-green-600 dark:text-green-500" />
                </div>
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold">Check your email</h2>
                  <p className="text-muted-foreground">
                    We've sent a confirmation link to
                  </p>
                  <p className="font-medium text-foreground">{email}</p>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-muted/50 border rounded-lg p-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Next steps:</span>
                </p>
                <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                  <li>Open the email from GetMeHired</li>
                  <li>Click the confirmation link</li>
                  <li>Return to login with your credentials</li>
                </ol>
              </div>

              {/* Additional Info */}
              <div className="text-center space-y-4">
                <p className="text-xs text-muted-foreground">
                  Didn't receive the email? Check your spam folder or{" "}
                  <button
                    className="text-primary hover:underline font-medium"
                    onClick={() => setSuccess(false)}
                  >
                    try again
                  </button>
                </p>
                <Button className="w-full cursor-pointer" variant="default" asChild>
                  <Link href="/auth/login">
                    Go to Login
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <>
              <form onSubmit={handleSignUp} className="space-y-4">
                {/* Error Message */}
                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-2.5 rounded">
                    {error}
                  </div>
                )}
            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="auth-input pl-10"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="auth-input pl-10 pr-10"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                At least 6 characters
              </p>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="********"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="auth-input pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full gap-2" disabled={isLoading}>
              {isLoading ? (
                "Creating account..."
              ) : (
                <>
                  Create Account
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          {/* OAuth Buttons */}
          <div className="grid gap-2">
            <Button variant="outline" type="button" className="cursor-pointer" disabled={isLoading} onClick={handleGoogleSignUp}>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Google
            </Button>
          </div>

          {/* Login Link */}
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-semibold text-primary hover:underline">
              Log in
            </Link>
          </p>

              {/* Terms */}
              <p className="mt-3 text-center text-xs text-muted-foreground">
                By creating an account, you agree to our{" "}
                <Link href="#" className="underline hover:text-foreground">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="#" className="underline hover:text-foreground">
                  Privacy Policy
                </Link>
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


