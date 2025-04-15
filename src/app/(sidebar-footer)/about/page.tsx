"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CodeParticlesElement } from "@/components/Elements/CodeParticlesElement";
import { ExternalLink, Github, Linkedin, Mail } from "lucide-react";
import { HeaderSectionNoSideBar } from "@/components/layout/HeaderSectionNoSideBar";

export default function AboutPage() {
  return (
    <>
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

      <div className="container mx-auto py-8 px-4 md:py-12 md:px-6 relative min-h-screen">
        <HeaderSectionNoSideBar />
        {/* Background particles effect - Fixed positioning */}
        <div className="relative z-10">
          {/* Hero section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-fuchsia-500 mb-4">
              Developer, Creator, and Innovator
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Software engineer, builder, and lifelong learner with a passion
              for clean, scalable code and creative problem-solving.
            </p>
          </motion.div>

          {/* Main content grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {/* Profile card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="col-span-1"
            >
              <Card className="overflow-hidden">
                {/* Replaced image container with simpler implementation */}
                <div className="p-4 flex justify-center">
                  <Image
                    src="/images/mascot.png"
                    alt="Jose Ramirez"
                    width={300}
                    height={300}
                    className="rounded-lg"
                    priority
                  />
                </div>
                <CardContent className="pt-6">
                  <h2 className="text-2xl font-semibold mb-2">
                    Jose Ramirez-Villa
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    Software Test Engineer
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="secondary">Testing</Badge>
                    <Badge variant="secondary">Full Stack</Badge>
                    <Badge variant="secondary">Next.js</Badge>
                    <Badge variant="secondary">Supabase</Badge>
                    <Badge variant="secondary">C#</Badge>
                    <Badge variant="secondary">Python</Badge>
                    <Badge variant="secondary">Automation</Badge>
                    <Badge variant="secondary">AI</Badge>
                    <Badge variant="secondary">ML</Badge>
                  </div>

                  <div className="flex justify-center space-x-4">
                    <a
                      href="https://github.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Github size={20} />
                    </a>
                    <a
                      href="https://linkedin.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Linkedin size={20} />
                    </a>
                    <a
                      href="mailto:contact@example.com"
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Mail size={20} />
                    </a>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Main content area */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="col-span-1 md:col-span-2"
            >
              <Card className="h-full">
                <CardContent className="pt-6">
                  <h2 className="text-2xl font-semibold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-violet-400">
                    My Journey
                  </h2>

                  <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none mb-8 space-y-4">
                    <p>
                      I built{" "}
                      <span className="font-semibold">Code Details</span> as a
                      personal platform to document my projects, share insights
                      from my coding journey, and give back to the dev community
                      that helped shape me.
                    </p>

                    <p>
                      By day, I work as a Software Test Engineer, focusing on
                      building robust, compliant, and well tested systems for
                      medical device software. I&apos;ve developed a strong
                      foundation in testing frameworks, full stack development,
                      and automation, with experience in tools like Selenium,
                      Angular, Firebase, SQL, and most recently, Next.js and
                      Supabase.
                    </p>

                    <p>
                      <span className="font-semibold">Code Details</span> is
                      more than a portfolio it&apos;s a knowledge hub designed
                      to grow with me. It features real projects, tutorials, and
                      dev notes across various stacks, searchable by tags and
                      accessible by tier-based roles (Free, Pro, Diamond).
                      Whether you&apos;re a beginner looking for real examples
                      or an experienced dev hunting for advanced patterns,
                      you&apos; ll find something here.
                    </p>
                  </div>

                  <Separator className="my-8" />

                  <h2 className="text-2xl font-semibold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-violet-400">
                    The Vision
                  </h2>

                  <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none space-y-4">
                    <p>
                      This site is part of a broader vision: financial freedom
                      through creativity and code. I&apos;m building toward a
                      life where my projects speak for themselves and support
                      themselves. Along the way, I&apos;m documenting
                      everything, from tech stacks to personal insights, hoping
                      to inspire others to take ownership of their growth too.
                    </p>

                    <p>
                      When I&apos;m not deep in code, you&apos;ll probably find
                      me optimizing my lifestyle, experimenting with nutrition
                      and fitness, or reflecting on how self-improvement
                      intersects with engineering because to me, building
                      software and building character go hand in hand.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Skills section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            <h2 className="text-3xl font-semibold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-primary to-fuchsia-500">
              Skills & Experience
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {/* Technology Card */}
              <Card className="hover:shadow-md transition-all">
                <CardContent className="pt-6">
                  <h3 className="text-xl font-semibold mb-4">Technologies</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge>JavaScript</Badge>
                    <Badge>TypeScript</Badge>
                    <Badge>React</Badge>
                    <Badge>Next.js</Badge>
                    <Badge>Angular</Badge>
                    <Badge>Node.js</Badge>
                    <Badge>Selenium</Badge>
                    <Badge>SQL</Badge>
                    <Badge>Firebase</Badge>
                    <Badge>Supabase</Badge>
                    <Badge>Jest</Badge>
                    <Badge>TailwindCSS</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Projects Card */}
              <Card className="hover:shadow-md transition-all">
                <CardContent className="pt-6">
                  <h3 className="text-xl font-semibold mb-4">
                    Featured Projects
                  </h3>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <ExternalLink size={16} className="mr-2 text-primary" />
                      <span>Code Details Web Platform</span>
                    </li>
                    <li className="flex items-center">
                      <ExternalLink size={16} className="mr-2 text-primary" />
                      <span>Test Automation Framework</span>
                    </li>
                    <li className="flex items-center">
                      <ExternalLink size={16} className="mr-2 text-primary" />
                      <span>Medical Device Software Testing</span>
                    </li>
                    <li className="flex items-center">
                      <ExternalLink size={16} className="mr-2 text-primary" />
                      <span>Fitness Tracking API</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Education Card */}
              <Card className="hover:shadow-md transition-all">
                <CardContent className="pt-6">
                  <h3 className="text-xl font-semibold mb-4">
                    Education & Learning
                  </h3>
                  <ul className="space-y-2">
                    <li className="flex flex-col">
                      <span className="font-medium">Computer Science</span>
                      <span className="text-sm text-muted-foreground">
                        University Focus
                      </span>
                    </li>
                    <li className="flex flex-col">
                      <span className="font-medium">Web Development</span>
                      <span className="text-sm text-muted-foreground">
                        Self-taught & Online Courses
                      </span>
                    </li>
                    <li className="flex flex-col">
                      <span className="font-medium">Software Testing</span>
                      <span className="text-sm text-muted-foreground">
                        Professional Certification
                      </span>
                    </li>
                    <li className="flex flex-col">
                      <span className="font-medium">Continuous Learning</span>
                      <span className="text-sm text-muted-foreground">
                        Always exploring new tech
                      </span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* Final CTA section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="text-center mt-12"
          >
            <Card className="bg-gradient-to-r from-primary/10 to-violet-500/10 border-0">
              <CardContent className="py-12">
                <h2 className="text-3xl font-semibold mb-4">
                  Let&apos;s Connect
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
                  Whether you&apos;re interested in collaboration, have
                  questions about my projects, or just want to chat about code
                  and technology, I&apos;d love to hear from you.
                </p>
                <div className="flex justify-center space-x-4">
                  <a
                    href="mailto:contact@example.com"
                    className="inline-flex items-center px-6 py-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <Mail size={18} className="mr-2" /> Get In Touch
                  </a>
                  <a
                    href="/projects"
                    className="inline-flex items-center px-6 py-3 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-colors"
                  >
                    <ExternalLink size={18} className="mr-2" /> View Projects
                  </a>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  );
}
