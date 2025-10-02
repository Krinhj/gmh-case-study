import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <nav className="fixed top-0 z-50 w-full pt-4 px-4">
      <div className="container">
        <div className="flex h-14 items-center justify-between rounded-full border border-border/40 bg-background/80 backdrop-blur-md px-6 shadow-lg supports-[backdrop-filter]:bg-background/60">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Image
              src="/getmehired.svg"
              alt="GetMeHired Logo"
              width={32}
              height={32}
              className="h-8 w-8"
            />
            <span className="text-lg font-bold">GetMeHired</span>
          </Link>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            <Button className="rounded-full" variant="ghost" size="sm" asChild>
              <Link href="/auth/login">Log In</Link>
            </Button>
            <Button size="sm" className="rounded-full" asChild>
              <Link href="/auth/signup">Sign Up</Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
