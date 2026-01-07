"use client";

import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  X,
  RefreshCcw,
  Github,
  ExternalLink,
  FileText,
  Video,
  Figma,
  BookOpen,
  Presentation,
  Newspaper,
  Link as LinkIcon,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import {
  ProjectLink,
  LinkType,
  LINK_TYPES,
  LINK_TYPE_METADATA,
} from "@/types/project-links";
import { PROJECT_LINK_LIMITS } from "@/constants/project-limits";
import { validateUrlFormat, checkUrlReachability } from "@/lib/url-validation";
import { toast } from "sonner";

interface ProjectLinksManagerProps {
  initialLinks: ProjectLink[];
  onChange: (links: ProjectLink[]) => void;
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

export function ProjectLinksManager({
  initialLinks,
  onChange,
  className = "",
}: ProjectLinksManagerProps) {
  const [links, setLinks] = useState<ProjectLink[]>(initialLinks);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyingIndex, setVerifyingIndex] = useState<number | null>(null);
  const [emptyUrlIndices, setEmptyUrlIndices] = useState<Set<number>>(new Set());
  const [invalidUrlIndices, setInvalidUrlIndices] = useState<Set<number>>(new Set());
  const [urlSuggestions, setUrlSuggestions] = useState<Map<number, string>>(new Map());

  // Sync internal state with initialLinks prop changes
  React.useEffect(() => {
    setLinks(initialLinks);
  }, [initialLinks]);

  // Expose method to highlight empty and invalid URLs (called from parent)
  React.useEffect(() => {
    const checkUrlIssues = () => {
      const emptyIndices = new Set<number>();
      const invalidIndices = new Set<number>();
      const suggestions = new Map<number, string>();
      
      links.forEach((link, index) => {
        if (!link.url || link.url.trim() === '') {
          emptyIndices.add(index);
        } else {
          const formatResult = validateUrlFormat(link.url);
          if (!formatResult.valid) {
            invalidIndices.add(index);
            // Store suggestion if available
            if (formatResult.suggestedFix) {
              suggestions.set(index, formatResult.suggestedFix);
            }
          }
        }
      });
      
      if (emptyIndices.size > 0 || invalidIndices.size > 0) {
        setEmptyUrlIndices(emptyIndices);
        setInvalidUrlIndices(invalidIndices);
        setUrlSuggestions(suggestions);
        // Clear highlighting after 5 seconds
        setTimeout(() => {
          setEmptyUrlIndices(new Set());
          setInvalidUrlIndices(new Set());
        }, 5000);
      }
    };
    
    // Listen for validation trigger from parent
    const handleValidationError = () => checkUrlIssues();
    window.addEventListener('highlight-empty-links', handleValidationError);
    window.addEventListener('highlight-invalid-links', handleValidationError);
    return () => {
      window.removeEventListener('highlight-empty-links', handleValidationError);
      window.removeEventListener('highlight-invalid-links', handleValidationError);
    };
  }, [links]);

  // Add new link
  const handleAddLink = useCallback(() => {
    if (links.length >= PROJECT_LINK_LIMITS.MAX_URL_LINKS) {
      toast.error(`Maximum ${PROJECT_LINK_LIMITS.MAX_URL_LINKS} links allowed`);
      return;
    }

    const newLink: ProjectLink = {
      type: "repository",
      url: "https://",
    };

    const updatedLinks = [...links, newLink];
    setLinks(updatedLinks);
    onChange(updatedLinks);
  }, [links, onChange]);

  // Remove link
  const handleRemoveLink = useCallback(
    (index: number) => {
      const updatedLinks = links.filter((_, i) => i !== index);
      setLinks(updatedLinks);
      onChange(updatedLinks);
    },
    [links, onChange]
  );

  // Update link field
  const handleUpdateLink = useCallback(
    (index: number, field: keyof ProjectLink, value: string) => {
      const updatedLinks = [...links];
      
      // Auto-prepend https:// if user starts typing without protocol
      if (field === 'url') {
        let processedValue = value;
        
        // If user clears to empty or just whitespace, allow it
        if (value.trim() === '') {
          processedValue = '';
        }
        // If user is typing and doesn't have a protocol, prepend https://
        else if (value.length > 0 && !value.startsWith('http://') && !value.startsWith('https://')) {
          // Don't prepend if they're still typing the protocol itself
          if (!value.startsWith('http') && !value.startsWith('htt') && !value.startsWith('ht') && !value.startsWith('h')) {
            processedValue = `https://${value}`;
          }
        }
        
        updatedLinks[index] = {
          ...updatedLinks[index],
          url: processedValue,
        };
        
        // Clear verification status when URL changes
        delete updatedLinks[index].reachable;
        delete updatedLinks[index].statusCode;
        delete updatedLinks[index].lastChecked;
        
        // Clear any validation highlighting
        setInvalidUrlIndices(prev => {
          const newSet = new Set(prev);
          newSet.delete(index);
          return newSet;
        });
        setUrlSuggestions(prev => {
          const newMap = new Map(prev);
          newMap.delete(index);
          return newMap;
        });
      } else {
        updatedLinks[index] = {
          ...updatedLinks[index],
          [field]: value,
        };
      }

      setLinks(updatedLinks);
      onChange(updatedLinks);
    },
    [links, onChange]
  );

