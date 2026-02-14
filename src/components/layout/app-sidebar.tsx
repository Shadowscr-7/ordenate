// ============================================================
// App Sidebar — Main navigation component
// ============================================================

"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Brain,
  History,
  Home,
  Kanban,
  Plus,
  Settings,
  Target,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: ROUTES.DASHBOARD,
    icon: Home,
  },
  {
    label: "Tablero Eisenhower",
    href: ROUTES.EISENHOWER,
    icon: Kanban,
  },
  {
    label: "Foco Pareto",
    href: ROUTES.PARETO,
    icon: Target,
  },
  {
    label: "Historial",
    href: ROUTES.HISTORY,
    icon: History,
  },
];

interface AppSidebarProps {
  collapsed?: boolean;
}

export function AppSidebar({ collapsed = false }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "bg-sidebar text-sidebar-foreground border-sidebar-border flex h-screen flex-col border-r transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Logo */}
      <div className={cn(
        "flex items-center justify-center border-b",
        collapsed ? "h-14 px-2" : "px-4 py-5",
      )}>
        <Image
          src="/images/logo.png"
          alt="Ordénate"
          width={collapsed ? 40 : 180}
          height={collapsed ? 40 : 180}
          className={cn(
            "shrink-0 object-contain",
            collapsed ? "h-auto w-10" : "h-auto w-44",
          )}
          priority
        />
      </div>

      {/* New Dump Button */}
      <div className="p-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              asChild
              className={cn(
                "w-full bg-gradient-to-r from-primary to-cyan-500 text-white shadow-md shadow-primary/20 transition-all hover:shadow-lg hover:shadow-primary/30",
                collapsed && "px-0",
              )}
              size={collapsed ? "icon" : "default"}
            >
              <Link href={ROUTES.NEW_DUMP}>
                <Plus className="h-4 w-4" />
                {!collapsed && <span className="ml-2">Nuevo Dump</span>}
              </Link>
            </Button>
          </TooltipTrigger>
          {collapsed && (
            <TooltipContent side="right">Nuevo Dump (N)</TooltipContent>
          )}
        </Tooltip>
      </div>

      <Separator />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-2">
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary/10 text-primary shadow-sm"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                      collapsed && "justify-center px-0",
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-transform duration-200",
                        isActive && "scale-110",
                      )}
                    />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="right">{item.label}</TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Bottom: Settings */}
      <Separator />
      <div className="p-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={ROUTES.SETTINGS}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                pathname === ROUTES.SETTINGS
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                collapsed && "justify-center px-0",
              )}
            >
              <Settings
                className={cn(
                  "h-4 w-4 shrink-0 transition-transform duration-200",
                  pathname === ROUTES.SETTINGS && "scale-110",
                )}
              />
              {!collapsed && <span>Configuración</span>}
            </Link>
          </TooltipTrigger>
          {collapsed && (
            <TooltipContent side="right">Configuración</TooltipContent>
          )}
        </Tooltip>
      </div>
    </aside>
  );
}
