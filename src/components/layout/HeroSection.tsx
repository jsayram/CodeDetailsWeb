"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";

// Authentication (Clerk)
import { SignedIn, SignedOut, useUser } from "@clerk/nextjs";

// UI Components
import { Button } from "@/components/ui/button";

import { CodeParticlesElement } from "../Elements/CodeParticlesElement";
import { TerminalWindowSection } from "./TerminalWindowSection";

export const HeroSection = () => {
  // State for typing animation completion check
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
                              sm:-mt-90 sm:ml-40 sm:w-[570px] 
              
                              md:w-[700px] md:ml-50 md:-mt-15 md:mr-120
                              
                              lg:ml-60 lg:w-[1000px] lg:mt-30 max-w-[100%] lg:mr-200
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

          <div className="p-1 lg:col-span-6 relative flex flex-col">
            {/* Fixed container for typing animation - moved to top with proper spacing */}

            {/* Typing animation */}

            <div className="w-full h-[80px]">
              <div
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-medium tracking-tight
                    sm:-ml-20
                    lg:ml-70 lg:-mr-100 lg:-mt-10
                    text-center lg:text-left"
                ref={animationRef}
              >
                <SignedOut>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.7,
                      ease: [0.25, 0.1, 0.25, 1.0],
                    }}
                    className="lg:p-2 md:ml-10  lg:-ml-40   lg: xl:ml-30 bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-400"
                  >
                    ...because the magic is in the
                  </motion.div>
                </SignedOut>
              </div>
              <div
                className="text-5xl pb-2 mb-1 text-center
                sm:text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight
                    
                    lg:ml-60 lg:-mr-160 lg:-mt-10
                    "
                ref={animationRef}
              >
                <SignedIn>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.7,
                      ease: [0.25, 0.1, 0.25, 1.0],
                    }}
                    className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-400 p-2"
                  >
                    You are Signed In!
                  </motion.div>
                </SignedIn>
              </div>

              {/* Keep the { Details } text animation */}
              <AnimatePresence>
                {/* Auto-trigger the Details text without waiting for typing completion */}
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: 0.7,
                    delay: 0.3,
                    ease: [0.25, 0.1, 0.25, 1.0],
                  }}
                  className="mt-1 ml-30
                      md:text-5xl md:ml-80
                      lg:ml-180 lg:-mr-200
                      xl:ml-200 xl:-mr-300"
                >
                  <SignedOut>
                    <h1 className="text-3xl md:text-6xl lg:-ml-150 xl:-ml-200 lg:mt-10 xl:text-7xl xl:mt-10 text-center bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-600 font-black">
                      {"{ Details }"}
                    </h1>
                  </SignedOut>
                </motion.div>
              </AnimatePresence>
            </div>

            <div
              className="p-1 w-full mb-20 mt-10 
                        sm:max-w-[630px] sm:ml-10
                        md:max-w-dvh 
                        lg:ml-20 lg:max-w-[900px] lg:min-w-[800px] lg:-mr-30
                        min-h-[300px] pb-20
                        xl:ml-50
                        shadow-xl rounded-lg overflow-hidden
                        backdrop-filter backdrop-blur-none"
            >
              <TerminalWindowSection
                width="w-full h-full"
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
                  // System information commands (non-clickable)
                  {
                    href: "#",
                    label: "git push -f origin main:prod # friday 5pm",
                    clickable: false,
                    className: "text-xl font-medium cursor-text text-gray-400",
                    visibleOn: ["mobile", "md", "lg", "xl", "2xl"],
                  },
                  {
                    href: "#",
                    label: "git commit -m 'Fix bugs that never existed'",
                    clickable: false,
                    className: "text-xl font-medium cursor-text text-gray-400",
                    visibleOn: ["sm", "lg", "xl", "2xl"],
                  },
                  {
                    href: "#",
                    label: "docker run --rm -d my-responsibilities",
                    clickable: false,
                    className: "text-xl font-medium cursor-text text-gray-400",
                    visibleOn: ["lg", "xl", "2xl"],
                  },
                  {
                    href: "#",
                    label: "npm i --s caffeine patience stackoverflow",
                    clickable: false,
                    visibleOn: ["lg", "xl", "2xl"],
                    className: "text-xl font-medium cursor-text",
                  },

                  // Learn section - CLICKABLE
                  {
                    href: "/learn",
                    label: "Learn",
                    clickable: true,
                    visibleOn: "all", // Default if not specified
                  },
                  // Implement section - CLICKABLE
                  {
                    href: "/implement",
                    label: "Implement",
                    clickable: true,
                    visibleOn: "all", // Default if not specified
                  },
                  // Deploy section - CLICKABLE
                  {
                    href: "/deploy",
                    label: "Deploy",
                    clickable: true,
                    visibleOn: "all", // Default if not specified
                  },
                ]}
              />
            </div>

            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <div
                  className="p-1 font-black text-center
                  w-[50%] xl:w-[80%]
                  -mt-35 ml-4 mr-35 text-2xl 
                  sm:ml-10 sm:mr-10 sm:-mt-15
                  sm:font-medium lg:w-[90%] 
                  md:ml-15 md:mr-20 md:-mt-20 md:text-5xl
                  lg:text-6xl lg:-mr-40
                  xl:text-6xl 
                  xl:ml-50 xl:-mr-50
                  bg-clip-text text-transparent bg-gradient-to-r from-primary to-fuchsia-400
                    backdrop-blur-[5px] bg-background/30 rounded-lg "
                >
                  <SignedOut>
                    <p>{"Welcome"}</p>
                    <p className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-violet-400">
                      {user?.fullName || "Code Minion!"}
                    </p>
                    <p>
                      {"Let's get started!"}
                      <span className="text-3xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-amber-300">
                        {" "}
                        ✨
                      </span>
                    </p>
                  </SignedOut>
                  <SignedIn>
                    <div className="flex flex-col items-center :-pt-30">
                      <p>{"Welcome"}</p>
                      <p className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-violet-400">
                        {user?.fullName + "!" || "Code Minion!"}
                      </p>
                    </div>
                  </SignedIn>

                  <div className="flex justify-center mt-5">
                    <SignedIn>
                      <Link href="/dashboard">
                        <Button
                          className="button-primary flex items-center justify-center"
                          size="lg"
                          color="primary"
                        >
                          Go To Projects
                        </Button>
                      </Link>
                    </SignedIn>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
