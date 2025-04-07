"use client";
import React from "react";
import { HeaderSection } from "@/components/layout/HeaderSection";
import { HeroSection } from "@/components/layout/HeroSection";
import { FooterSection } from "@/components/layout/FooterSection";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SignedIn } from "@clerk/nextjs";
import { CodeParticlesElement } from "@/components/Elements/CodeParticlesElement";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground theme-gradient-bg">
      <div className="absolute inset-0 z-11 pointer-events-none">
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
      <SidebarProvider>
        <SignedIn>
          <AppSidebar />
        </SignedIn>
        <SidebarInset>
          <HeaderSection
            showLogo={true}
            showDarkModeButton={true}
            showMobileMenu={false}
          />
          {/* Header stays full width to maintain connection with sidebar when signed in*/}
          <HeroSection />
          <FooterSection />
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
