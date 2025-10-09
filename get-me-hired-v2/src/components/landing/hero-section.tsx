"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemedPrismaticBurst } from "@/components/ui/themed-prismatic-burst";

export function HeroSection() {
  const [isMobile, setIsMobile] = React.useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 640px)");
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setIsMobile(mq.matches);
    const updateRm = () => setPrefersReducedMotion(rm.matches);
    update(); updateRm();
    mq.addEventListener?.("change", update);
    rm.addEventListener?.("change", updateRm);
    return () => {
      mq.removeEventListener?.("change", update);
      rm.removeEventListener?.("change", updateRm);
    };
  }, []);
  const scrollToTryOut = () => {
    document.getElementById("try-out")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen overflow-hidden pt-20">
      {/* Animated Background - Full width */}
      <div className="absolute inset-0 -z-10">
        <ThemedPrismaticBurst
          animationType={isMobile ? "rotate" : "rotate3d"}
          intensity={prefersReducedMotion ? 0.8 : (isMobile ? 1.0 : 1.8)}
          speed={prefersReducedMotion ? 0.15 : (isMobile ? 0.2 : 0.3)}
          distort={prefersReducedMotion ? 0.6 : (isMobile ? 0.8 : 1.2)}
          rayCount={isMobile ? 12 : 24}
          mixBlendMode={isMobile ? "normal" : "lighten"}
          lightColors={["#60a5fa", "#a78bfa", "#22d3ee"]}
          darkColors={["#4d3dff", "#ff007a", "#00d4ff"]}
        />
      </div>

      {/* Content Container */}
      <div className="container relative z-10 flex min-h-screen flex-col items-center justify-center gap-6 sm:gap-8 py-12 sm:py-20 text-center -mt-16">
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
        <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
          <Link href="/auth/signup">Sign Up Free</Link>
        </Button>
      </div>
      </div>
    </section>
  );
}



