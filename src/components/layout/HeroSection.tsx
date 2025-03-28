"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";

// Authentication (Clerk)
import { SignedIn, SignedOut, SignInButton, useUser } from "@clerk/nextjs";

// UI Components
import { Button } from "@/components/ui/button";

import { CodeParticlesElement } from "../Elements/CodeParticlesElement";
import { TextTypingEffectAnimation } from "@/animations/TextTypingEffectAnimation";
import { TerminalWindowSection } from "./TerminalWindowSection";

export const HeroSection = () => {
  // State for typing animation completion check
  const [typingComplete, setTypingComplete] = useState(false);
  const animationRef = useRef(null);
  const { user } = useUser();

  return (
    <section className="relative py-12 mb-15 md:py-16 lg:py-24 xl:py-32 bg-gradient-to-br from-background to-muted/13">
      {/* Subtle edge fades without shifting content */}
      <div
        className="absolute left-0 top-0 h-full w-[40%] pointer-events-none"
        style={{
          background:
            "linear-gradient(to right, var(--background), transparent)",
        }}
      />
      <div
        className="absolute right-0 top-0 h-full w-[40%] pointer-events-none"
        style={{
          background:
            "linear-gradient(to left, var(--background), transparent)",
        }}
      />

      <div className="px-4 mx-auto sm:px-6 lg:px-8">
        {/* Hero Grid Layout */}
        <div className="grid grid-cols-1 mx-auto lg:grid-cols-12 gap-x-6 gap-y-8 lg:max-w-none relative">
          {/* Center Column - Mascot Image - Now visible on all devices */}
          <div className="absolute inset-0 z-10 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.8,
                ease: "easeOut",
                delay: 0.3,
                type: "spring",
                stiffness: 100,
              }}
              className="relative h-full w-full flex items-center justify-center"
            >
              <div
                className="absolute h-[120%] w-[120%] inset-0 -top-[10%] -left-[10%] bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-2xl opacity-10 animate-pulse"
                style={{ animationDuration: "30s" }}
              />

              {/* Code particles in background - visible on all screens sizes*/}
              <div className="absolute inset-0 z-0 -m-50">
                <CodeParticlesElement
                  quantity="ultra"
                  speed="variable"
                  size="mixed"
                  includeEmojis={true}
                  includeKeywords={true}
                  includeSymbols={true}
                  syntaxHighlight="vscode"
                  depth="layered"
                  opacityRange={[0.01, 0.3]}
                />
              </div>

              <motion.div
                whileHover={{ y: -10, transition: { duration: 0.5 } }}
                className="relative"
              >
                {/* Parent container with mask */}
                <div className="relative mt-110">
                  {/* The actual image - responsive sizing but large on desktop */}
                  <Image
                    className="mx-auto drop-shadow-2xl transition-all duration-300 
                              w-[500px] 
                              ml-30 -mt-50
                              sm:-mt-80 sm:ml-70 sm:w-[500px] 
              
                              md:w-[650px] md:ml-85 md:-mt-40 md:mb-30 md:mr-120
                              
                              lg:ml-120 lg:w-[1000px] lg:mt-30 max-w-[100%] lg:mr-200
                              xl:-mt-20 xl:ml-120 xl:w-[80%]
                              "
                    src="/images/mascot.png"
                    alt="Code Details Mascot"
                    width={1200}
                    height={1200}
                    priority
                    style={{
                      maskImage:
                        "linear-gradient(to bottom, black 60%, rgba(0,0,0,0.8) 75%, rgba(0,0,0,0.5) 85%, rgba(0,0,0,0.2) 95%, transparent 100%)",
                      WebkitMaskImage:
                        "linear-gradient(to bottom, black 60%, rgba(0,0,0,0.8) 75%, rgba(0,0,0,0.5) 85%, rgba(0,0,0,0.2) 95%, transparent 100%)",
                    }}
                  />
                </div>
              </motion.div>
            </motion.div>
          </div>

          <div className="lg:col-span-6 relative flex flex-col">
            {/* Fixed container for typing animation - moved to top with proper spacing */}
            <div className="w-full h-[80px]">
              {/* Typing animation */}
              <div
                className="text-2xl sm:text-3xl lg:text-5xl font-black
                sm:-ml-20
               
                lg:ml-30 lg:-mr-100 lg:-mt-10
                 tracking-widest uppercase text-center bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-400"
                ref={animationRef}
              >
                <SignedOut>
                  <TextTypingEffectAnimation
                    text="...because the magic is in the"
                    speed={100}
                    onComplete={() => setTypingComplete(true)}
                    skipOnRerender={true}
                  />
                </SignedOut>
                <SignedIn>
                  <TextTypingEffectAnimation
                    text="You are signed in!"
                    speed={5}
                    onComplete={() => setTypingComplete(true)}
                    skipOnRerender={true}
                  />
                </SignedIn>
              </div>

              {/* Details text - now in normal flow, not absolute */}
              <AnimatePresence>
                {typingComplete && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="mt-1 ml-30
                    md:text-5xl md:ml-80
                    lg:ml-180 lg:-mr-200
                    xl:ml-200 xl:-mr-300"
                  >
                    <SignedOut>
                      <h1 className="text-4xl lg:text-7xl xl:text-7xl xl:-mt-10 xl:-ml-45 text-center lg:text-left bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-600 font-black">
                        {"{ Details }"}
                      </h1>
                    </SignedOut>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div
              className="w-full mb-20 mt-10 
                        sm:max-w-[400px] sm:ml-10
                         md:ml-20 md:max-w-[500px]
                        lg:ml-20 lg:min-w-[700px]
                        min-h-[200px]
                        xl:ml-50
                        shadow-xl rounded-lg overflow-hidden
                        backdrop-filter backdrop-blur-none"
            >
              <TerminalWindowSection
                width="w-full"
                showTrafficLights={true}
                showDatetime={true}
                authenticatedMessage="What do you want to do now?"
                unauthenticatedMessage="AUTHENTICATE TO CONTINUE"
                userInfo={
                  user
                    ? {
                        email: user.primaryEmailAddress?.emailAddress,
                        firstName: user.firstName,
                        lastName: user.lastName,
                      }
                    : undefined
                }
                links={[
                  { href: "/learn", label: "Learn" },
                  { href: "/implement", label: "Implement" },
                  { href: "/deploy", label: "Deploy" },
                ]}
              />
            </div>

            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <p
                  className="font-black
             -mt-10 ml-5 mr-35 text-2xl 
             sm:ml-20 sm:mr-10
             md:ml-20 md:mr-60
             lg:text-5xl lg:-mr-50
             xl:text-6xl 
             xl:ml-50 xl:-mr-50
             bg-clip-text text-transparent bg-gradient-to-r from-primary to-fuchsia-400
              backdrop-blur-[5px] bg-background/30 rounded-lg "
                >
                  <SignedOut>
                    Your one stop destination for all things code!
                  </SignedOut>
                  <SignedIn>
                    <div>
                      {"Welcome to Code Details, " +
                        (user?.fullName || "Code Minion") +
                        "."}
                    </div>
                    {"Let's get started! "}
                  </SignedIn>

                  <span className="text-3xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-orange-200">
                    {" "}
                    <SignedOut>✨</SignedOut>
                    <SignedIn>
                      <Link href="/dashboard">
                        <Button
                          className="button-primary flex items-center justify-center mt-10 ml-40"
                          size="lg"
                          color="primary"
                        >
                          Go To Projects
                        </Button>
                      </Link>
                    </SignedIn>
                  </span>
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
