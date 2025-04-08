import React from "react";

interface HeroLoadingStateProps {
  showImage?: boolean;
  showActions?: boolean;
}

export function HeroLoadingState({
  showActions = true,
}: HeroLoadingStateProps) {
  return (
    <div className="flex items-center justify-center px-3 h-full">
      <div className="flex flex-col items-center justify-center mx-auto">
        {/* Background gradient - matches the actual gradient */}
        <div
          className="fixed h-[120%] w-[120%] inset-0 -left-[10%] -top-[10%]
                     bg-gradient-to-br
                     from-primary/20 to-secondary/20 
                     rounded-full blur-2xl opacity-10 animate-pulse"
          style={{ animationDuration: "10s" }}
        />

        {/* Header section placeholder - matching structure */}
        <div className="flex flex-col items-center justify-center">
          {/* First heading placeholder */}
          <div className="text-5xl pt-4 sm:text-6xl md:text-7xl lg:text-8xl font-medium text-center">
            <div className="p-2">
              <div className="h-14 sm:h-16 md:h-18 lg:h-20 bg-muted rounded w-3/4 mx-auto animate-pulse"></div>
            </div>
          </div>

          {/* Second heading placeholder */}
          <div className="text-5xl pt-4 sm:text-6xl md:text-7xl lg:text-8xl font-medium tracking-tight text-center">
            <div className="p-2">
              <div
                className="h-14 sm:h-16 md:h-18 lg:h-20 bg-muted rounded w-1/2 mx-auto animate-pulse"
                style={{ animationDelay: "200ms" }}
              ></div>
            </div>
          </div>

          {/* Third heading placeholder */}
          <div>
            <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-medium text-center">
              <div
                className="h-12 sm:h-14 md:h-16 lg:h-18 bg-muted rounded w-2/5 mx-auto animate-pulse"
                style={{ animationDelay: "300ms" }}
              ></div>
            </div>
          </div>
        </div>

        {/* Terminal Window Section placeholder - exact same width and positioning */}
        <div className="w-[110%] pb-[10%] pt-10 xl:w-[130%]">
          <div className="w-full h-full min-h-[250px] md:min-w-[600px] border rounded-lg bg-muted/20 backdrop-blur-lg animate-pulse overflow-hidden border-2-gray-200/30">
            {/* Terminal header with traffic lights */}
            <div className="flex items-center p-2 border-b bg-muted/30">
              {/* Traffic lights */}
              <div className="flex space-x-2 ml-2">
                <div className="w-3 h-3 rounded-full bg-red-400/40 animate-pulse"></div>
                <div
                  className="w-3 h-3 rounded-full bg-yellow-400/40 animate-pulse"
                  style={{ animationDelay: "200ms" }}
                ></div>
                <div
                  className="w-3 h-3 rounded-full bg-green-400/40 animate-pulse"
                  style={{ animationDelay: "400ms" }}
                ></div>
              </div>
              {/* Terminal title with date */}
              <div className="mx-auto flex items-center space-x-2">
                <div className="h-4 w-24 bg-muted rounded animate-pulse"></div>
                <div
                  className="h-3 w-16 bg-muted/50 rounded animate-pulse"
                  style={{ animationDelay: "300ms" }}
                ></div>
              </div>
            </div>

            {/* Terminal content - mimics the git commands and links */}
            <div className="p-4 space-y-4">
              {/* Git command placeholders with proper spacing */}
              <div className="text-xl font-medium cursor-text text-gray-400/30 animate-pulse">
                <div className="h-6 bg-muted/40 rounded w-[90%] mb-3"></div>
                <div
                  className="h-6 bg-muted/40 rounded w-[85%] mb-3"
                  style={{ animationDelay: "150ms" }}
                ></div>
                <div
                  className="h-6 bg-muted/40 rounded w-[80%] mb-3"
                  style={{ animationDelay: "300ms" }}
                ></div>
                <div
                  className="h-6 bg-muted/40 rounded w-[75%]"
                  style={{ animationDelay: "450ms" }}
                ></div>
              </div>

              {/* Authentication message placeholder */}
              <div className="pt-2 border-t border-muted/30">
                <div
                  className="h-5 bg-muted/60 rounded w-[80%] mx-auto animate-pulse"
                  style={{ animationDelay: "600ms" }}
                ></div>
              </div>

              {/* Links section - only show when showActions is true */}
              {showActions && (
                <div className="mt-6 space-y-3 pt-4 border-t border-muted/40">
                  {/* Navigation links placeholders */}
                  <div className="flex justify-center space-x-4">
                    {[1, 2, 3, 4, 5].map((link) => (
                      <div
                        key={link}
                        className="h-8 bg-muted/70 rounded-md px-4 animate-pulse"
                        style={{
                          width:
                            link === 1 ? "80px" : link === 2 ? "100px" : "90px",
                          animationDelay: `${600 + link * 150}ms`,
                        }}
                      ></div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Section - Welcome Message placeholder with exact same classes */}
        <div className="flex items-center justify-center pb-10 text-6xl font-medium pt-[20%] sm:-mt-[15%] sm:text-7xl md:text-5xl lg:text-6xl xl:text-7xl xl:-mt-[20%]">
          <div>
            <div className="flex flex-col items-center justify-center">
              <div className="h-8 sm:h-10 md:h-12 bg-muted/50 rounded w-50 animate-pulse mb-2"></div>
              <div
                className="h-8 sm:h-10 md:h-12 bg-muted/50 rounded w-80 animate-pulse"
                style={{ animationDelay: "800ms" }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
