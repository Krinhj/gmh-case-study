"use client"

import * as React from "react"
import {
  Drawer as DrawerPrimitive,
  Portal as DrawerPortalPrimitive,
  Overlay as DrawerOverlayPrimitive,
  Content as DrawerContentPrimitive,
} from "vaul"

import { cn } from "@/lib/utils"

const Drawer = DrawerPrimitive.Root

const DrawerTrigger = DrawerPrimitive.Trigger

const DrawerPortal = DrawerPortalPrimitive

const DrawerClose = DrawerPrimitive.Close

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerOverlayPrimitive>,
  React.ComponentPropsWithoutRef<typeof DrawerOverlayPrimitive>
>(({ className, ...props }, ref) => (
  <DrawerOverlayPrimitive
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
))
DrawerOverlay.displayName = DrawerOverlayPrimitive.displayName

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerContentPrimitive>,
  React.ComponentPropsWithoutRef<typeof DrawerContentPrimitive>
>(({ className, children, ...props }, ref) => (
  <DrawerPortal>
    <DrawerOverlay />
    <DrawerContentPrimitive
      ref={ref}
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto max-h-[100dvh] w-full flex-col rounded-t-[10px] border bg-background data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom md:left-auto md:right-0 md:top-0 md:mt-0 md:h-screen md:w-80 md:rounded-none md:border-l md:data-[state=closed]:slide-out-to-right md:data-[state=open]:slide-in-from-right",
        className,
      )}
      {...props}
    >
      <div className="mx-auto mt-4 h-1.5 w-12 rounded-full bg-muted md:hidden" />
      {children}
    </DrawerContentPrimitive>
  </DrawerPortal>
))
DrawerContent.displayName = DrawerContentPrimitive.displayName

const DrawerHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "grid gap-1.5 px-6 py-4 text-center md:text-left",
      className,
    )}
    {...props}
  />
)

const DrawerFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "mt-auto flex flex-col gap-2 px-6 py-4 md:px-8 md:py-6",
      className,
    )}
    {...props}
  />
)

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-none", className)}
    {...props}
  />
))
DrawerTitle.displayName = DrawerPrimitive.Title.displayName

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DrawerDescription.displayName = DrawerPrimitive.Description.displayName

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}
