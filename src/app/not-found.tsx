"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, Sparkles, Code2, Terminal, Bug, Coffee } from "lucide-react";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { SignInButtonComponent } from "@/components/auth/SignInButtonComponent";
import { useState, useEffect } from "react";

// Floating code symbols for background decoration
const floatingItems = [
  { icon: Code2, delay: 0 },
  { icon: Terminal, delay: 0.5 },
  { icon: Bug, delay: 1 },
  { icon: Coffee, delay: 1.5 },
  { icon: Sparkles, delay: 2 },
];

// Fun messages the mascot can say
const mascotMessages = [
  "...you are so lost aren't you.",
  "Error 404: Humor not found... just kidding! 😄",
  "I've been waiting here for someone to find me!",
  "Plot twist: the page was inside you all along.",
  "Have you tried turning it off and on again?",
  "This page went on vacation. No forwarding address.",
  "404: Page playing hide and seek. It's winning.",
];

export default function NotFound() {
  const [messageIndex, setMessageIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  // Cycle through messages when mascot is clicked
  const handleMascotClick = () => {
    setMessageIndex((prev) => (prev + 1) % mascotMessages.length);
    setClickCount((prev) => prev + 1);

    // Easter egg: show confetti after 5 clicks
    if (clickCount >= 4) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
      setClickCount(0);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6 overflow-hidden">
      {/* Animated background gradient */}
      <motion.div
        className="fixed h-[120%] w-[120%] inset-0 -left-[10%] -top-[10%]
                   bg-gradient-to-br from-primary/20 via-secondary/10 to-primary/20 
                   rounded-full blur-3xl opacity-20"
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Floating background icons */}
      {floatingItems.map((item, index) => (
        <motion.div
          key={index}
          className="fixed text-muted-foreground/20 pointer-events-none"
          style={{
            left: `${15 + index * 18}%`,
            top: `${10 + (index % 3) * 30}%`,
          }}
          animate={{
            y: [0, -30, 0],
            rotate: [0, 10, -10, 0],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 4 + index,
            repeat: Infinity,
            delay: item.delay,
            ease: "easeInOut",
          }}
        >
          <item.icon className="w-12 h-12 md:w-16 md:h-16" />
        </motion.div>
      ))}

      {/* Confetti effect (Easter egg) */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {Array.from({ length: 50 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                backgroundColor: ["#ff6b6b", "#4ecdc4", "#ffe66d", "#95e1d3", "#f38181"][
                  i % 5
                ],
              }}
              initial={{ top: "-5%", rotate: 0 }}
              animate={{
                top: "105%",
                rotate: Math.random() * 720,
                x: (Math.random() - 0.5) * 200,
              }}
              transition={{
                duration: 2 + Math.random(),
                ease: "easeIn",
              }}
            />
          ))}
        </div>
      )}

      <div className="relative z-10 text-center">
        {/* Animated 404 Text */}
        <motion.h1
          className="text-8xl 3xl:text-9xl 4xl:text-[12rem] font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-primary mb-12 cursor-default select-none"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          whileHover={{ scale: 1.05 }}
          style={{
            backgroundSize: "200% 100%",
          }}
        >
          <motion.span
            animate={{
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "linear",
            }}
            className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-primary"
            style={{ backgroundSize: "200% 100%" }}
          >
            404
          </motion.span>
        </motion.h1>

        {/* Interactive Mascot */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.8,
            ease: "easeOut",
            delay: 0.2,
          }}
          className="relative mx-auto w-[200px] sm:w-[250px] mb-8 cursor-pointer"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          onClick={handleMascotClick}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Mascot glow effect on hover */}
          <motion.div
            className="absolute inset-0 bg-primary/20 rounded-full blur-3xl"
            animate={{
              opacity: isHovering ? 0.6 : 0,
              scale: isHovering ? 1.2 : 1,
            }}
            transition={{ duration: 0.3 }}
          />

          {/* Bouncing mascot */}
          <motion.div
            animate={{
              y: isHovering ? [0, -10, 0] : [0, -5, 0],
            }}
            transition={{
              duration: isHovering ? 0.5 : 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Image
              src="/images/mascot.png"
              alt="Code Details Mascot"
              width={300}
              height={300}
              priority
              className="transform -scale-x-100 drop-shadow-2xl"
            />
          </motion.div>

          {/* Animated speech bubble */}
          <motion.div
            className="absolute -top-20 -right-4 sm:right-0 bg-card p-4 rounded-xl shadow-xl border border-border max-w-[200px]"
            initial={{ opacity: 0, scale: 0, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
            key={messageIndex}
          >
            <motion.p
              className="text-sm font-medium text-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {mascotMessages[messageIndex]}
            </motion.p>
            <div className="absolute -bottom-2 right-8 w-4 h-4 bg-card border-r border-b border-border transform rotate-45" />
            
            {/* Click hint */}
            <motion.span
              className="absolute -bottom-6 right-0 text-xs text-muted-foreground"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Click me!
            </motion.span>
          </motion.div>
        </motion.div>

        {/* Error message with staggered animation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-2xl 3xl:text-3xl 4xl:text-4xl font-semibold text-foreground mb-4">
            Page Not Found
          </h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto text-lg 3xl:text-xl 4xl:text-2xl leading-relaxed">
            Oops! This page seems to have wandered off into the digital void.
            <br />
            <motion.span
              className="inline-block text-4xl mt-2"
              animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1 }}
            >
              🤭
            </motion.span>
          </p>
        </motion.div>

        {/* Animated buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <SignedIn>
            <Link href="/" className="cursor-pointer">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90
                           transition-all duration-300 shadow-lg hover:shadow-primary/25"
                >
                  <Home className="mr-2 h-5 w-5" />
                  Back to Home
                </Button>
              </motion.div>
            </Link>
          </SignedIn>
          <SignedOut>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90
                         transition-all duration-300 shadow-lg hover:shadow-primary/25"
              >
                <SignInButtonComponent text="Sign In" />
              </Button>
            </motion.div>
          </SignedOut>
        </motion.div>

        {/* Fun fact footer */}
        <motion.p
          className="mt-12 text-xs text-muted-foreground/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          Fun fact: The HTTP 404 error was named after a room at CERN where the original web servers were located.
          <br />
          <span className="italic">(Actually, that&apos;s a myth, but it&apos;s a fun one!)</span>
        </motion.p>
      </div>
    </div>
  );
}
