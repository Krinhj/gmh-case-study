import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const benefits = [
  "Free to start",
  "No credit card required",
  "Cancel anytime",
];

export function CTASection() {
  return (
    <section className="container py-12 sm:py-20">
      <div className="max-w-4xl mx-auto">
        <div className="rounded-2xl bg-muted/50 px-4 py-8 sm:px-8 sm:py-16 text-center space-y-6 sm:space-y-8">
          {/* Heading */}
          <div className="space-y-4">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Ready to Transform Your Job Search?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join thousands of job seekers who are landing interviews faster with GetMeHired
            </p>
          </div>

          {/* Benefits List */}
          <div className="flex flex-wrap justify-center gap-3 sm:gap-6">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-center gap-2 text-sm font-medium">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-success text-success-foreground">
                  <Check className="h-3 w-3" />
                </div>
                {benefit}
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <Button size="lg" className="w-full sm:w-auto gap-2" asChild>
            <Link href="/auth/signup">
              Get Started Now
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}


