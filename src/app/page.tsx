"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { HeaderSection } from "@/components/layout/HeaderSection";
import { HeroSection } from "@/components/layout/HeroSection";
import { FooterSection } from "@/components/layout/FooterSection";
import { Button } from "@/components/ui/button";

// Keep your existing Home component
export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <div className="w-full max-w-7xl mx-auto">
        {/* Navigation */}
        <HeaderSection />
        <main className="flex-1">
          {/* Hero Section */}
          <HeroSection /> {/* Hero section Uncommented when ready */}
          
          {/* Fixed centered Temporary content */}
          <div className="flex flex-col items-center justify-center h-[calc(100vh-250px)] px-4 text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-600">
              Welcome to Code Details
            </h1>
            
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-md">
              Your one-stop solution for code details and development resources.
            </p>
            
            <div className="mt-10 relative group inline-block">
              <div className="absolute transition-all duration-1000 opacity-70 inset-0 
                 bg-gradient-to-r from-primary/40 to-secondary/40 
                 rounded-lg blur-lg filter 
                 group-hover:opacity-100 group-hover:duration-200
                 -z-10 -m-1"></div>
                 
              <Button 
                asChild
                size="lg"
                className="relative inline-flex items-center justify-center px-8 py-3 text-base font-semibold text-white transition-all duration-200 bg-primary border border-transparent rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-md"
              >
                <Link href="/dashboard">
                  Go to Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </main>
        {/* Footer Section*/}
        <FooterSection />
      </div>
    </div>
  );
}