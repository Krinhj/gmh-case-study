import Link from "next/link";
import { ExternalLink, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Dummy data - will be replaced with real data from Supabase
const recentApplications = [
  {
    id: 1,
    company: "Google",
    role: "Senior Frontend Engineer",
    status: "interviewing",
    dateApplied: "2025-09-28",
  },
  {
    id: 2,
    company: "Meta",
    role: "Product Designer",
    status: "applied",
    dateApplied: "2025-09-25",
  },
  {
    id: 3,
    company: "Amazon",
    role: "Full Stack Developer",
    status: "offer",
    dateApplied: "2025-09-22",
  },
];

const statusColors: Record<string, string> = {
  applied: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  interviewing: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  offer: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export function RecentApplications() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Applications</CardTitle>
            <CardDescription>Your latest job applications</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/applications">
              View All
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentApplications.map((app) => (
            <div
              key={app.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold">{app.role}</h3>
                  <Badge className={statusColors[app.status]} variant="secondary">
                    {app.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <span>{app.company}</span>
                  <span>•</span>
                  <span>{new Date(app.dateApplied).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/applications/${app.id}`}>View</Link>
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Generate
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
