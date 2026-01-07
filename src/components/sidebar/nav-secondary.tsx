import * as React from "react";
import { type LucideIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function NavSecondary({
  items,
  ...props
}: {
  items: {
    title: string;
    url: string;
    icon: LucideIcon;
  }[];
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const pathname = usePathname();
  const router = useRouter();
  const [loadingPath, setLoadingPath] = useState<string | null>(null);

  const handleNavigation = (url: string) => {
    // Don't navigate or show loading if we're already on this page
    if (pathname === url) {
      setLoadingPath(null);
      return;
    }
    setLoadingPath(url);
    router.push(url);
  };

  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive = pathname === item.url;
            const isLoading = loadingPath === item.url;

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  size="sm"
                  isActive={isActive}
                  className={cn(
                    "transition-colors cursor-pointer relative group",
                    isLoading ? "data-[loading=true]" : ""
                  )}
                >
                  <button
                    onClick={() => handleNavigation(item.url)}
                    className="w-full flex items-center cursor-pointer"
                    disabled={isLoading}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                    {isLoading && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-sidebar-foreground/20 border-t-sidebar-foreground" />
                      </div>
                    )}
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
