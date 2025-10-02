"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemedPrismaticBurst } from "@/components/ui/themed-prismatic-burst";

export function HeroSection() {
  const scrollToTryOut = () => {
    document.getElementById("try-out")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen overflow-hidden pt-20">
      {/* Animated Background - Full width */}
      <div className="absolute inset-0 left-0 right-0 w-screen -z-10">
        <ThemedPrismaticBurst
          animationType="rotate3d"
          intensity={1.8}
          speed={0.3}
          distort={1.2}
          rayCount={24}
          mixBlendMode="lighten"
          lightColors={['#60a5fa', '#a78bfa', '#22d3ee']} // Light blue, light purple, light cyan
          darkColors={['#4d3dff', '#ff007a', '#00d4ff']} // Vibrant blue, pink, cyan
        />
      </div>

      {/* Content Container */}
      <div className="container relative z-10 flex min-h-screen flex-col items-center justify-center gap-8 py-20 text-center -mt-16">
      {/* Badge */}
      <Badge variant="secondary" className="gap-2 px-4 py-2 text-sm">
        <Sparkles className="h-4 w-4" />
        AI-Powered Career Tools
      </Badge>

      {/* Headline */}
      <div className="max-w-4xl space-y-4">
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
          Get Hired Faster with{" "}
          <span className="gradient-text">AI-Powered Résumés</span>
        </h1>
        <p className="text-lg text-muted-foreground sm:text-xl max-w-2xl mx-auto">
          Generate tailored résumés and cover letters in seconds. Track applications,
          analyze job matches, and land your dream role with confidence.
        </p>
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <Button size="lg" onClick={scrollToTryOut} className="gap-2 cursor-pointer">
          Try It Now - No Signup Required
          <ArrowRight className="h-5 w-5" />
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/auth/signup">Sign Up Free</Link>
        </Button>
      </div>
      </div>
    </section>
  );
}
