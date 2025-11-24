"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import {
  SignedIn,
  SignedOut,

} from "@clerk/nextjs";
import { SignInButtonComponent } from "@/components/auth/SignInButtonComponent";

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
        <h1 className="text-8xl 3xl:text-9xl 4xl:text-[12rem] font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary mb-20">
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
              ...you are so lost aren&apos;t you.
            </p>
            <div className="absolute -bottom-2 right-8 w-4 h-4 bg-card border-r border-b border-border transform rotate-45" />
          </div>
        </motion.div>

        {/* Error message */}
        <h2 className="text-2xl 3xl:text-3xl 4xl:text-4xl font-semibold text-foreground mb-4">
          Page Not Found
        </h2>
        <p className="text-muted-foreground mb-8 max-w-lg mx-auto text-2xl 3xl:text-3xl 4xl:text-4xl">
        You&apos;ve reached a non-existent page.<br/> While the URL failed you, your life choices simply... led you here.<br/>Coincidence? Perhaps...<br/> Irony? Definitely!<br/> <span className="text-6xl">🤭</span>
        </p>

        {/* Home button */}
        <SignedIn>
          <Link href="/" className="cursor-pointer">
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90
                     transition-all duration-300 hover:scale-105"
            >
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </SignedIn>
        <SignedOut>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90
                     transition-all duration-300 hover:scale-105"
          >
            <SignInButtonComponent text="Sign In" />
          </Button>
        </SignedOut>
      </div>
    </div>
  );
}
