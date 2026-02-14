// ============================================================
// Telegram QR Link — Dashboard component for linking Telegram
// ============================================================

"use client";

import { useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  Camera,
  Check,
  Copy,
  ExternalLink,
  MessageSquare,
  QrCode,
  Smartphone,
  Unlink,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
  const [showRelink, setShowRelink] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [linkCode] = useState(() => generateLinkCode(userId));
  const telegramDeepLink = `https://t.me/${botUsername}?start=${linkCode}`;

  const qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(telegramDeepLink)}&bgcolor=ffffff&color=0EA5E9&format=svg`;

  async function handleCopy() {
    await navigator.clipboard.writeText(linkCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleUnlink() {
    startTransition(async () => {
      const res = await fetch("/api/telegram/unlink", { method: "POST" });
      if (res.ok) {
        router.refresh();
      }
    });
  }

  return (
    <Dialog onOpenChange={() => setShowRelink(false)}>
      <DialogTrigger asChild>
        <Card
          className={`group cursor-pointer transition-all duration-300 hover:shadow-lg ${
            isLinked
              ? "border-green-500/20 hover:border-green-500/40 hover:shadow-green-500/10"
              : "hover:shadow-primary/10 hover:border-primary/30"
          }`}
        >
          <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${
                isLinked
                  ? "from-green-500/20 to-emerald-500/10"
                  : "from-[#0088cc]/20 to-[#0088cc]/10"
              }`}
            >
              <Bot className={`h-5 w-5 ${isLinked ? "text-green-500" : "text-[#0088cc]"}`} />
            </div>
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2 text-base">
                Telegram Bot
                {isLinked ? (
                  <Badge
                    variant="default"
                    className="border-green-500/20 bg-green-500/15 text-green-600 dark:text-green-400"
                  >
                    <Check className="mr-1 h-3 w-3" />
                    Vinculado
                  </Badge>
                ) : (
                  <Badge variant="secondary">No vinculado</Badge>
                )}
              </CardTitle>
              <CardDescription>
                {isLinked
                  ? "Envía texto o fotos al bot para crear brain dumps"
                  : "Vincula tu Telegram para enviar dumps desde el celular"}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Button
              variant={isLinked ? "outline" : "default"}
              className={`w-full ${isLinked ? "border-green-500/30 text-green-600 hover:bg-green-500/5 dark:text-green-400" : ""}`}
              size="sm"
            >
              {isLinked ? (
                <>
                  <Bot className="mr-2 h-4 w-4" />
                  Administrar vinculación
                </>
              ) : (
                <>
                  <QrCode className="mr-2 h-4 w-4" />
                  Vincular Telegram
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        {isLinked && !showRelink ? (
          /* ─── LINKED STATE ─────────────────────────────── */
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/15">
                  <Check className="h-4 w-4 text-green-500" />
                </div>
                Telegram Vinculado
              </DialogTitle>
              <DialogDescription>
                Tu cuenta de Telegram está conectada con Ordénate.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 pt-4">
              {/* What you can do */}
              <div className="bg-accent/30 space-y-3 rounded-xl border p-4">
                <h4 className="text-sm font-semibold">Qué puedes hacer:</h4>
                <ul className="text-muted-foreground space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <div className="bg-primary/10 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg">
                      <MessageSquare className="text-primary h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-foreground font-medium">Enviar texto</p>
                      <p className="text-xs">
                        Escribe al bot y se crea un brain dump automáticamente
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="bg-primary/10 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg">
                      <Camera className="text-primary h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-foreground font-medium">Enviar fotos</p>
                      <p className="text-xs">
                        Fotos de notas o pizarras se procesan como brain dumps
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Open in Telegram button */}
              <Button
                variant="default"
                className="w-full bg-[#0088cc] text-white hover:bg-[#0077b5]"
                asChild
              >
                <a href={`https://t.me/${botUsername}`} target="_blank" rel="noopener noreferrer">
                  <Bot className="mr-2 h-4 w-4" />
                  Abrir chat en Telegram
                  <ExternalLink className="ml-2 h-3 w-3" />
                </a>
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card text-muted-foreground px-2">opciones</span>
                </div>
              </div>

              {/* Re-link / Unlink buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  size="sm"
                  onClick={() => setShowRelink(true)}
                >
                  <QrCode className="mr-2 h-4 w-4" />
                  Vincular otro
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-red-500/20 text-red-500 hover:bg-red-500/5 hover:text-red-600"
                  size="sm"
                  onClick={handleUnlink}
                  disabled={isPending}
                >
                  <Unlink className="mr-2 h-4 w-4" />
                  {isPending ? "Desvinculando..." : "Desvincular"}
                </Button>
              </div>
            </div>
          </>
        ) : (
          /* ─── UNLINKED / RE-LINK STATE ─────────────────── */
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-[#0088cc]" />
                {showRelink ? "Vincular otro Telegram" : "Vincular Telegram Bot"}
              </DialogTitle>
              <DialogDescription>
                {showRelink
                  ? "Escanea el código QR con el nuevo teléfono para reemplazar la vinculación actual."
                  : "Escanea el código QR con tu teléfono o usa el enlace directo para vincular tu cuenta con el bot de Telegram."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 pt-4">
              {/* QR Code */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center"
                data-tour="telegram-qr"
              >
                <div className="border-primary/20 shadow-primary/5 relative rounded-2xl border-2 bg-white p-4 shadow-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrDataUrl}
                    alt="QR Code para vincular Telegram"
                    width={200}
                    height={200}
                    className="rounded-lg"
                  />
                </div>
                <p className="text-muted-foreground mt-3 text-center text-xs">
                  Escanea con la cámara de tu teléfono
                </p>
              </motion.div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card text-muted-foreground px-2">o usa el código</span>
                </div>
              </div>

              {/* Link code */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="bg-muted/50 text-primary flex-1 rounded-lg border px-4 py-3 font-mono text-lg font-bold tracking-wider">
                    {linkCode}
                  </div>
                  <Button variant="outline" size="icon" onClick={handleCopy} className="shrink-0">
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
                <p className="text-muted-foreground text-xs">
                  Envía este código al bot{" "}
                  <span className="text-primary font-medium">@{botUsername}</span> en Telegram para
                  vincular tu cuenta.
                </p>
              </div>

              {/* Steps */}
              <div className="bg-accent/30 space-y-3 rounded-xl border p-4" data-tour="telegram-bot">
                <h4 className="text-sm font-semibold">Pasos:</h4>
                <ol className="text-muted-foreground space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="bg-primary/10 text-primary flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                      1
                    </span>
                    Escanea el QR o abre{" "}
                    <a
                      href={telegramDeepLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary inline-flex items-center gap-1 hover:underline"
                    >
                      el enlace
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-primary/10 text-primary flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                      2
                    </span>
                    Presiona &quot;Iniciar&quot; en el bot de Telegram
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-primary/10 text-primary flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                      3
                    </span>
                    ¡Listo! Envía texto o fotos al bot para crear brain dumps
                  </li>
                </ol>
              </div>

              {/* Direct link button */}
              <Button variant="outline" className="w-full" asChild>
                <a href={telegramDeepLink} target="_blank" rel="noopener noreferrer">
                  <Smartphone className="mr-2 h-4 w-4" />
                  Abrir en Telegram
                  <ExternalLink className="ml-2 h-3 w-3" />
                </a>
              </Button>

              {showRelink && (
                <Button
                  variant="ghost"
                  className="text-muted-foreground w-full"
                  size="sm"
                  onClick={() => setShowRelink(false)}
                >
                  ← Volver
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
