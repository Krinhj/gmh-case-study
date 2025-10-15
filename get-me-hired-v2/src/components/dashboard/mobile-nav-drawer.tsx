"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { Menu, X, LogOut } from "lucide-react"

import { Button } from "@/components/ui/button"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerClose,
  DrawerFooter,
  DrawerTitle,
} from "@/components/ui/drawer"
import { authHelpers } from "@/lib/auth"
import { cn } from "@/lib/utils"

import { NAV_ITEMS } from "./nav-items"

interface MobileNavDrawerProps {
  triggerClassName?: string
}

export function MobileNavDrawer({ triggerClassName }: MobileNavDrawerProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { resolvedTheme } = useTheme()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const logoSrc = resolvedTheme === "light" ? "/getmehired-dark.svg" : "/getmehired-light.svg"

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await authHelpers.logout()
      router.push("/auth/login")
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("md:hidden", triggerClassName)}
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="md:hidden">
        <VisuallyHidden>
          <DrawerTitle>Navigation</DrawerTitle>
        </VisuallyHidden>
        <div className="px-6 py-4 flex items-center justify-between border-b">
          <div className="flex items-center gap-3">
            <Image src={logoSrc} alt="GetMeHired Logo" width={36} height={36} />
            <span className="text-lg font-semibold">GetMeHired</span>
          </div>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon" aria-label="Close navigation menu">
              <X className="h-5 w-5" />
            </Button>
          </DrawerClose>
        </div>

        <nav className="px-2 py-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <DrawerClose asChild key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              </DrawerClose>
            )
          })}
        </nav>

        <DrawerFooter className="border-t">
          <DrawerClose asChild>
            <Button
              variant="ghost"
              className="justify-start gap-3 text-muted-foreground hover:text-foreground"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              <LogOut className="h-5 w-5" />
              {isLoggingOut ? "Logging out..." : "Logout"}
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