  // Verify single link - marks as reachable/unreachable
  const handleVerifyLink = useCallback(
    async (index: number, isAutoVerify: boolean = false) => {
      const link = links[index];
      if (!link.url) return;

      // Validate format first
      const formatResult = validateUrlFormat(link.url);
      if (!formatResult.valid) {
        // Mark as invalid so it shows red highlighting
        const updatedLinks = [...links];
        updatedLinks[index] = {
          ...updatedLinks[index],
          reachable: false,
          statusCode: 400,
          lastChecked: new Date().toISOString(),
        };
        setLinks(updatedLinks);
        onChange(updatedLinks);
        
        // Store suggestion if available
        if (formatResult.suggestedFix) {
          setUrlSuggestions(prev => new Map(prev).set(index, formatResult.suggestedFix!));
        }
        if (!isAutoVerify) {
          toast.error(formatResult.error || "Invalid URL format");
        }
        return;
      }

      // Clear any suggestion since format is valid
      setUrlSuggestions(prev => {
        const newMap = new Map(prev);
        newMap.delete(index);
        return newMap;
      });

      setVerifyingIndex(index);

      try {
        const result = await checkUrlReachability(link.url);

        const updatedLinks = [...links];
        updatedLinks[index] = {
          ...updatedLinks[index],
          reachable: result.reachable,
          statusCode: result.statusCode,
          lastChecked: new Date().toISOString(),
        };

        setLinks(updatedLinks);
        onChange(updatedLinks);

        if (result.reachable) {
          if (!isAutoVerify) {
            toast.success("Looks like that Link Works!", {
              description: link.url,
            });
          }
        } else {
          toast.warning("Link is not reachable", {
            description: result.error || `Status: ${result.statusCode || 'Unknown'}`,
          });
        }
      } catch (error) {
        if (!isAutoVerify) {
          toast.error("Failed to verify link");
        }
      } finally {
        setVerifyingIndex(null);
      }
    },
    [links, onChange]
  );

  // Apply suggested URL fix
  const handleApplySuggestion = useCallback(
    async (index: number) => {
      const suggestion = urlSuggestions.get(index);
      if (!suggestion) return;

      // Update the URL
      const updatedLinks = [...links];
      updatedLinks[index] = {
        ...updatedLinks[index],
        url: suggestion,
      };
      setLinks(updatedLinks);
      onChange(updatedLinks);
      
      // Clear the suggestion
      setUrlSuggestions(prev => {
        const newMap = new Map(prev);
        newMap.delete(index);
        return newMap;
      });

      toast.success("URL format corrected", {
        description: "Verifying the corrected URL...",
      });

      // Verify the corrected URL using the suggestion directly
      setVerifyingIndex(index);

      try {
        const result = await checkUrlReachability(suggestion);

        const finalLinks = [...updatedLinks];
        finalLinks[index] = {
          ...finalLinks[index],
          reachable: result.reachable,
          statusCode: result.statusCode,
          lastChecked: new Date().toISOString(),
        };

        setLinks(finalLinks);
        onChange(finalLinks);

        if (result.reachable) {
          toast.success("Looks like that Link Works!", {
            description: suggestion,
          });
        } else {
          toast.warning("Link is not reachable", {
            description: result.error || `Status: ${result.statusCode || 'Unknown'}`,
          });
        }
      } catch (error) {
        toast.error("Failed to verify link");
      } finally {
        setVerifyingIndex(null);
      }
    },
    [urlSuggestions, links, onChange]
  );

