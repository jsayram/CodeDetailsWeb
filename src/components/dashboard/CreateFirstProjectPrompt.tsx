"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Code, Sparkles, Heart, Users, TrendingUp, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export function CreateFirstProjectPrompt() {
  const [isNavigating, setIsNavigating] = useState(false);

  return (
    <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-purple-500/5 to-primary/5 shadow-xl">
      <CardContent className="p-8 md:p-12">
        <div className="flex flex-col items-center text-center space-y-6">
          {/* Icon Section */}
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full"></div>
            <div className="relative bg-gradient-to-br from-primary to-purple-600 p-6 rounded-2xl shadow-lg">
              <Code className="h-12 w-12 text-white" />
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 text-transparent bg-clip-text">
              Ready to Share Your Work?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Your creative journey starts here! Share your first project with the community and inspire others.
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-4xl pt-4">
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-background/50 border border-primary/20">
              <Sparkles className="h-6 w-6 text-primary" />
              <p className="text-sm font-medium">Showcase Your Skills</p>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-background/50 border border-purple-500/20">
              <Heart className="h-6 w-6 text-purple-500" />
              <p className="text-sm font-medium">Get Appreciated</p>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-background/50 border border-pink-500/20">
              <Users className="h-6 w-6 text-pink-500" />
              <p className="text-sm font-medium">Connect with Devs</p>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-background/50 border border-cyan-500/20">
              <TrendingUp className="h-6 w-6 text-cyan-500" />
              <p className="text-sm font-medium">Build Your Portfolio</p>
            </div>
          </div>

          {/* CTA Button */}
          <Link href="/projects/new" className="cursor-pointer">
            <Button
              size="lg"
              className="text-lg px-8 py-6 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group"
              onClick={() => setIsNavigating(true)}
              disabled={isNavigating}
            >
              {isNavigating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Loading...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Create Your First Project
                  <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </Link>

          {/* Subtext */}
          <p className="text-sm text-muted-foreground italic">
            ✨ It only takes a few minutes to share your masterpiece!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
