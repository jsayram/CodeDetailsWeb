"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Github,
  ExternalLink,
  FileText,
  Video,
  Figma,
  BookOpen,
  Presentation,
  Newspaper,
  Link as LinkIcon,
} from "lucide-react";
import { ProjectLink, LinkType, getLinkDisplayLabel } from "@/types/project-links";

interface ProjectLinksDisplayProps {
  links: ProjectLink[];
  className?: string;
}

// Icon mapping for link types
const ICON_MAP: Record<LinkType, React.ComponentType<{ className?: string }>> = {
  repository: Github,
  demo: ExternalLink,
  documentation: FileText,
  video: Video,
  figma: Figma,
  notion: BookOpen,
  slides: Presentation,
  article: Newspaper,
  custom: LinkIcon,
};

export function ProjectLinksDisplay({
  links,
  className = "",
}: ProjectLinksDisplayProps) {
  if (!links || links.length === 0) {
    return null;
  }

  // Get icon for link type
  const getLinkIcon = (type: LinkType, className = "h-4 w-4") => {
    const Icon = ICON_MAP[type] || LinkIcon;
    return <Icon className={className} />;
  };

  // Get button variant based on link type
  const getButtonVariant = (type: LinkType): "default" | "outline" | "secondary" => {
    switch (type) {
      case "demo":
        return "default";
      case "repository":
        return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LinkIcon className="h-5 w-5" />
          Quick Links
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {links.map((link, index) => (
            <Button
              key={index}
              variant={getButtonVariant(link.type)}
              size="default"
              asChild
            >
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-pointer"
              >
                {getLinkIcon(link.type, "h-4 w-4 mr-2")}
                {getLinkDisplayLabel(link)}
              </a>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
