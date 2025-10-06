"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Power } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return null;
  }

  const hideToggle = !pathname || pathname === "/" || pathname.startsWith("/auth") || pathname.startsWith("/onboarding");
  if (hideToggle) {
    return null;
  }

  const isDark = resolvedTheme === "dark";
  const nextTheme = isDark ? "light" : "dark";
  const isDashboard = pathname?.startsWith("/dashboard");

  return (
    <button
      type="button"
      aria-label={`Switch to ${nextTheme} mode`}
      onClick={() => setTheme(nextTheme)}
      className={cn(
        "button-surface flex h-7 w-7 items-center justify-center rounded-md border border-border/50 shadow-s cursor-pointer",
        "hover:shadow-m transition",
        !isDashboard && "mr-3"
      )}
    >
      <Power
        className={cn("h-4 w-4", isDark ? "text-primary" : "text-muted-foreground")}
        aria-hidden="true"
      />
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}

