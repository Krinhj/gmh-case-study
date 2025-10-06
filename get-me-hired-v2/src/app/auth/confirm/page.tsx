"use client";

import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemedPrismaticBurst } from "@/components/ui/themed-prismatic-burst";

export default function ConfirmEmailPage() {
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

      <Card className="w-full max-w-md relative z-10">
        <CardContent className="p-8 lg:p-12">
          {/* Logo & Branding - Centered */}
          <div className="flex flex-col items-center gap-4 mb-8">
            <Image
              src="/getmehired-light.svg"
              alt="GetMeHired Logo"
              width={64}
              height={64}
              className="h-16 w-16"
            />
            <h1 className="text-2xl font-bold">GetMeHired</h1>
          </div>

          {/* Success Content */}
          <div className="space-y-6">
            {/* Icon and Success Header */}
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-500" />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">Email Confirmed!</h2>
                <p className="text-muted-foreground">
                  Your email has been successfully verified. You can now log in to your account.
                </p>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-muted/50 border rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium text-foreground">What's next?</p>
              <p className="text-sm text-muted-foreground">
                Click the button below to log in and start creating AI-powered résumés tailored to your dream jobs.
              </p>
            </div>

            {/* Login Button */}
            <Button className="w-full cursor-pointer" variant="default" asChild>
              <Link href="/auth/login">
                Go to Login
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
