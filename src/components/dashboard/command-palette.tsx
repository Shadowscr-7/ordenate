// ============================================================
// Global Command Palette — Cmd+K to search & navigate
// ============================================================

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Brain,
  History,
  Home,
  Kanban,
  Moon,
  Plus,
  Settings,
  Sun,
  Target,
} from "lucide-react";
import { useTheme } from "next-themes";

import { ROUTES } from "@/lib/constants";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { setTheme, theme } = useTheme();

  // Global keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Skip when inside input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      const isInput = tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable;

      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
        return;
      }

      // Only allow shortcuts when NOT in an input
      if (isInput) return;

      if (e.key === "n" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        router.push(ROUTES.NEW_DUMP);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [router]);

  const runAction = useCallback(
    (action: () => void) => {
      setOpen(false);
      action();
    },
    [],
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Buscar página o acción…" />
      <CommandList>
        <CommandEmpty>Sin resultados.</CommandEmpty>

        <CommandGroup heading="Navegación">
          <CommandItem onSelect={() => runAction(() => router.push(ROUTES.DASHBOARD))}>
            <Home className="mr-2 h-4 w-4" />
            Dashboard
          </CommandItem>
          <CommandItem onSelect={() => runAction(() => router.push(ROUTES.EISENHOWER))}>
            <Kanban className="mr-2 h-4 w-4" />
            Tablero Eisenhower
          </CommandItem>
          <CommandItem onSelect={() => runAction(() => router.push(ROUTES.PARETO))}>
            <Target className="mr-2 h-4 w-4" />
            Foco Pareto
          </CommandItem>
          <CommandItem onSelect={() => runAction(() => router.push(ROUTES.HISTORY))}>
            <History className="mr-2 h-4 w-4" />
            Historial
          </CommandItem>
          <CommandItem onSelect={() => runAction(() => router.push(ROUTES.SETTINGS))}>
            <Settings className="mr-2 h-4 w-4" />
            Configuración
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Acciones">
          <CommandItem onSelect={() => runAction(() => router.push(ROUTES.NEW_DUMP))}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Brain Dump
            <CommandShortcut>N</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Apariencia">
          <CommandItem
            onSelect={() => runAction(() => setTheme("light"))}
          >
            <Sun className="mr-2 h-4 w-4" />
            Tema claro
            {theme === "light" && <CommandShortcut>✓</CommandShortcut>}
          </CommandItem>
          <CommandItem
            onSelect={() => runAction(() => setTheme("dark"))}
          >
            <Moon className="mr-2 h-4 w-4" />
            Tema oscuro
            {theme === "dark" && <CommandShortcut>✓</CommandShortcut>}
          </CommandItem>
          <CommandItem
            onSelect={() => runAction(() => setTheme("system"))}
          >
            <Brain className="mr-2 h-4 w-4" />
            Tema del sistema
            {theme === "system" && <CommandShortcut>✓</CommandShortcut>}
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