  // Verify all links
  const handleVerifyAll = useCallback(async () => {
    setIsVerifying(true);

    try {
      // Filter links that are actually ready to verify
      const validLinks = links.filter(link => 
        link.url && 
        link.url.trim() !== '' && 
        link.url !== 'https://'
      );

      if (validLinks.length === 0) {
        toast.error("No links to verify");
        setIsVerifying(false);
        return;
      }

      let invalidFormatCount = 0;
      const invalidFormatErrors: string[] = [];

      const verifyPromises = links.map(async (link, index) => {
        // Skip empty or incomplete URLs
        if (!link.url || link.url.trim() === '' || link.url === 'https://') {
          return null;
        }

        // Check format validation
        const formatResult = validateUrlFormat(link.url);
        if (!formatResult.valid) {
          invalidFormatCount++;
          invalidFormatErrors.push(`Link ${index + 1}: ${formatResult.error || 'Invalid format'}`);
          return null;
        }

        const result = await checkUrlReachability(link.url);

        return {
          index,
          reachable: result.reachable,
          statusCode: result.statusCode,
          lastChecked: new Date().toISOString(),
        };
      });

      const results = await Promise.all(verifyPromises);
      const validResults = results.filter((r) => r !== null);

      // Show format errors if any
      if (invalidFormatCount > 0) {
        toast.error(`${invalidFormatCount} link${invalidFormatCount !== 1 ? 's have' : ' has'} invalid URL format`, {
          description: invalidFormatErrors[0], // Show first error
          duration: 5000,
        });
      }

      const updatedLinks = [...links];
      validResults.forEach((result) => {
        if (result) {
          updatedLinks[result.index] = {
            ...updatedLinks[result.index],
            reachable: result.reachable,
            statusCode: result.statusCode,
            lastChecked: result.lastChecked,
          };
        }
      });

      setLinks(updatedLinks);
      onChange(updatedLinks);

      const reachableCount = validResults.filter((r) => r?.reachable).length;
      const totalVerified = validResults.length;
      
      if (totalVerified > 0) {
        if (reachableCount === totalVerified) {
          toast.success(`All ${totalVerified} link${totalVerified !== 1 ? 's' : ''} verified successfully!`);
        } else {
          toast.warning(`Verified ${reachableCount}/${totalVerified} links`, {
            description: `${totalVerified - reachableCount} link${totalVerified - reachableCount !== 1 ? 's' : ''} may not be reachable`,
          });
        }
      } else if (invalidFormatCount === 0) {
        // No valid results and no format errors means all were skipped (empty)
        toast.error("No valid links to verify");
      }
    } catch (error) {
      toast.error("Failed to verify links");
    } finally {
      setIsVerifying(false);
    }
  }, [links, onChange]);

  // Get icon for link type
  const getLinkIcon = (type: LinkType, className = "h-4 w-4") => {
    const Icon = ICON_MAP[type] || LinkIcon;
    return <Icon className={className} />;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Project Links
          </CardTitle>
          <div className="flex gap-2">
            {links.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleVerifyAll}
                disabled={isVerifying}
                className="cursor-pointer"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    Verify All
                  </>
                )}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddLink}
              disabled={links.length >= PROJECT_LINK_LIMITS.MAX_URL_LINKS}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Link
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {links.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <LinkIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No links added yet</p>
            <p className="text-sm">
              Add links to your repository, live demo, or documentation
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {links.map((link, index) => (
              <div
                key={index}
                className={`p-4 border rounded-lg space-y-3 ${
                  link.reachable === false
                    ? "bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-800"
                    : "bg-muted/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getLinkIcon(link.type)}
                    <span className="font-medium text-sm">
                      {LINK_TYPE_METADATA[link.type]?.label || "Link"}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveLink(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label htmlFor={`link-type-${index}`} className="text-sm font-medium">Link Type</label>
                    <Select
                      value={link.type}
                      onValueChange={(value) =>
                        handleUpdateLink(index, "type", value)
                      }
                    >
                      <SelectTrigger id={`link-type-${index}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(LINK_TYPE_METADATA).map(
                          ([type, meta]) => (
                            <SelectItem key={type} value={type}>
                              <div className="flex items-center gap-2">
                                {getLinkIcon(type as LinkType)}
                                {meta.label}
                              </div>
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor={`link-label-${index}`} className="text-sm font-medium">
                      Custom Label (Optional)
                    </label>
                    <Input
                      id={`link-label-${index}`}
                      value={link.label || ""}
                      onChange={(e) =>
                        handleUpdateLink(index, "label", e.target.value)
                      }
                      placeholder={LINK_TYPE_METADATA[link.type]?.label}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor={`link-url-${index}`} className="text-sm font-medium">URL</label>
                  <p className="text-xs text-muted-foreground">
                    Verification checks if the link works, not where it goes. Make sure the URL is correct and goes to your intended destination.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      id={`link-url-${index}`}
                      value={link.url}
                      onChange={(e) =>
                        handleUpdateLink(index, "url", e.target.value)
                      }
                      onBlur={() => {
                        // Auto-verify when user leaves the URL field
                        if (link.url && link.url.trim() !== '' && link.url !== 'https://') {
                          handleVerifyLink(index, true);
                        }
                      }}
                      placeholder="https://example.com"
                      className={`flex-1 transition-all ${
                        emptyUrlIndices.has(index)
                          ? "animate-pulse ring-2 ring-red-500 border-red-500"
                          : link.reachable === true
                          ? "ring-2 ring-green-500 border-green-500"
                          : link.reachable === false
                          ? "ring-2 ring-red-500 border-red-500"
                          : ""
                      }`}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleVerifyLink(index)}
                      disabled={!link.url || link.url === 'https://' || verifyingIndex === index}
                      className="cursor-pointer"
                    >
                      {verifyingIndex === index ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCcw className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Status indicator */}
                {link.url && link.lastChecked && (
                  <div className="flex items-center gap-2">
                    {link.reachable ? (
                      <Badge variant="outline" className="text-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Link Works!
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-yellow-600">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        May not be reachable
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center">
          {links.length} / {PROJECT_LINK_LIMITS.MAX_URL_LINKS} links added
        </p>
      </CardContent>
    </Card>
  );
}
