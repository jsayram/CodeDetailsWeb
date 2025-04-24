"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUp } from "lucide-react";

export const FooterSection = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative w-full bg-transparent mx-auto px-10">
     
      {/* Outer container: place items in a row */}
      <div className="flex flex-row ">
      <motion.button
        onClick={scrollToTop}
        className="hover:bg-primary/10 p-2 rounded-full transition-colors flex justify-center items-center absolute left-1/2 -translate-x-1/2 top-10 z-50 shadow-md hover:shadow-lg hover:scale-110"
        whileHover={{ y: -5 }}
        aria-label="Back to top"
      >
        <ArrowUp
          size={20}
          className="text-foreground hover:text-primary"
        />
      </motion.button>
        {/* Left side: newsletter and links */}
        <div className="flex-1 flex flex-col justify-center items-center pt-10 pb-10">
          <div className="container px-2 flex flex-col items-center">
            {/* Bottom bar */}
            <div className="mt-10 pt-6 flex flex-col items-center md:flex-row md:justify-between gap-4 w-full">
              <p className="text-center text-xs text-muted-foreground">
                &copy; {new Date().getFullYear()} Code Details. All rights
                reserved.
              </p>
              <div className="flex items-center gap-6">
                <Link
                  href="/terms"
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  Terms
                </Link>
                <Link
                  href="/privacy"
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  Privacy
                </Link>
                <Link
                  href="/cookies"
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  Cookies
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
