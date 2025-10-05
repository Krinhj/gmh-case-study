import Link from "next/link";
import { Plus, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks to get you started</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <Button className="h-auto flex-col gap-2 py-6" variant="outline" asChild>
          <Link href="/applications">
            <Plus className="h-6 w-6" />
            <span className="font-semibold">Add Application</span>
            <span className="text-xs text-muted-foreground">Track a new job</span>
          </Link>
        </Button>

        <Button className="h-auto flex-col gap-2 py-6" variant="outline" asChild>
          <Link href="/generate">
            <Sparkles className="h-6 w-6" />
            <span className="font-semibold">Generate Documents</span>
            <span className="text-xs text-muted-foreground">Create résumé & cover letter</span>
          </Link>
        </Button>

      </CardContent>
    </Card>
  );
}
