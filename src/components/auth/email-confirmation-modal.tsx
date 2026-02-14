// ============================================================
// Email Confirmation Modal — Post-signup confirmation
// ============================================================

"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

import { AnimatePresence, motion } from "framer-motion";
import { Mail, Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";

interface EmailConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  email: string;
}

export function EmailConfirmationModal({ open, onClose, email }: EmailConfirmationModalProps) {
  const router = useRouter();

  const handleClose = () => {
    onClose();
    router.push("/login");
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-card shadow-primary/20 relative w-full max-w-md overflow-hidden rounded-2xl border shadow-2xl">
              {/* Close button */}
              <button
                onClick={handleClose}
                className="text-muted-foreground hover:bg-accent hover:text-foreground absolute top-4 right-4 z-10 rounded-full p-1 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Top gradient bar */}
              <div className="from-primary to-primary h-1.5 w-full bg-gradient-to-r via-cyan-400" />

              {/* Content */}
              <div className="flex flex-col items-center px-8 pt-10 pb-8 text-center">
                {/* Animated icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 15,
                    delay: 0.1,
                  }}
                  className="relative mb-6"
                >
                  <div className="from-primary/20 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br to-cyan-400/20">
                    <Mail className="text-primary h-10 w-10" />
                  </div>
                  {/* Sparkle decorations */}
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -top-1 -right-1"
                  >
                    <Sparkles className="h-5 w-5 text-amber-400" />
                  </motion.div>
                  <motion.div
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.3, 0.8, 0.3],
                    }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                    className="absolute -bottom-1 -left-2"
                  >
                    <Sparkles className="text-primary h-4 w-4" />
                  </motion.div>
                </motion.div>

                {/* Logo */}
                <Image
                  src="/images/logo.png"
                  alt="Ordénate"
                  width={120}
                  height={40}
                  className="mb-4"
                />

                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mb-2 text-2xl font-bold tracking-tight"
                >
                  ¡Revisa tu correo!
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-muted-foreground mb-2"
                >
                  Hemos enviado un enlace de confirmación a:
                </motion.p>

                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="bg-primary/10 text-primary mb-6 rounded-lg px-4 py-2 font-medium"
                >
                  {email}
                </motion.p>

                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-muted-foreground mb-8 text-sm"
                >
                  Haz clic en el enlace del correo para activar tu cuenta y comenzar a organizar tus
                  ideas.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="w-full"
                >
                  <Button onClick={handleClose} className="w-full" size="lg">
                    Entendido
                  </Button>
                </motion.div>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-muted-foreground mt-4 text-xs"
                >
                  ¿No lo encuentras? Revisa tu carpeta de spam.
                </motion.p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
