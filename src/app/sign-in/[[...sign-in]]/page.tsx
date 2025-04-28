"use client";
import { SignIn } from "@clerk/nextjs";
import { HeaderSectionNoSideBar } from "@/components/layout/HeaderSectionNoSideBar";
import { FooterSection } from "@/components/layout/FooterSection";
import { TerminalWindowSection } from "@/components/layout/TerminalWindowSection";
import Image from "next/image";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <HeaderSectionNoSideBar 
        showSignInButton={false}
      />
      <main className="flex-grow flex items-center justify-center relative">
        <div className="w-[90%] max-w-5xl flex flex-col items-center gap-8">
          {/* Mascot and Terminal Section */}
          <div className="relative w-full">
            <TerminalWindowSection
              width="w-full h-full min-h-[250px] md:min-w-[600px]"
              className="border-1 border-primary text-medium shadow-x backdrop-blur-lg transform transition-all duration-300"
              showTrafficLights={true}
              showDatetime={true}
              unauthenticatedMessage="Welcome to Code Details! Please sign in to continue..."
            />
            {/* Mascot positioned absolutely relative to terminal */}
            <div className="absolute -right-4 top-1/2 transform -translate-y-1/2 hidden md:block">
              <Image
                src="/images/mascot.png"
                alt="Code Details Mascot"
                width={200}
                height={200}
                priority
                className="transform scale-x-100"
              />
              <div className="absolute top-1/2 right-[210px] text-4xl transform -rotate-[-45deg]">
                👈
              </div>
            </div>
          </div>
          
          {/* Sign In Form */}
          {/* <div className="z-10 bg-background/80 p-6 rounded-lg backdrop-blur">
            <SignIn />
          </div> */}
        </div>
      </main>
      <FooterSection />
    </div>
  );
}