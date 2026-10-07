"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  RiSunLine,
  RiMoonLine,
  RiComputerLine,
  RiCheckLine,
} from "@remixicon/react"
import { cn } from "@/lib/utils"

export interface ThemeToggleProps {
  /**
   * Display mode:
   * - "dropdown": Compact icon button opening a menu with Light / Dark / System
   * - "segmented": Horizontal 3-button segmented control (ideal for mobile / settings / footer)
   * - "cycle": Clickable button that directly cycles light -> dark -> system
   */
  variant?: "dropdown" | "segmented" | "cycle"
  className?: string
  size?: "default" | "sm" | "xs"
}

export function ThemeToggle({
  variant = "dropdown",
  className,
  size = "sm",
}: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Avoid hydration mismatch by rendering a neutral placeholder until mounted
  if (!mounted) {
    if (variant === "segmented") {
      return (
        <div
          className={cn(
            "inline-flex items-center gap-1 rounded-xl border border-border/80 bg-muted/40 p-1",
            className
          )}
        >
          <div className="h-7 w-20 rounded-lg bg-muted/60 animate-pulse" />
          <div className="h-7 w-20 rounded-lg bg-muted/60 animate-pulse" />
          <div className="h-7 w-20 rounded-lg bg-muted/60 animate-pulse" />
        </div>
      )
    }

    return (
      <Button
        variant="ghost"
        size="icon-sm"
        className={cn("text-muted-foreground", className)}
        aria-label="Toggle theme"
        disabled
      >
        <span className="size-4 rounded-full bg-muted-foreground/30 animate-pulse" />
      </Button>
    )
  }

  // Segmented Pill Control (ideal for mobile nav, account settings, footer)
  if (variant === "segmented") {
    const options: Array<{
      value: "light" | "dark" | "system"
      label: string
      icon: React.ComponentType<{ className?: string }>
    }> = [
      { value: "light", label: "Light", icon: RiSunLine },
      { value: "dark", label: "Dark", icon: RiMoonLine },
      { value: "system", label: "System", icon: RiComputerLine },
    ]

    return (
      <div
        role="radiogroup"
        aria-label="Select color theme"
        className={cn(
          "inline-flex items-center gap-1 rounded-xl border border-border/80 bg-muted/50 p-1 shadow-2xs",
          className
        )}
      >
        {options.map((option) => {
          const Icon = option.icon
          const isActive = theme === option.value
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => setTheme(option.value)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/40"
              )}
            >
              <Icon
                className={cn(
                  "size-3.5",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              />
              <span>{option.label}</span>
            </button>
          )
        })}
      </div>
    )
  }

  // Cycle Mode
  if (variant === "cycle") {
    const cycleNext = () => {
      if (theme === "light") setTheme("dark")
      else if (theme === "dark") setTheme("system")
      else setTheme("light")
    }

    return (
      <Button
        variant="ghost"
        size={size === "sm" ? "icon-sm" : "icon"}
        onClick={cycleNext}
        className={cn("text-muted-foreground hover:text-foreground", className)}
        title={`Current: ${theme} (Click to switch)`}
        aria-label={`Current theme: ${theme}. Click to switch theme`}
      >
        {theme === "dark" || (theme === "system" && resolvedTheme === "dark") ? (
          <RiMoonLine className="size-4 text-emerald-400" />
        ) : theme === "light" || (theme === "system" && resolvedTheme === "light") ? (
          <RiSunLine className="size-4 text-amber-500" />
        ) : (
          <RiComputerLine className="size-4" />
        )}
      </Button>
    )
  }

  // Default: Dropdown Menu
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size={size === "sm" ? "icon-sm" : "icon"}
            className={cn(
              "text-muted-foreground hover:text-foreground transition-colors cursor-pointer",
              className
            )}
            aria-label={`Select theme, current theme is ${theme}`}
          />
        }
      >
        {resolvedTheme === "dark" ? (
          <RiMoonLine className="size-4 transition-transform duration-200" />
        ) : (
          <RiSunLine className="size-4 transition-transform duration-200 text-amber-500/90" />
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className="flex items-center justify-between cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <RiSunLine className="size-4 text-amber-500" />
            <span>Light</span>
          </span>
          {theme === "light" && <RiCheckLine className="size-4 text-primary ml-auto" />}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className="flex items-center justify-between cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <RiMoonLine className="size-4 text-emerald-400" />
            <span>Dark</span>
          </span>
          {theme === "dark" && <RiCheckLine className="size-4 text-primary ml-auto" />}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className="flex items-center justify-between cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <RiComputerLine className="size-4 text-muted-foreground" />
            <span>System</span>
          </span>
          {theme === "system" && <RiCheckLine className="size-4 text-primary ml-auto" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
