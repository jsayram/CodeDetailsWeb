import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useIsBrowser, ClientOnly } from "@/utils/ClientSideUtils";

// Enhanced interface with more customization options
interface CodeParticlesProps {
  quantity?: "low" | "medium" | "high" | "ultra";
  speed?: "slow" | "medium" | "fast" | "variable";
  size?: "small" | "medium" | "large" | "mixed";
  containerClassName?: string;
  includeEmojis?: boolean;
  includeKeywords?: boolean;
  includeSymbols?: boolean;
  customSymbols?: Array<{ symbol: string; type: string; color?: string }>;
  syntaxHighlight?: "vscode" | "dark" | "light" | "vibrant";
  depth?: "flat" | "layered";
  opacityRange?: [number, number];
}

export const CodeParticlesElement: React.FC<CodeParticlesProps> = ({
  quantity = "medium",
  speed = "medium",
  size = "medium",
  containerClassName = "",
  includeEmojis = true,
  includeKeywords = true,
  includeSymbols = true,
  customSymbols = [],
  syntaxHighlight = "vscode",
  depth = "layered",
  opacityRange = [0.3, 0.7],
}) => {
  // Get current theme once - use resolvedTheme for the actual applied theme
  const { resolvedTheme } = useTheme();
  // Check if we're in a browser environment
  const isBrowser = useIsBrowser();

  // Determine if we're in light mode
  const isLightMode = useMemo(() => resolvedTheme === "light", [resolvedTheme]);

  // Light mode has higher opacity for better visibility
  const currentOpacityRange = useMemo(
    () => (isLightMode ? [0.2, 1] : opacityRange),
    [isLightMode, opacityRange]
  );

  // Define color schemes with light and dark variants
  const colorSchemes = useMemo(() => {
    const schemes = {
      vscode: {
        dark: {
          foreground: "text-slate-200",
          keyword: "text-blue-400",
          string: "text-amber-400",
          number: "text-cyan-400",
          comment: "text-green-400/70",
          function: "text-yellow-300",
          variable: "text-purple-400",
          type: "text-emerald-400",
          operator: "text-rose-400",
          property: "text-indigo-300",
          emoji: "text-yellow-200",
        },
        light: {
          foreground: "text-slate-800",
          keyword: "text-blue-600",
          string: "text-amber-600",
          number: "text-cyan-700",
          comment: "text-green-600",
          function: "text-yellow-600",
          variable: "text-purple-700",
          type: "text-emerald-600",
          operator: "text-rose-600",
          property: "text-indigo-600",
          emoji: "text-yellow-600",
        },
      },
      dark: {
        dark: {
          foreground: "text-slate-200",
          keyword: "text-cyan-300",
          string: "text-amber-300",
          number: "text-purple-300",
          comment: "text-green-300/70",
          function: "text-teal-300",
          variable: "text-red-300",
          type: "text-blue-300",
          operator: "text-pink-300",
          property: "text-violet-300",
          emoji: "text-green-200",
        },
        light: {
          foreground: "text-slate-800",
          keyword: "text-cyan-700",
          string: "text-amber-700",
          number: "text-purple-800",
          comment: "text-green-700",
          function: "text-teal-700",
          variable: "text-red-600",
          type: "text-blue-700",
          operator: "text-pink-700",
          property: "text-violet-700",
          emoji: "text-green-600",
        },
      },
      light: {
        dark: {
          foreground: "text-slate-200",
          keyword: "text-blue-600",
          string: "text-amber-600",
          number: "text-cyan-600",
          comment: "text-green-600",
          function: "text-yellow-600",
          variable: "text-purple-600",
          type: "text-emerald-600",
          operator: "text-rose-600",
          property: "text-indigo-600",
          emoji: "text-orange-500",
        },
        light: {
          foreground: "text-slate-900",
          keyword: "text-blue-800",
          string: "text-amber-800",
          number: "text-cyan-800",
          comment: "text-green-800",
          function: "text-yellow-800",
          variable: "text-purple-800",
          type: "text-emerald-800",
          operator: "text-rose-800",
          property: "text-indigo-800",
          emoji: "text-orange-700",
        },
      },
      vibrant: {
        dark: {
          foreground: "text-slate-200",
          keyword: "text-pink-500",
          string: "text-amber-500",
          number: "text-cyan-500",
          comment: "text-lime-500",
          function: "text-yellow-400",
          variable: "text-fuchsia-400",
          type: "text-emerald-400",
          operator: "text-rose-400",
          property: "text-violet-400",
          emoji: "text-amber-300",
        },
        light: {
          foreground: "text-slate-900",
          keyword: "text-pink-600",
          string: "text-amber-700",
          number: "text-cyan-700",
          comment: "text-lime-700",
          function: "text-yellow-700",
          variable: "text-fuchsia-700",
          type: "text-emerald-700",
          operator: "text-rose-700",
          property: "text-violet-700",
          emoji: "text-amber-600",
        },
      },
    };

    return schemes;
  }, []);

  // Get the appropriate color scheme based on theme
  const colors = useMemo(() => {
    const themeMode = isLightMode ? "light" : "dark";
    return (
      colorSchemes[syntaxHighlight]?.[themeMode] ||
      colorSchemes.vscode[themeMode]
    );
  }, [isLightMode, syntaxHighlight, colorSchemes]);

  // Generate symbol sets memoized to prevent recreation on theme change
  const codeSymbols = useMemo(() => {
    // Base code symbols
    const baseCodeSymbols = includeSymbols
      ? [
          { symbol: "</>", type: "operator", color: colors.operator },
          { symbol: "{ }", type: "braces", color: colors.operator },
          { symbol: "( )", type: "parentheses", color: colors.operator },
          { symbol: "[ ]", type: "brackets", color: colors.operator },
          { symbol: "#", type: "hash", color: colors.property },
          { symbol: "=>", type: "arrow", color: colors.operator },
          { symbol: "&&", type: "and", color: colors.operator },
          { symbol: "||", type: "or", color: colors.operator },
          { symbol: "===", type: "equality", color: colors.operator },
          { symbol: ";", type: "semicolon", color: colors.operator },
          { symbol: ".", type: "dot", color: colors.operator },
          { symbol: "++", type: "increment", color: colors.operator },
          { symbol: "--", type: "decrement", color: colors.operator },
          { symbol: "!=", type: "notequal", color: colors.operator },
          { symbol: "*", type: "asterisk", color: colors.operator },
          { symbol: "/", type: "slash", color: colors.operator },
          { symbol: "%", type: "percent", color: colors.operator },
          { symbol: "?", type: "question", color: colors.operator },
          { symbol: ":", type: "colon", color: colors.operator },
          { symbol: "$", type: "dollar", color: colors.variable },
          { symbol: "/* */", type: "comment", color: colors.comment },
          { symbol: "//", type: "comment", color: colors.comment },
          { symbol: '"string"', type: "string", color: colors.string },
          { symbol: "'char'", type: "string", color: colors.string },
          { symbol: "`template`", type: "string", color: colors.string },
          { symbol: "42", type: "number", color: colors.number },
          { symbol: "3.14", type: "number", color: colors.number },
          { symbol: "0xff", type: "number", color: colors.number },
        ]
      : [];

    // Programming keywords
    const keywordSymbols = includeKeywords
      ? [
          { symbol: "async", type: "keyword", color: colors.keyword },
          { symbol: "await", type: "keyword", color: colors.keyword },
          { symbol: "function", type: "keyword", color: colors.keyword },
          { symbol: "const", type: "keyword", color: colors.keyword },
          { symbol: "let", type: "keyword", color: colors.keyword },
          { symbol: "var", type: "keyword", color: colors.keyword },
          { symbol: "if", type: "keyword", color: colors.keyword },
          { symbol: "else", type: "keyword", color: colors.keyword },
          { symbol: "for", type: "keyword", color: colors.keyword },
          { symbol: "while", type: "keyword", color: colors.keyword },
          { symbol: "return", type: "keyword", color: colors.keyword },
          { symbol: "import", type: "keyword", color: colors.keyword },
          { symbol: "export", type: "keyword", color: colors.keyword },
          { symbol: "class", type: "keyword", color: colors.keyword },
          { symbol: "extends", type: "keyword", color: colors.keyword },
          { symbol: "new", type: "keyword", color: colors.keyword },
          { symbol: "true", type: "boolean", color: colors.number },
          { symbol: "false", type: "boolean", color: colors.number },
          { symbol: "null", type: "keyword", color: colors.keyword },
          { symbol: "undefined", type: "keyword", color: colors.keyword },
          { symbol: "try", type: "keyword", color: colors.keyword },
          { symbol: "catch", type: "keyword", color: colors.keyword },
          { symbol: "finally", type: "keyword", color: colors.keyword },
          { symbol: "throw", type: "keyword", color: colors.keyword },
        ]
      : [];

    // Programming-related emojis
    const emojiSymbols = includeEmojis
      ? [
          { symbol: "💻", type: "emoji", color: colors.emoji },
          { symbol: "🚀", type: "emoji", color: colors.emoji },
          { symbol: "🔥", type: "emoji", color: colors.emoji },
          { symbol: "⚙️", type: "emoji", color: colors.emoji },
          { symbol: "🔧", type: "emoji", color: colors.emoji },
          { symbol: "🧩", type: "emoji", color: colors.emoji },
          { symbol: "📦", type: "emoji", color: colors.emoji },
          { symbol: "🐛", type: "emoji", color: colors.emoji },
          { symbol: "🔍", type: "emoji", color: colors.emoji },
          { symbol: "🔒", type: "emoji", color: colors.emoji },
          { symbol: "📱", type: "emoji", color: colors.emoji },
          { symbol: "👨‍💻", type: "emoji", color: colors.emoji },
          { symbol: "👩‍💻", type: "emoji", color: colors.emoji },
          { symbol: "⌨️", type: "emoji", color: colors.emoji },
          { symbol: "🖥️", type: "emoji", color: colors.emoji },
          { symbol: "🌐", type: "emoji", color: colors.emoji },
          { symbol: "🌟", type: "emoji", color: colors.emoji },
          { symbol: "✨", type: "emoji", color: colors.emoji },
          { symbol: "🎮", type: "emoji", color: colors.emoji },
          { symbol: "🤖", type: "emoji", color: colors.emoji },
        ]
      : [];

    // Combine all symbol sets
    return [
      ...baseCodeSymbols,
      ...keywordSymbols,
      ...emojiSymbols,
      ...customSymbols,
    ];
  }, [colors, includeSymbols, includeKeywords, includeEmojis, customSymbols]);

  // Define size classes with more granular options
  const baseSizeClasses = useMemo(
    () => ({
      small: {
        base: "text-sm",
        keyword: "text-xs",
        emoji: "text-base",
      },
      medium: {
        base: "text-base sm:text-lg",
        keyword: "text-xs sm:text-sm",
        emoji: "text-lg sm:text-xl",
      },
      large: {
        base: "text-lg sm:text-xl",
        keyword: "text-sm sm:text-base",
        emoji: "text-xl sm:text-2xl",
      },
      mixed: {
        options: [
          "text-xs",
          "text-sm",
          "text-base",
          "text-lg",
          "text-xl",
          "text-2xl",
        ],
      },
    }),
    []
  );

  // Define speed modifiers - these don't change with theme
  const baseSpeedFactor = useMemo(
    () =>
      ({
        slow: 1.5,
        medium: 1,
        fast: 0.7,
        variable: 1,
      }[speed]),
    [speed]
  );

  // Generate particles - this is the most important part to memoize!
  // We use a seed to ensure particles don't regenerate on theme change
  const particles = useMemo(() => {
    // Return empty array during server-side rendering
    if (!isBrowser) return [];

    // Determine number of particles
    const particleCount = {
      low: 10,
      medium: 25,
      high: 40,
      ultra: 60,
    }[quantity];

    // Generate the particles only once - these never change with theme
    return Array(particleCount)
      .fill(null)
      .map((_, index) => {
        // Store the index of the symbol instead of the symbol itself
        // This allows us to update the colors without recreating particles
        const symbolIndex = Math.floor(Math.random() * codeSymbols.length);
        const symbol = codeSymbols[symbolIndex];
        const symbolType = symbol.type;

        // Static properties - never change with theme
        const top = `${5 + Math.random() * 90}%`;
        const left = `${5 + Math.random() * 90}%`;
        const zIndex = depth === "layered" ? Math.floor(Math.random() * 3) : 0;
        const yMovement = Math.random() * 30 - 15;
        const xMovement = Math.random() * 30 - 15;
        const particleSpeedFactor =
          speed === "variable" ? 0.5 + Math.random() * 1.5 : baseSpeedFactor;
        const duration = (5 + Math.random() * 10) * particleSpeedFactor;
        const delay = Math.random() * 8;

        // Size class selection
        let sizeClass;
        if (size === "mixed") {
          const sizeIndex = Math.floor(
            Math.random() * baseSizeClasses.mixed.options.length
          );
          sizeClass = baseSizeClasses.mixed.options[sizeIndex];
        } else {
          if (symbolType === "emoji") {
            sizeClass = baseSizeClasses[size].emoji;
          } else if (symbolType === "keyword") {
            sizeClass = baseSizeClasses[size].keyword;
          } else {
            sizeClass = baseSizeClasses[size].base;
          }
        }

        // Animation variations
        const rotate =
          Math.random() > 0.7
            ? [Math.random() > 0.5 ? -5 : 5, 0, Math.random() > 0.5 ? -5 : 5]
            : 0;
        const scale =
          Math.random() > 0.8 ? [1, Math.random() * 0.2 + 0.9, 1] : 1;

        // Return a particle with all the static information
        // Store the symbolIndex which doesn't change
        return {
          id: index,
          symbolIndex: symbolIndex, // Store index not symbol
          symbolType: symbolType, // Store type for size calculation
          top,
          left,
          zIndex,
          yMovement,
          xMovement,
          duration,
          delay,
          rotate,
          scale,
          sizeClass,
        };
      });
    // Only recreate particles when these props change
  }, [
    quantity,
    speed,
    size,
    depth,
    baseSpeedFactor,
    baseSizeClasses,
    isBrowser,
    codeSymbols,
  ]);

  return (
    <div
      className={`absolute inset-0 overflow-hidden ${containerClassName}`}
      aria-hidden="true"
    >
      <ClientOnly>
        {particles.map((particle) => {
          // Look up the current symbol with current colors
          const symbol = codeSymbols[particle.symbolIndex];

          return (
            <motion.div
              key={particle.id}
              className={`absolute font-mono ${
                symbol.color || colors.foreground
              } ${particle.sizeClass} pointer-events-none select-none`}
              style={{
                top: particle.top,
                left: particle.left,
                zIndex: particle.zIndex,
                // Enhanced visibility for light mode
                textShadow: isLightMode
                  ? "0 0 2px rgba(0,0,0,0.3)"
                  : "0 0 1px rgba(0,0,0,0.2)",
                filter: symbol.symbol.includes("emoji")
                  ? "none"
                  : "blur(0.2px)",
              }}
              animate={{
                y: [0, particle.yMovement, 0],
                x: [0, particle.xMovement, 0],
                opacity: [
                  currentOpacityRange[0],
                  currentOpacityRange[1],
                  currentOpacityRange[0],
                ],
                rotate: particle.rotate,
                scale: particle.scale,
              }}
              transition={{
                duration: particle.duration,
                repeat: Infinity,
                ease: "easeInOut",
                delay: particle.delay,
              }}
            >
              {symbol.symbol}
            </motion.div>
          );
        })}
      </ClientOnly>
    </div>
  );
};
