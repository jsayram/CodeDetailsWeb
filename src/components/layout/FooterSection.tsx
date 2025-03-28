import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

// Import icons
import { Github, ArrowUp } from "lucide-react";

export const FooterSection = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="border-t border-border/40 pt-10 pb-8 bg-gradient-to-b from-background to-muted/5">
      {/* Main container - Make it a flex container */}
      <div className="container px-2 flex flex-col items-center">
        {/* Newsletter Column - Already centered with items-center */}
        <div className="space-y-4 flex flex-col items-center max-w-md w-full">
          <h3 className="text-base font-semibold text-foreground">
            Stay Updated
          </h3>
          <p className="text-sm text-muted-foreground text-center">
            Subscribe to our newsletter for the latest updates and resources.
          </p>
          <form className="flex flex-row gap-2 w-full">
            {" "}
            {/* Removed flex-col, always keep row layout */}
            <input
              type="email"
              placeholder="Your email"
              className="bg-background border border-border/40 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary flex-1 min-w-0"
              /* Added flex-1 and min-w-0 to prevent overflow */
              required
            />
            <button
              type="submit"
              className="bg-primary hover:bg-primary/90 text-white rounded-md px-3 py-2 text-sm transition-colors whitespace-nowrap"
              /* Added whitespace-nowrap to prevent text wrapping */
            >
              Subscribe
            </button>
          </form>

          <div className="flex space-x-3 pt-2">
            <motion.a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="bg-card hover:bg-primary/10 border border-border/40 p-2 rounded-full transition-colors"
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
            >
              <Github
                size={18}
                className="text-foreground hover:text-primary"
              />
              <span className="sr-only">GitHub</span>
            </motion.a>
            {/* Other social links remain the same */}
          </div>
        </div>

        {/* Bottom Bar - Make it full width */}
        <div className="mt-10 pt-6 border-t border-border/40 flex flex-col items-center md:flex-row md:justify-between gap-4 w-full">
          <p className="text-center text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Code Details. All rights reserved.
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

          {/* Back to top button */}
          <motion.button
            onClick={scrollToTop}
            className="bg-card hover:bg-primary/10 border border-border/40 p-2 rounded-full transition-colors mt-4 md:mt-0"
            whileHover={{ y: -2 }}
            aria-label="Back to top"
          >
            <ArrowUp size={16} className="text-foreground hover:text-primary" />
          </motion.button>
        </div>
      </div>
    </footer>
  );
};
