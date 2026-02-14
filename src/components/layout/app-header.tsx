// ============================================================
// App Header — Top bar with user menu and theme toggle
// ============================================================

"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import {
  LogOut,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
} from "lucide-react";

import { signOut } from "@/lib/auth/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AppHeaderProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  userEmail?: string | null;
  userName?: string | null;
}

export function AppHeader({
  sidebarCollapsed,
  onToggleSidebar,
  userEmail,
  userName,
}: AppHeaderProps) {
  const { theme, setTheme } = useTheme();
  const [signingOut, setSigningOut] = useState(false);

  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : userEmail?.slice(0, 2).toUpperCase() ?? "OD";

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
  }

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm">
      {/* Left: Toggle sidebar */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="transition-transform duration-200 hover:scale-105"
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {sidebarCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
        </TooltipContent>
      </Tooltip>

      {/* Right: Theme + User */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                setTheme(theme === "dark" ? "light" : "dark")
              }
              className="transition-transform duration-200 hover:scale-105"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Cambiar tema</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Cambiar tema</TooltipContent>
        </Tooltip>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-9 w-9 rounded-full ring-2 ring-primary/20 transition-all hover:ring-primary/40"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-cyan-400/20 text-xs font-bold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <div className="flex items-center justify-start gap-2 p-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-cyan-400/20 text-xs font-bold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col space-y-1 leading-none">
                {userName && (
                  <p className="text-sm font-medium">{userName}</p>
                )}
                {userEmail && (
                  <p className="text-xs text-muted-foreground">{userEmail}</p>
                )}
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <button
                className="w-full cursor-pointer"
                onClick={handleSignOut}
                disabled={signingOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {signingOut ? "Cerrando sesión..." : "Cerrar sesión"}
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
