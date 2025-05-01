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
    setLoadingPath(url);
    router.push(url);
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Administrator</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const hasActiveChild = item.items?.some(subItem => pathname.startsWith(subItem.url));
          const isActive = pathname === item.url || (hasActiveChild && pathname.startsWith(item.url));
          const isLoading = loadingPath === item.url;

          return (
            <Collapsible key={item.title} asChild defaultOpen={hasActiveChild}>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  tooltip={item.title} 
                  isActive={isActive}
                  size="lg"
                  className={cn(
                    "transition-colors cursor-default py-2.5 relative group",
                    hasActiveChild ? "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" : "",
                    isLoading ? "data-[loading=true]" : ""
                  )}
                >
                  <button onClick={() => handleNavigation(item.url)} className="w-full flex items-center">
                    <item.icon className="size-5" />
                    <span>{item.title}</span>
                    {isLoading && <SidebarLoaderSpinner />}
                  </button>
                </SidebarMenuButton>
                {item.items?.length ? (
                  <>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuAction 
                        className="data-[state=open]:rotate-90 transition-transform duration-200 cursor-pointer size-6 after:-inset-3"
                      >
                        <ChevronRight className="size-5" />
                        <span className="sr-only">Toggle</span>
                      </SidebarMenuAction>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => {
                          const isSubItemActive = pathname.startsWith(subItem.url);
                          const isSubItemLoading = loadingPath === subItem.url;

                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton 
                                asChild 
                                isActive={isSubItemActive} 
                                className={cn(
                                  "cursor-default py-2 relative group",
                                  isSubItemLoading ? "data-[loading=true]" : ""
                                )}
                                size="md"
                              >
                                <button 
                                  onClick={() => handleNavigation(subItem.url)}
                                  className="cursor-pointer w-full flex items-center"
                                >
                                  <span>{subItem.title}</span>
                                  {isSubItemLoading && <SidebarLoaderSpinner />}
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
