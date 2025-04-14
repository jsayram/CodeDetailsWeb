"use client";

import React from "react";
import { HeaderSection } from "@/components/layout/HeaderSection";
import { FooterSection } from "@/components/layout/FooterSection";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SignedIn, useUser } from "@clerk/nextjs";
import { SidebarLoadingState } from "@/components/LoadingState/SidebarLoadingState";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowRight,
  BarChart3,
  Code,
  FileText,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { isLoaded } = useUser();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SidebarProvider>
        <SignedIn>
          {!isLoaded ? <SidebarLoadingState /> : <AppSidebar />}
        </SignedIn>
        <SidebarInset>
          <HeaderSection
            showLogo={false}
            showDarkModeButton={true}
            showMobileMenu={false}
          />

          <main className="container mx-auto px-4 py-8">
            {/* Dashboard Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground mt-2">
                Welcome to your project dashboard. Here&apos;s an overview of
                your current status.
              </p>
            </div>

            {/* Stats Cards Row */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <StatsCard
                title="Total Projects"
                value="12"
                description="4 active projects"
                icon={<Code className="h-4 w-4 text-primary" />}
              />
              <StatsCard
                title="Team Members"
                value="8"
                description="3 pending invitations"
                icon={<Users className="h-4 w-4 text-primary" />}
              />
              <StatsCard
                title="Code Reviews"
                value="24"
                description="7 awaiting review"
                icon={<FileText className="h-4 w-4 text-primary" />}
              />
              <StatsCard
                title="Security Checks"
                value="98%"
                description="All tests passing"
                icon={<ShieldCheck className="h-4 w-4 text-primary" />}
              />
            </div>

            {/* Main Content Cards */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Activity Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Recent Activity
                  </CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <ActivityItem
                      title="Project React Portfolio updated"
                      description="New commit pushed by John Smith"
                      timestamp="2 hours ago"
                    />
                    <ActivityItem
                      title="Code review completed"
                      description="TypeScript API pull request #42 approved"
                      timestamp="Yesterday"
                    />
                    <ActivityItem
                      title="New team member added"
                      description="Sarah Johnson joined E-Commerce project"
                      timestamp="2 days ago"
                    />
                    <ActivityItem
                      title="Security alert resolved"
                      description="Dependency vulnerability patched"
                      timestamp="3 days ago"
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full flex items-center justify-center"
                  >
                    View all activity
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>

              {/* Projects Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Projects
                  </CardTitle>
                  <Code className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <ProjectItem
                      title="React Portfolio"
                      description="Personal showcase website"
                      progress={80}
                    />
                    <ProjectItem
                      title="TypeScript API"
                      description="RESTful service for data processing"
                      progress={65}
                    />
                    <ProjectItem
                      title="E-Commerce Backend"
                      description="Server-side logic for online store"
                      progress={45}
                    />
                    <ProjectItem
                      title="Mobile App"
                      description="Cross-platform application"
                      progress={30}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full flex items-center justify-center"
                  >
                    View all projects
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </main>

          <FooterSection />
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}

// Type definitions for the component props
interface StatsCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}

interface ActivityItemProps {
  title: string;
  description: string;
  timestamp: string;
}

interface ProjectItemProps {
  title: string;
  description: string;
  progress: number;
}

// Simple stats card component
function StatsCard({ title, value, description, icon }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

// Activity item component
function ActivityItem({ title, description, timestamp }: ActivityItemProps) {
  return (
    <div className="flex flex-col space-y-1">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{timestamp}</p>
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

// Project item with progress bar
function ProjectItem({ title, description, progress }: ProjectItemProps) {
  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{progress}%</p>
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
      <div className="h-2 w-full bg-secondary/30 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
