"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      {/* Background gradient effect */}
      <div
        className="fixed h-[120%] w-[120%] inset-0 -left-[10%] -top-[10%]
                 bg-gradient-to-br
                 from-primary/20 to-secondary/20 
                 rounded-full blur-2xl opacity-10 animate-pulse"
        style={{ animationDuration: "10s" }}
      />

      <div className="relative z-10 text-center">
        {/* 404 Text */}
        <h1 className="text-8xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary mb-20">
          404
        </h1>

        {/* Mascot Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.8,
            ease: "easeOut",
            delay: 0.2,
          }}
          className="relative mx-auto w-[200px] sm:w-[250px] mb-8"
        >
          <Image
            src="/images/mascot.png"
            alt="Code Details Mascot"
            width={300}
            height={300}
            priority
            className="transform -scale-x-100" // Flip the mascot horizontally
          />
          {/* Speech bubble */}
          <div className="absolute -top-16 right-0 bg-card p-4 rounded-lg shadow-lg border border-border">
            <p className="text-sm font-medium text-foreground">
            ... your life choices led you here.
            </p>
            <div className="absolute -bottom-2 right-8 w-4 h-4 bg-card border-r border-b border-border transform rotate-45" />
          </div>
        </motion.div>

        {/* Error message */}
        <h2 className="text-2xl font-semibold text-foreground mb-4">
          Page Not Found
        </h2>
        <p className="text-muted-foreground mb-8 max-w-lg mx-auto text-2xl">
        This page doesn&apos;t
        exist, and frankly, neither do your life choices that led you here. 🥴
        </p>

        {/* Home button */}
        <Link href="/">
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90
                     transition-all duration-300 hover:scale-105"
          >
            <Home className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
