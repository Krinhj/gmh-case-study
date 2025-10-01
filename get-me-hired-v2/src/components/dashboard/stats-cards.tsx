import { Briefcase, Clock, FileText, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stats = [
  {
    title: "Total Applications",
    value: "12",
    icon: Briefcase,
    color: "text-blue-500",
  },
  {
    title: "Active Applications",
    value: "8",
    icon: Clock,
    color: "text-orange-500",
  },
  {
    title: "Documents Generated",
    value: "24",
    icon: FileText,
    color: "text-green-500",
  },
  {
    title: "Avg Match Score",
    value: "78%",
    icon: TrendingUp,
    color: "text-purple-500",
  },
];

export function StatsCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <Icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
