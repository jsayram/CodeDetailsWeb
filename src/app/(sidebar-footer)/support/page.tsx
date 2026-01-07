"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Github,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  MessageCircle,
  BookOpen,
  Code,
  Terminal,
  LifeBuoy,
  FileQuestion,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { HeaderSectionNoSideBar } from "@/components/layout/HeaderSectionNoSideBar";

// FAQ Item Component
const FAQItem = ({
  question,
  answer,
}: {
  question: string;
  answer: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-border rounded-lg mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-between items-center w-full p-4 text-left hover:bg-muted/50 transition-colors rounded-lg cursor-pointer"
        aria-expanded={isOpen}
        aria-controls={`faq-answer-${question
          .replace(/\s+/g, "-")
          .toLowerCase()}`}
      >
        <span className="font-medium">{question}</span>
        {isOpen ? (
          <ChevronUp size={20} aria-hidden="true" />
        ) : (
          <ChevronDown size={20} aria-hidden="true" />
        )}
      </button>

      {isOpen && (
        <div
          id={`faq-answer-${question.replace(/\s+/g, "-").toLowerCase()}`}
          className="p-4 pt-0 border-t"
        >
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {answer}
          </div>
        </div>
      )}
    </div>
  );
};

export default function SupportPage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="container mx-auto py-8 px-4 md:py-12 md:px-6 relative min-h-screen">
      <HeaderSectionNoSideBar />
      <div className="relative z-10">
        {/* Hero section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-fuchsia-500 mb-4">
            Help & Support
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get the resources and assistance you need to make the most of Code
            Details
          </p>
        </motion.div>

        {/* Search & Quick Help */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="max-w-3xl mx-auto mb-12"
        >
          <Card>
            <CardContent className="pt-6">
              <div className="relative mb-6">
                <HelpCircle className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors duration-200" />
                <Input
                  placeholder="Search for help topics..."
                  className="pl-12 h-12 text-base rounded-xl border-2 border-primary/20 hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-md transition-all duration-200"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                <Button
                  variant="outline"
                  className="flex flex-col items-center h-auto gap-2 p-4 cursor-pointer"
                >
                  <BookOpen size={24} className="text-primary" />
                  <span>Docs</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex flex-col items-center h-auto gap-2 p-4 cursor-pointer"
                >
                  <Code size={24} className="text-primary" />
                  <span>Guides</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex flex-col items-center h-auto gap-2 p-4 cursor-pointer"
                >
                  <MessageCircle size={24} className="text-primary" />
                  <span>Community</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex flex-col items-center h-auto gap-2 p-4 cursor-pointer"
                >
                  <Terminal size={24} className="text-primary" />
                  <span>CLI</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* FAQ Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="lg:col-span-2 order-2 lg:order-1"
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <FileQuestion className="h-6 w-6 text-primary" />
                    Frequently Asked Questions
                  </CardTitle>
                  <Badge variant="outline" className="ml-2">
                    Top Questions
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <FAQItem
                  question="How do I access the premium content?"
                  answer={
                    <>
                      <p>
                        Premium content is available to Pro and Diamond tier
                        subscribers. To access:
                      </p>
                      <ol>
                        <li>Sign in to your account</li>
                        <li>
                          Navigate to the project or content you want to access
                        </li>
                        <li>
                          If you have the appropriate tier, you&apos;ll have
                          immediate access
                        </li>
                        <li>If not, you&apos;ll see upgrade options</li>
                      </ol>
                      <p>
                        You can upgrade your subscription at any time from the
                        account settings.
                      </p>
                    </>
                  }
                />

                <FAQItem
                  question="How can I contribute to Code Details?"
                  answer={
                    <>
                      <p>
                        We welcome contributions from the community! Here&apos;s
                        how you can contribute:
                      </p>
                      <ul>
                        <li>Submit a PR to our GitHub repository</li>
                        <li>Share feedback on existing projects</li>
                        <li>Report bugs or issues using the feedback form</li>
                        <li>Suggest new features or content</li>
                      </ul>
                      <p>
                        For code contributions, please review our contribution
                        guidelines before submitting.
                      </p>
                    </>
                  }
                />

                <FAQItem
                  question="What technologies does Code Details focus on?"
                  answer={
                    <>
                      <p>
                        Code Details covers a wide range of web development
                        technologies, including but not limited to:
                      </p>
                      <ul>
                        <li>React and Next.js</li>
                        <li>Angular and related frameworks</li>
                        <li>Node.js and backend technologies</li>
                        <li>
                          Database solutions (SQL, NoSQL, Supabase, Firebase)
                        </li>
                        <li>Testing frameworks and methodologies</li>
                        <li>DevOps and deployment strategies</li>
                      </ul>
                      <p>
                        We&apos;re continuously expanding our content based on
                        community interests and emerging technologies.
                      </p>
                    </>
                  }
                />

                <FAQItem
                  question="How do I report a bug or issue?"
                  answer={
                    <>
                      <p>To report a bug or technical issue:</p>
                      <ol>
                        <li>
                          Use the &quot;Report Issue&quot; button in the
                          navigation
                        </li>
                        <li>Provide a detailed description of the problem</li>
                        <li>Include steps to reproduce if possible</li>
                        <li>Add screenshots or error messages if available</li>
                      </ol>
                      <p>
                        For critical issues, you can also reach out directly via
                        our support email.
                      </p>
                    </>
                  }
                />

                <FAQItem
                  question="Can I download source code from projects?"
                  answer={
                    <>
                      <p>
                        Yes, source code download is available based on your
                        subscription tier:
                      </p>
                      <ul>
                        <li>
                          <strong>Free tier:</strong> Limited access to select
                          project source code
                        </li>
                        <li>
                          <strong>Pro tier:</strong> Access to most project
                          source code
                        </li>
                        <li>
                          <strong>Diamond tier:</strong> Full access to all
                          project source code and additional resources
                        </li>
                      </ul>
                      <p>
                        Look for the download button on project pages to access
                        available source code.
                      </p>
                    </>
                  }
                />

                <FAQItem
                  question="How often is new content added?"
                  answer={
                    <>
                      <p>
                        We&apos;re committed to regularly adding new content:
                      </p>
                      <ul>
                        <li>Major projects: 1-2 per month</li>
                        <li>Tutorials and guides: Weekly</li>
                        <li>Code snippets and tips: Several times per week</li>
                      </ul>
                      <p>
                        Subscribe to our newsletter or follow us on social media
                        to stay updated on new content releases.
                      </p>
                    </>
                  }
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Contact & Resources Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="order-1 lg:order-2"
          >
            <div className="space-y-8">
              {/* Contact Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <LifeBuoy className="h-5 w-5 text-primary" />
                    Contact Support
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Email Support</h3>
                      <p className="text-sm text-muted-foreground">
                        <a
                          href="mailto:support@codedetails.dev"
                          className="hover:text-primary cursor-pointer"
                        >
                          support@codedetails.dev
                        </a>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <MessageCircle className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Discord Community</h3>
                      <p className="text-sm text-muted-foreground">
                        <a
                          href="https://discord.com/channels/1108053195957211237/1108053196720582707"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary cursor-pointer"
                        >
                          Join our community
                        </a>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Github className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">GitHub Issues</h3>
                      <p className="text-sm text-muted-foreground">
                        <a
                          href="https://github.com/codedetails"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary cursor-pointer"
                        >
                          Report bugs or issues
                        </a>
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="pt-2">
                    <Button className="w-full cursor-pointer" variant="default">
                      Submit Support Ticket
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Resources Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Resources
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="font-medium">Documentation</span>
                    <Button variant="ghost" size="sm" className="cursor-pointer">
                      <ExternalLink size={16} />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="font-medium">API Reference</span>
                    <Button variant="ghost" size="sm" className="cursor-pointer">
                      <ExternalLink size={16} />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="font-medium">Getting Started</span>
                    <Button variant="ghost" size="sm" className="cursor-pointer">
                      <ExternalLink size={16} />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="font-medium">Tutorials</span>
                    <Button variant="ghost" size="sm" className="cursor-pointer">
                      <ExternalLink size={16} />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between pb-2">
                    <span className="font-medium">Code Samples</span>
                    <Button variant="ghost" size="sm" className="cursor-pointer">
                      <ExternalLink size={16} />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Subscription Status Card */}
              <Card className="bg-gradient-to-br from-primary/5 to-secondary/5">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-lg mb-2">Current Plan</h3>
                  <div className="flex items-center mb-4">
                    <Badge className="bg-blue-600">Pro</Badge>
                    <span className="text-sm text-muted-foreground ml-2">
                      Active
                    </span>
                  </div>
                  <p className="text-sm mb-4">
                    Need help with your subscription or account settings?
                  </p>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start cursor-pointer"
                    >
                      <ExternalLink size={16} className="mr-2" />
                      Account Settings
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start cursor-pointer"
                    >
                      <ExternalLink size={16} className="mr-2" />
                      Billing History
                    </Button>
                  </div>
                </CardContent>
              </Card>
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
            <CardContent className="py-10">
              <h2 className="text-2xl font-semibold mb-4">
                Didn&apos;t find what you were looking for?
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto mb-6">
                Our team is ready to help you with any questions or issues you
                might have. Let&apos;s solve your problems together!
              </p>
              <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
                <Button className="flex items-center cursor-pointer" variant="default">
                  <Mail className="mr-2 h-4 w-4" />
                  Contact Support
                </Button>
                <Button className="flex items-center cursor-pointer" variant="secondary">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Join Community
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
