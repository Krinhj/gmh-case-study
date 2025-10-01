import { TrendingUp, Sparkles, Target } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: TrendingUp,
    title: "Track Applications",
    description:
      "Organize and monitor all your job applications in one place. Never lose track of where you applied.",
    color: "text-blue-500 bg-blue-50 dark:bg-blue-950",
  },
  {
    icon: Sparkles,
    title: "AI-Powered Generation",
    description:
      "Create perfectly tailored résumés and cover letters for each application using advanced AI technology.",
    color: "text-cyan-500 bg-cyan-50 dark:bg-cyan-950",
  },
  {
    icon: Target,
    title: "Smart Job Matching",
    description:
      "Get insights on how well your profile matches each job posting. Know your chances before applying.",
    color: "text-green-500 bg-green-50 dark:bg-green-950",
  },
];

export function FeatureCards() {
  return (
    <section className="container py-20">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Everything You Need to Land Your Next Role
          </h2>
          <p className="text-muted-foreground text-lg">
            Powerful features to streamline your job search
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="border-2">
              <CardHeader>
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-lg ${feature.color} mb-4`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
