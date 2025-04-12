"use client";

import { usePathname } from "next/navigation";
import React, { useMemo } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// Define the breadcrumb item interface
export interface BreadcrumbItemData {
  label: string;
  href?: string;
  isCurrentPage?: boolean;
}

interface DynamicBreadcrumbsProps {
  items?: BreadcrumbItemData[]; // Optional override for auto-generated breadcrumbs
  showOnMobile?: boolean; // Control visibility on mobile screens
  className?: string; // Additional styling
}

/**
 * A component that displays breadcrumbs based on the current path or custom items.
 */
export function DynamicBreadcrumbs({
  items,
  showOnMobile = false,
  className = "",
}: DynamicBreadcrumbsProps) {
  const pathname = usePathname();

  // Generate breadcrumbs based on the current path
  const breadcrumbs = useMemo(() => {
    // Define common routes with friendly names inside useMemo
    const routeNames: Record<string, string> = {
      dashboard: "Dashboard",
      projects: "Projects",
      settings: "Settings",
      profile: "Profile",
      billing: "Billing",
      help: "Help",
      about: "About",
      // Add more route mappings as needed
    };

    // Use provided items if available
    if (items && items.length > 0) {
      return items;
    }

    // Generate breadcrumbs from the current path
    const segments = pathname.split("/").filter(Boolean);

    // Always start with Home
    const result: BreadcrumbItemData[] = [{ label: "Home", href: "/" }];

    // Add path segments as breadcrumbs
    let currentPath = "";
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === segments.length - 1;

      // Get friendly name for the segment or capitalize the segment
      const label =
        routeNames[segment] ||
        segment.charAt(0).toUpperCase() + segment.slice(1);

      result.push({
        label,
        href: isLast ? undefined : currentPath,
        isCurrentPage: isLast,
      });
    });

    return result;
  }, [pathname, items]);

  // If we're on the home page and using auto-generated breadcrumbs, show only "Home"
  if (pathname === "/" && !items) {
    return (
      <Breadcrumb className={className}>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Home</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {breadcrumbs.map((item, index) => (
          <React.Fragment key={index}>
            {index > 0 && (
              <BreadcrumbSeparator
                className={!showOnMobile ? "hidden md:block" : ""}
              />
            )}
            <BreadcrumbItem
              className={
                !showOnMobile && index < breadcrumbs.length - 1
                  ? "hidden md:block"
                  : ""
              }
            >
              {item.isCurrentPage ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={item.href || "#"}>
                  {item.label}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
