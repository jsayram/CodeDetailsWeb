"use client";
import React from "react";
import { HeaderSection } from "@/components/layout/HeaderSection";
import { HeroSection } from "@/components/layout/HeroSection";
import { FooterSection } from "@/components/layout/FooterSection";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground theme-gradient-bg">
      <div className="w-full max-w-fit mx-auto">
        {/* Navigation */}
        <HeaderSection />
        <main className="flex-1">
          {/* Hero Section */}
          <HeroSection />
        </main>
        <FooterSection />
      </div>
    </div>
  );
}