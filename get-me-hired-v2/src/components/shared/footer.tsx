import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 place-items-center md:place-items-start text-center md:text-left">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2 justify-center md:justify-start">
              <Image
                src="/getmehired-light.svg"
                alt="GetMeHired"
                width={40}
                height={40}
                className="h-10 w-10"
                priority
              />
              <span className="text-lg font-bold">GetMeHired</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              AI-powered career tools to help you land your dream job faster.
            </p>
          </div>

          {/* Product Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Product</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="#try-out" className="text-muted-foreground hover:text-foreground transition-colors">
                  Try It Out
                </Link>
              </li>
              <li>
                <Link href="/auth/signup" className="text-muted-foreground hover:text-foreground transition-colors">
                  Sign Up
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Attribution */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">About</h3>
            <p className="text-sm text-muted-foreground">
              Built by{" "}
              <Link
                href="https://github.com/Krinhj"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:text-foreground transition-colors"
              >
                Ronnie Talabucon Jr.
              </Link>
            </p>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} GetMeHired. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

