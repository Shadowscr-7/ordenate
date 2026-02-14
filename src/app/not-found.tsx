// ============================================================
// 404 Not Found Page — Ordénate
// ============================================================
import Image from "next/image";
import Link from "next/link";

import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 text-center">
      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="bg-primary/5 absolute top-1/3 left-1/4 h-64 w-64 rounded-full blur-3xl" />
        <div className="absolute right-1/4 bottom-1/3 h-64 w-64 rounded-full bg-cyan-400/5 blur-3xl" />
      </div>

      <div className="relative z-10">
        <div className="animate-float mb-8">
          <Image
            src="/images/logo.png"
            alt="Ordénate"
            width={120}
            height={120}
            className="mx-auto h-24 w-24 opacity-30"
          />
        </div>

        <h1 className="animate-fade-in from-primary bg-gradient-to-r to-cyan-500 bg-clip-text text-7xl font-bold tracking-tight text-transparent sm:text-8xl">
          404
        </h1>

        <p className="animate-fade-in-up stagger-1 text-muted-foreground mt-4 text-lg">
          La página que buscas no existe.
        </p>

        <div className="animate-fade-in-up stagger-2 mt-8">
          <Button
            asChild
            className="group from-primary shadow-primary/25 bg-gradient-to-r to-cyan-500 text-white shadow-lg"
          >
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              Volver al inicio
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
