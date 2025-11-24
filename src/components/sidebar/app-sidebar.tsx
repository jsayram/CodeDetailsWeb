"use client";
import * as React from "react";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignOutButton,
} from "@clerk/nextjs";
import {
  Code,
  Database,
  FileCode,
  LifeBuoy,
  LogIn,
  Map,
  PieChart,
  Smartphone,
  BrainCircuit,
  SquareTerminal,
  BookOpen,
  Bot,
  Send,
  Folder,
  Search,
} from "lucide-react";

import { NavMain } from "@/components/sidebar/nav-main";
import { NavProjects } from "@/components/sidebar/nav-projects";
import { NavSecondary } from "@/components/sidebar/nav-secondary";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Logo } from "../CodeDetailsLogoComponent";
import { API_ROUTES } from "../../constants/api-routes";
import { SignInButtonComponent } from "../auth/SignInButtonComponent";
import { is } from "drizzle-orm";

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: PieChart,
      isActive: true,
    },
    {
      title: "Search",
      url: "/search",
      icon: Search,
      items: [
        {
          title: "Categories",
          url: "/categories",
        },
        {
          title: "Tags",
          url: "/tags",
        },
        {
          title: "Users",
          url: "/users",
        },
      ],
    },
    {
      title: "Projects",
      url: "/projects",
      icon: Folder,
      items: [
        {
          title: "Community Projects",
          url: "/projects",
        },
        {
          title: "My Projects Portfolio",
          url: "/projects/projects-portfolio",
        },
        {
          title: "My Favorites",
          url: "/projects/favorites",
        },
        {
          title: "My Deleted",
          url: "/projects/deleted",
        },
      ],
    },
    // ====================================================================
    // COMMENTED OUT: Future Features - Pages not yet implemented
    // ====================================================================
    // {
    //   title: "Documentation",
    //   url: "/docs",
    //   icon: BookOpen,
    //   items: [
    //     {
    //       title: "API Reference",
    //       url: "/docs/api",
    //     },
    //     {
    //       title: "Guides",
    //       url: "/docs/guides",
    //     },
    //     {
    //       title: "Examples",
    //       url: "/docs/examples",
    //     },
    //   ],
    // },
    // {
    //   title: "AI Assistant",
    //   url: "/ai",
    //   icon: Bot,
    //   items: [
    //     {
    //       title: "Code Generation",
    //       url: "/ai/generate",
    //     },
    //     {
    //       title: "Refactoring",
    //       url: "/ai/refactor",
    //     },
    //     {
    //       title: "Explanations",
    //       url: "/ai/explain",
    //     },
    //     {
    //       title: "History",
    //       url: "/ai/history",
    //     },
    //   ],
    // },
    // {
    //   title: "Collaboration",
    //   url: "/collaborate",
    //   icon: Send,
    //   items: [
    //     {
    //       title: "Team Projects",
    //       url: "/collaborate/teams",
    //     },
    //     {
    //       title: "Shared Code",
    //       url: "/collaborate/shared",
    //     },
    //     {
    //       title: "Pull Requests",
    //       url: "/collaborate/pull-requests",
    //     },
    //     {
    //       title: "Comments",
    //       url: "/collaborate/comments",
    //     },
    //   ],
    // },
  ],
  navSecondary: [
    {
      title: "About Developer",
      url: "/about",
      icon: BrainCircuit,
    },
    {
      title: "Help & Support",
      url: "/support",
      icon: LifeBuoy,
    },
    {
      title: "Developer Community",
      url: "/community",
      icon: Map,
    },
  ],
  // ====================================================================
  // COMMENTED OUT: Sample Projects - Not actual project routes
  // These are placeholder projects, not real pages. Remove or replace with dynamic user projects.
  // ====================================================================
  // projects: [
  //   {
  //     title: "React Portfolio",
  //     name: "React Portfolio",
  //     owner: "Personal",
  //     lastUpdated: "Today",
  //     isNew: true,
  //     url: "/projects/react-portfolio",
  //     icon: Code,
  //   },
  //   {
  //     title: "TypeScript API",
  //     name: "TypeScript API",
  //     owner: "Work Team",
  //     lastUpdated: "Yesterday",
  //     url: "/projects/typescript-api",
  //     icon: FileCode,
  //   },
  //   {
  //     title: "E-Commerce Backend",
  //     name: "E-Commerce Backend",
  //     owner: "Client Project",
  //     lastUpdated: "2 days ago",
  //     url: "/projects/ecommerce-backend",
  //     icon: Database,
  //   },
  //   {
  //     title: "Mobile App",
  //     name: "Mobile App",
  //     owner: "Collaboration",
  //     lastUpdated: "Last week",
  //     url: "/projects/mobile-app",
  //     icon: Smartphone,
  //   },
  // ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="sm" asChild>
                <div className="flex items-center justify-center w-full h-15 mt-1 rounded-lg">
                  <Logo
                    size="md"
                    showTagline={false}
                    taglineSize="xs"
                    className="flex items-center justify-center mt-4 mb-4"
                  />
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <NavMain items={data.navMain} />
          {/* COMMENTED OUT: NavProjects - Sample projects not linked to real pages */}
          {/* <NavProjects projects={data.projects} /> */}
          <NavSecondary items={data.navSecondary} className="mt-auto" />
        </SidebarContent>
        <SidebarFooter>
          <SignedIn>
            {/* <NavUser user={userData} /> */}
            <SignOutButton>
              <Button
                size="sm"
                className="hover:scale-105 transition-transform cursor-pointer"
              >
                Sign out
              </Button>
            </SignOutButton>
          </SignedIn>
          <SignedOut>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" asChild>
                  <SignInButtonComponent
                    text="Sign In"
                    useTypingEffect={false}
                    variant="plain"
                  />
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SignedOut>
        </SidebarFooter>
      </Sidebar>
  );
}
