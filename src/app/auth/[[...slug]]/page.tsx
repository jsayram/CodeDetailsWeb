"use client";
import { SignUp, SignOutButton, SignedIn } from "@clerk/nextjs";
import { FooterSection } from "@/components/layout/FooterSection";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import React from "react";
import { Button } from "@/components/ui/button";
import { HeaderSectionNoSideBar } from "@/components/layout/HeaderSectionNoSideBar";
import { motion } from "framer-motion";
import Image from "next/image";
import { CodeParticlesElement } from "@/components/Elements/CodeParticlesElement";
import { TerminalWindowSection } from "@/components/layout/TerminalWindowSection";

export default function AuthPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const resolvedParams = React.use(params);
  const page = resolvedParams.slug?.[0];
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  // Prevent endless loop by redirecting authenticated users
  useEffect(() => {
    if (isLoaded && isSignedIn && page !== "sign-out") {
      router.push("/");
    }

    // Redirect away from sign-out route if not signed in
    if (isLoaded && !isSignedIn && page === "sign-out") {
      router.push("/auth");
    }
  }, [isLoaded, isSignedIn, router, page]);

  // Don't render sign-in/sign-up if already logged in
  if (isLoaded && isSignedIn && page !== "sign-out") {
    return null; // Will redirect via useEffect
  }

  // Don't render sign-out if not logged in
  if (isLoaded && !isSignedIn && page === "sign-out") {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground theme-gradient-bg">
      <HeaderSectionNoSideBar showMobileMenu={false} showSignInButton={false} />{" "}
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <CodeParticlesElement
            quantity="ultra"
            speed="variable"
            size="large"
            includeEmojis={true}
            includeKeywords={true}
            includeSymbols={true}
            syntaxHighlight="vscode"
            depth="layered"
            opacityRange={[0.01, 0.8]}
            lightModeOpacityRange={[0.01, 1]}
          />
          {renderAuthComponent(page)}
        </div>
      </div>
      <FooterSection />
    </div>
  );
}

function renderAuthComponent(page?: string) {
  switch (page) {
    case "sign-up":
      return (
        <>
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-bold tracking-tight">
              Sign up for an account
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Create your account to get started
            </p>
          </div>
          <SignUp />
        </>
      );
    case "sign-out":
      return (
        <div className="text-center z-100">
          <h2 className="mt-6 text-3xl font-bold tracking-tight mb-6">
            Sign out of your account
          </h2>
          <SignedIn>
            <SignOutButton redirectUrl="/">
              <Button
                size="sm"
                className="hover:scale-105 transition-transform"
              >
                Sign out
              </Button>
            </SignOutButton>
          </SignedIn>
        </div>
      );
    default:
      return (
        <>
          <div className="relative flex flex-col items-center justify-center">
            <div className="mb-10 relative flex justify-center">
              <div className="flex items-center justify-center">
                <div className="text-9xl transform -rotate-45 absolute left-60 -bottom-5 z-20">
                  👆
                </div>
                <TerminalWindowSection
                  width="w-full h-full min-h-[250px] md:min-w-[600px]"
                  className={`border-1text-medium shadow-x backdrop-blur-lg transform transition-all duration-300 `}
                  showTrafficLights={true}
                  showDatetime={true}
                  unauthenticatedMessage="Hey Code Minion, sign in to access that content!"
                />
              </div>
            </div>

            {/* Centered Mascot Image */}
            <div className="w-full flex justify-center pointer-events-none">
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
              >
                <motion.div
                  whileHover={{ y: -10, transition: { duration: 0.5 } }}
                  className="flex justify-center"
                >
                  {/* Parent container with mask */}
                  <div className="relative">
                    {/* The actual image - responsive sizing and centered */}
                    <Image
                      className="transition-all duration-300 w-[250px] mx-auto
                       sm:w-[280px] 
                       md:w-[320px]
                       lg:w-[350px]"
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
          </div>
        </>
      );
  }
}
