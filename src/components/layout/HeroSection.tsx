"use client";

import React, { useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";

// Authentication (Clerk)
import { SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import { CodeParticlesElement } from "../Elements/CodeParticlesElement";
import { TerminalWindowSection } from "./TerminalWindowSection";

export const HeroSection = () => {
  // State for typing animation completion check
  const animationRef = useRef(null);
  const { user } = useUser();
  const terminalClass = user
    ? "border-green-400 xl:w-[70%] xl:ml-40"
    : "border-red-500 xl:w-[70%] xl:ml-40";
  const welcomeTextClassName = user
    ? "pb-10 text-5xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-fuchsia-500 font-medium pt-[20%] sm:-mt-[15%] sm:pr-[40%] sm:text-4xl md:pr-[35%] md:text-5xl md:-ml-[8%] lg:md:-ml-[15%] lg:text-6xl xl:text-7xl xl:-mt-[20%]"
    : "pb-10 text-5xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-fuchsia-500 font-medium pt-[20%] sm:-mt-[15%] sm:pr-[40%] sm:text-4xl md:pr-[35%] md:text-5xl md:-ml-[8%] lg:md:-ml-[15%] lg:text-6xl xl:text-7xl xl:-mt-[20%]";

  return (
    <div className="flex items-center justify-center px-3">
      <div className="flex flex-col items-center justify-center mx-auto">
        {/* Background gradient circle animation pulse */}
        <div
          className="fixed h-[120%] w-[120%] inset-0 -left-[10%] -top-[10%]
             bg-gradient-to-br
             from-primary/20 to-secondary/20 
             rounded-full blur-2xl opacity-10 animate-pulse"
          style={{ animationDuration: "10s" }}
        />
        {/* particles background */}
        <div className="absolute inset-0 z-0">
          <CodeParticlesElement
            quantity="ultra"
            speed="fast"
            size="large"
            includeEmojis={true}
            includeKeywords={true}
            includeSymbols={true}
            syntaxHighlight="vscode"
            depth="layered"
            opacityRange={[0.01, 0.2]}
            lightModeOpacityRange={[0.01, 0.4]}
          />
        </div>
        {/* Mascot Image */}
        <div className=" inset-0 z-10 pointer-events-none">
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
            className="flex items-col"
          >
            <motion.div
              whileHover={{ y: -10, transition: { duration: 0.5 } }}
              className="relative flex items-center justify-center"
            >
              {/* Parent container with mask */}
              <div className="absolute z-10">
                {/* The actual image - responsive sizing but large on desktop */}
                <Image
                  className="transition-all duration-300 max-w-[200px] mt-[750px] ml-[50%] pt-20
                     sm:ml-[70%] sm:max-w-[250px] sm:pt-40
                     md:pt-80 md:ml-[75%] md:w-[350px] md:max-w-[300px]
                     lg:max-w-md lg:pt-100 lg:mr-10
                     xl:pt-80 xl:w-[600px]"
                  src="/images/mascot.png"
                  alt="Code Details Mascot"
                  width={1200}
                  height={1200}
                  priority
                  style={{
                    maskImage:
                      "linear-gradient(to bottom, black 0%, black 90%, transparent 100%)",
                    WebkitMaskImage:
                      "linear-gradient(to bottom, black 0%, black 90%, transparent 100%)",
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Header - "The magic is in the..." text section and you are signed in text after singed in */}
        <div className="flex flex-col items-center justify-center">
          <div
            className="text-5xl pt-4 sm:text-6xl md:text-7xl lg:text-8xl font-medium text-center "
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
                className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-400 p-2"
              >
                ...the magic is in the
              </motion.div>
            </SignedOut>
          </div>

          {/* Header - "You are Signed In!" text section */}
          <div
            className="text-5xl pt-4 sm:text-6xl md:text-7xl lg:text-8xl font-medium tracking-tight text-center   "
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
                // className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-400 p-2"
                className="p-2 bg-clip-text text-transparent bg-gradient-to-r
                 from-primary to-fuchsia-500"
              >
                The Journey Begins here!
              </motion.div>
            </SignedIn>
          </div>
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 0.7,
                delay: 0.3,
                ease: [0.25, 0.1, 0.25, 1.0],
              }}
            >
              <SignedOut>
                <h1
                  className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-medium text-center
                 bg-clip-text text-transparent bg-gradient-to-r
                 from-primary to-fuchsia-500"
                >
                  {"{ Details }"}
                </h1>
              </SignedOut>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Terminal Window Section */}
        <div
          className=" w-[100%] pb-[10%] pt-10
         xl:-ml-90 xl:w-[110%]"
        >
          <TerminalWindowSection
            width="w-full h-full min-h-[250px] md:min-w-[600px]"
            className={`border-1 ${terminalClass} text-medium shadow-x backdrop-blur-lg transform transition-all duration-300 `}
            showTrafficLights={true}
            showDatetime={true}
            authenticatedMessage="You are signed in"
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
                className: "text-xl font-medium cursor-text text-gray-400",
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

        {/* Bottom Section - Welcome Message */}
        <div
          className={`flex items-center justify-center
       ${welcomeTextClassName} `}
        >
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <SignedOut>
                <div className="flex flex-col items-center justify-center">
                  <p className="pr-5">{"Welcome"}</p>
                  <p className="bg-clip-text  bg-gradient-to-r from-primary  to-amber-400">
                    {user?.fullName || "Code Minion!"}
                    <span className="bg-clip-text bg-gradient-to-r from-primary to-amber-400">
                      ✨
                    </span>
                  </p>
                </div>
              </SignedOut>
              <SignedIn>
                <div className="flex flex-col items-center justify-center ">
                  <p>{"Welcome"}</p>
                  <p className="bg-clip-text bg-gradient-to-r from-primary to-violet-400">
                    {user?.fullName + "!" || "Code Minion!"}
                    <span className="bg-clip-text bg-gradient-to-r from-primary to-amber-400">
                      ✨
                    </span>
                  </p>
                </div>
              </SignedIn>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};
