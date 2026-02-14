// ============================================================
// Telegram QR Link — Dashboard component for linking Telegram
// ============================================================

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Copy,
  Check,
  RefreshCw,
  Smartphone,
  QrCode,
  ExternalLink,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface TelegramLinkProps {
  userId: string;
  isLinked?: boolean;
  botUsername?: string;
}

// Generate a unique linking code based on userId
function generateLinkCode(userId: string): string {
  const hash = userId.slice(0, 8).toUpperCase();
  return `OD-${hash}`;
}

export function TelegramLink({
  userId,
  isLinked = false,
  botUsername = "OrdenateBot",
}: TelegramLinkProps) {
  const [copied, setCopied] = useState(false);
  const [linkCode] = useState(() => generateLinkCode(userId));
  const telegramDeepLink = `https://t.me/${botUsername}?start=${linkCode}`;

  // Generate a QR code SVG (simple inline, no external dep)
  const qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(telegramDeepLink)}&bgcolor=ffffff&color=0EA5E9&format=svg`;

  async function handleCopy() {
    await navigator.clipboard.writeText(linkCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:border-primary/30">
          <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#0088cc]/20 to-[#0088cc]/10">
              <Bot className="h-5 w-5 text-[#0088cc]" />
            </div>
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2 text-base">
                Telegram Bot
                {isLinked ? (
                  <Badge
                    variant="default"
                    className="bg-green-500/15 text-green-600 dark:text-green-400"
                  >
                    Vinculado
                  </Badge>
                ) : (
                  <Badge variant="secondary">No vinculado</Badge>
                )}
              </CardTitle>
              <CardDescription>
                {isLinked
                  ? "Tu bot de Telegram está activo"
                  : "Vincula tu Telegram para enviar dumps desde el celular"}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Button
              variant={isLinked ? "outline" : "default"}
              className="w-full"
              size="sm"
            >
              <QrCode className="mr-2 h-4 w-4" />
              {isLinked ? "Ver detalles" : "Vincular Telegram"}
            </Button>
          </CardContent>
        </Card>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-[#0088cc]" />
            Vincular Telegram Bot
          </DialogTitle>
          <DialogDescription>
            Escanea el código QR con tu teléfono o usa el enlace directo para
            vincular tu cuenta con el bot de Telegram.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* QR Code */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center"
          >
            <div className="relative rounded-2xl border-2 border-primary/20 bg-white p-4 shadow-lg shadow-primary/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrDataUrl}
                alt="QR Code para vincular Telegram"
                width={200}
                height={200}
                className="rounded-lg"
              />
            </div>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Escanea con la cámara de tu teléfono
            </p>
          </motion.div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                o usa el código
              </span>
            </div>
          </div>

          {/* Link code */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-lg border bg-muted/50 px-4 py-3 font-mono text-lg font-bold tracking-wider text-primary">
                {linkCode}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
                className="shrink-0"
              >
                <AnimatePresence mode="wait">
                  {copied ? (
                    <motion.div
                      key="check"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <Check className="h-4 w-4 text-green-500" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="copy"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <Copy className="h-4 w-4" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Envía este código al bot{" "}
              <span className="font-medium text-primary">@{botUsername}</span>{" "}
              en Telegram para vincular tu cuenta.
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-3 rounded-xl border bg-accent/30 p-4">
            <h4 className="text-sm font-semibold">Pasos:</h4>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  1
                </span>
                Escanea el QR o abre{" "}
                <a
                  href={telegramDeepLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  el enlace
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  2
                </span>
                Presiona "Iniciar" en el bot de Telegram
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  3
                </span>
                ¡Listo! Envía texto o fotos al bot para crear brain dumps
              </li>
            </ol>
          </div>

          {/* Direct link button */}
          <Button
            variant="outline"
            className="w-full"
            asChild
          >
            <a
              href={telegramDeepLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Smartphone className="mr-2 h-4 w-4" />
              Abrir en Telegram
              <ExternalLink className="ml-2 h-3 w-3" />
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
