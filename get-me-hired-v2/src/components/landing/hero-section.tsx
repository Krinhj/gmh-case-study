"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function HeroSection() {
  const scrollToTryOut = () => {
    document.getElementById("try-out")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="container flex min-h-[600px] flex-col items-center justify-center gap-8 py-20 text-center">
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
        <Button size="lg" onClick={scrollToTryOut} className="gap-2">
          Try It Now - No Signup Required
          <ArrowRight className="h-5 w-5" />
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/auth/signup">Sign Up Free</Link>
        </Button>
      </div>
    </section>
  );
}
