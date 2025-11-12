import { ChevronRight, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState } from "react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarLoaderSpinner,
} from "@/components/ui/sidebar";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon: LucideIcon;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}) {
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
    <SidebarGroup>
      <SidebarGroupLabel>Administrator</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const hasActiveChild = item.items?.some((subItem) =>
            pathname.startsWith(subItem.url)
          );
          const isActive =
            pathname === item.url ||
            (hasActiveChild && pathname.startsWith(item.url));
          const isLoading = loadingPath === item.url;

          return (
            <Collapsible key={item.title} asChild defaultOpen={hasActiveChild}>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={isActive}
                  size="default"
                  className={cn(
                    "transition-colors cursor-pointer py-2.5 relative group hover:cursor-pointer",
                    hasActiveChild
                      ? "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      : ""
                  )}
                >
                  <button
                    onClick={() => handleNavigation(item.url)}
                    className={cn(
                      "w-full flex items-center cursor-pointer gap-2",
                      isLoading && "opacity-50"
                    )}
                    disabled={isLoading}
                  >
                    <item.icon className="size-5" />
                    <span>{item.title}</span>
                    {isLoading && (
                      <div className="ml-auto">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-sidebar-foreground/20 border-t-sidebar-foreground" />
                      </div>
                    )}
                  </button>
                </SidebarMenuButton>
                {item.items?.length ? (
                  <>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuAction className="data-[state=open]:rotate-90 transition-transform duration-200 cursor-pointer size-6 after:-inset-3">
                        <ChevronRight className="size-5" />
                        <span className="sr-only">Toggle</span>
                      </SidebarMenuAction>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => {
                          const isSubItemActive =
                            pathname === subItem.url ||
                            (pathname.startsWith(subItem.url) &&
                              !item.items?.some(
                                (other) =>
                                  other !== subItem &&
                                  pathname.startsWith(other.url)
                              ));
                          const isSubItemLoading = loadingPath === subItem.url;

                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={isSubItemActive}
                                className="cursor-pointer py-2 relative group"
                                size="md"
                              >
                                <button
                                  onClick={() => handleNavigation(subItem.url)}
                                  className="cursor-pointer w-full flex items-center justify-between"
                                  disabled={isSubItemLoading}
                                >
                                  <span>{subItem.title}</span>
                                  {isSubItemLoading && (
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-sidebar-foreground/20 border-t-sidebar-foreground" />
                                    </div>
                                  )}
                                </button>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </>
                ) : null}
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
