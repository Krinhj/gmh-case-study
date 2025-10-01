"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import PrismaticBurst, { PrismaticBurstProps } from "./prismatic-burst";

type ThemedPrismaticBurstProps = Omit<PrismaticBurstProps, 'colors'> & {
  lightColors?: string[];
  darkColors?: string[];
};

export function ThemedPrismaticBurst({
  lightColors = ['#3b82f6', '#8b5cf6', '#06b6d4'], // Blue, Purple, Cyan (softer for light mode)
  darkColors = ['#4d3dff', '#ff007a', '#00d4ff'], // Vibrant Blue, Pink, Cyan (for dark mode)
  ...props
}: ThemedPrismaticBurstProps) {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Wait for theme to mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Use resolvedTheme to get actual theme (accounts for system preference)
  const currentTheme = mounted ? resolvedTheme : 'dark';
  const colors = currentTheme === 'light' ? lightColors : darkColors;

  // Adjust intensity for light mode (lower intensity for better visibility)
  const intensity = currentTheme === 'light' ? (props.intensity ?? 1.5) : (props.intensity ?? 2);

  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return null;
  }

  return (
    <PrismaticBurst
      {...props}
      colors={colors}
      intensity={intensity}
    />
  );
}
