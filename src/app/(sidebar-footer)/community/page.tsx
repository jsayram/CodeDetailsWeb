"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  MessageCircle,
  Users,
  Code,
  Share2,
  ExternalLink,
  BookOpen,
  Monitor,
  Bot,
  Zap,
  BellRing,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CodeParticlesElement } from "@/components/Elements/CodeParticlesElement";
import { HeaderSectionNoSideBar } from "@/components/layout/HeaderSectionNoSideBar";

export default function CommunityPage() {
  return (
    <div className="container mx-auto py-8 px-4 md:py-12 md:px-6 relative min-h-screen">
      <HeaderSectionNoSideBar />
      {/* Background particles effect */}
      <div className="absolute inset-0 z-0 pointer-events-none">
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

      <div className="relative z-10">
        {/* Hero section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-fuchsia-500 mb-4">
            Code Details Community
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Connect with other developers, share ideas, and get help with your
            coding projects
          </p>
        </motion.div>

        {/* Main content container */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left sidebar with community links */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="lg:col-span-1 order-2 lg:order-1"
          >
            <div className="space-y-6">
              {/* Community Status Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Community Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Members
                      </span>
                      <Badge
                        variant="secondary"
                        className="bg-green-600/20 text-green-600 hover:bg-green-600/30"
                      >
                        1,240+ developers
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Active discussions
                      </span>
                      <Badge
                        variant="secondary"
                        className="bg-primary/20 text-primary hover:bg-primary/30"
                      >
                        5 topics
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Last activity
                      </span>
                      <span className="text-sm">Just now</span>
                    </div>
                  </div>

                  <Separator className="my-3" />

                  <Button variant="default" size="sm" className="w-full">
                    <ExternalLink size={14} className="mr-2" />
                    Join Community
                  </Button>
                </CardContent>
              </Card>

              {/* Community Channels */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-primary" />
                    Channels
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 p-0">
                  <Button
                    variant="ghost"
                    className="w-full justify-start rounded-none pl-6 font-normal h-10"
                  >
                    <MessageCircle
                      size={16}
                      className="mr-2 text-muted-foreground"
                    />
                    # general
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start rounded-none pl-6 font-normal h-10"
                  >
                    <Code size={16} className="mr-2 text-muted-foreground" />#
                    code-help
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start rounded-none pl-6 font-normal h-10 bg-primary/5"
                  >
                    <Share2 size={16} className="mr-2 text-primary" /># showcase
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start rounded-none pl-6 font-normal h-10"
                  >
                    <Monitor size={16} className="mr-2 text-muted-foreground" />
                    # resources
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start rounded-none pl-6 font-normal h-10"
                  >
                    <BookOpen
                      size={16}
                      className="mr-2 text-muted-foreground"
                    />
                    # tutorials
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start rounded-none pl-6 font-normal h-10"
                  >
                    <Bot size={16} className="mr-2 text-muted-foreground" />#
                    ai-chat
                  </Button>
                </CardContent>
              </Card>

              {/* Community Resources */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    Resources
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Community Guidelines</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ExternalLink size={14} />
                    </Button>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Code of Conduct</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ExternalLink size={14} />
                    </Button>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm">FAQ</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ExternalLink size={14} />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Events & Notifications */}
              <Card className="bg-gradient-to-br from-primary/5 to-secondary/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BellRing className="h-5 w-5 text-primary" />
                    Community Events
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <h4 className="font-medium">Next.js Workshop</h4>
                        <Badge variant="outline">April 18</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Learn how to build dynamic web apps with Next.js
                      </p>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <h4 className="font-medium">Code Review Session</h4>
                        <Badge variant="outline">April 22</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Get feedback on your projects from expert developers
                      </p>
                    </div>

                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full mt-2"
                    >
                      View All Events
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* Main content area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="lg:col-span-3 order-1 lg:order-2"
          >
            <Card className="overflow-hidden">
              <CardHeader className="pb-3 border-b bg-muted/40">
                <Tabs defaultValue="discussions" className="w-full">
                  <div className="flex justify-between items-center">
                    <TabsList>
                      <TabsTrigger value="discussions">Discussions</TabsTrigger>
                      <TabsTrigger value="questions">Q&A</TabsTrigger>
                      <TabsTrigger value="showcase">Showcase</TabsTrigger>
                    </TabsList>
                    <div className="hidden sm:flex items-center">
                      <Badge variant="outline" className="mr-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
                        Coming Soon
                      </Badge>
                      <Button variant="outline" size="sm">
                        Sign In
                      </Button>
                    </div>
                  </div>

                  <TabsContent value="discussions" className="mt-0 p-0">
                    <div className="flex items-center justify-center h-[500px] bg-muted/20">
                      <div className="text-center p-6">
                        <MessageCircle className="h-10 w-10 text-muted-foreground mb-4 mx-auto" />
                        <h3 className="text-lg font-medium mb-2">
                          Community Discussions
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          Join our forum discussions to share ideas, ask
                          questions, and connect with other developers.
                        </p>
                        <Button>Coming Soon</Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="questions" className="mt-0 p-0">
                    <div className="flex items-center justify-center h-[500px] bg-muted/20">
                      <div className="text-center p-6">
                        <Code className="h-10 w-10 text-muted-foreground mb-4 mx-auto" />
                        <h3 className="text-lg font-medium mb-2">
                          Q&A Section
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          Ask questions and get answers from our community of
                          developers and experts.
                        </p>
                        <Button>Coming Soon</Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="showcase" className="mt-0 p-0">
                    <div className="flex items-center justify-center h-[500px] bg-muted/20">
                      <div className="text-center p-6">
                        <Share2 className="h-10 w-10 text-muted-foreground mb-4 mx-auto" />
                        <h3 className="text-lg font-medium mb-2">
                          Project Showcase
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          Share your projects and get feedback from the
                          community.
                        </p>
                        <Button>Coming Soon</Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardHeader>
            </Card>

            {/* Mobile-only buttons for joining */}
            <div className="flex items-center justify-between mt-4 sm:hidden">
              <Button variant="outline" size="sm" className="w-full">
                Sign In
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="text-center mt-12"
        >
          <Card className="bg-gradient-to-r from-primary/10 to-fuchsia-500/10 border-0">
            <CardContent className="py-8">
              <h2 className="text-2xl font-semibold mb-4">
                Join Our Growing Developer Community
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto mb-6">
                Connect with like-minded developers, share your projects, get
                help with coding challenges, and stay up to date with the latest
                in tech.
              </p>
              <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
                <Button className="flex items-center" variant="default">
                  <Users className="mr-2 h-4 w-4" />
                  Join Community
                </Button>
                <Button className="flex items-center" variant="secondary">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Notify Me
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
