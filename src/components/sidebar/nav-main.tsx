import { ChevronRight, Home, FileText, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useDocChapters } from "@/providers/doc-chapters-provider";

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
  const { chapters, currentChapter, projectMeta, isDocPage } = useDocChapters();

  const handleNavigation = (url: string) => {
    // Don't navigate or show loading if we're already on this page
    if (pathname === url) {
      setLoadingPath(null);
      return;
    }
    setLoadingPath(url);
    router.push(url);
  };

  // Build dynamic items for GitHub Scrapper when on doc page
  const getItemsWithChapters = (item: typeof items[0]) => {
    if (item.title === "GitHub Scrapper" && isDocPage && chapters.length > 0 && projectMeta) {
      return [
        ...(item.items || []),
        // Separator-like entry
        { title: `── ${projectMeta.projectName} ──`, url: '#divider', isDivider: true },
        // Dynamic chapter items
        ...chapters.map((chapter) => ({
          title: chapter.order === -1 ? `📋 ${chapter.title}` : `${chapter.order}. ${chapter.title}`,
          url: chapter.filename === '-1_overview.md' 
            ? `/github-scrapper/docs/${projectMeta.projectSlug}`
            : `/github-scrapper/docs/${projectMeta.projectSlug}/${chapter.filename}`,
          isChapter: true,
          isCurrentChapter: chapter.filename === currentChapter,
        })),
      ];
    }
    return item.items;
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Administrator</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const dynamicItems = getItemsWithChapters(item);
          const hasActiveChild = dynamicItems?.some((subItem) =>
            pathname.startsWith(subItem.url) && subItem.url !== '#divider'
          );
          // Also check if we're on a doc page for GitHub Scrapper
          const isOnDocPage = item.title === "GitHub Scrapper" && pathname.startsWith('/github-scrapper/docs');
          const isActive =
            pathname === item.url ||
            (hasActiveChild && pathname.startsWith(item.url)) ||
            isOnDocPage;
          const isLoading = loadingPath === item.url;

          return (
            <Collapsible key={item.title} asChild defaultOpen={hasActiveChild || isOnDocPage}>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={isActive}
                  size="default"
                  className={cn(
                    "transition-colors cursor-pointer py-2.5 relative group hover:cursor-pointer",
                    hasActiveChild || isOnDocPage
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
                {dynamicItems?.length ? (
                  <>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuAction className="data-[state=open]:rotate-90 transition-transform duration-200 cursor-pointer size-6 after:-inset-3">
                        <ChevronRight className="size-5" />
                        <span className="sr-only">Toggle</span>
                      </SidebarMenuAction>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {dynamicItems?.map((subItem: any) => {
                          // Handle divider items
                          if (subItem.isDivider) {
                            return (
                              <SidebarMenuSubItem key={subItem.title}>
                                <div className="px-2 py-2 text-xs font-semibold text-muted-foreground/70 truncate">
                                  {subItem.title}
                                </div>
                              </SidebarMenuSubItem>
                            );
                          }
                          
                          const isSubItemActive = subItem.isChapter 
                            ? subItem.isCurrentChapter
                            : pathname === subItem.url ||
                              (pathname.startsWith(subItem.url) &&
                                !dynamicItems?.some(
                                  (other: any) =>
                                    other !== subItem &&
                                    !other.isDivider &&
                                    pathname.startsWith(other.url)
                                ));
                          const isSubItemLoading = loadingPath === subItem.url;

                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={isSubItemActive}
                                className={cn(
                                  "cursor-pointer py-2 relative group",
                                  subItem.isChapter && "text-xs"
                                )}
                                size="md"
                              >
                                <button
                                  onClick={() => handleNavigation(subItem.url)}
                                  className="cursor-pointer w-full flex items-center justify-between"
                                  disabled={isSubItemLoading}
                                >
                                  <span className="truncate">{subItem.title}</span>
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
