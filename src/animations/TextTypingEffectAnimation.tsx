"use client";

import React, { useEffect, useRef, useState } from "react";
import { TEXT_TYPING_SPEED_MS } from "@/constants/project-limits";

export function TextTypingEffectAnimation({
  text,
  speed = TEXT_TYPING_SPEED_MS,
  className = "",
  onComplete,
  skipOnRerender = false,
}: {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void; // for stuff to show up after typing
  skipOnRerender?: boolean;
}) {
  const [displayedText, setDisplayedText] = useState("");
  const hasCompletedRef = useRef(false); // Track completion state

  useEffect(() => {
    // Skip the animation if already completed and skipOnRerender is true
    if (skipOnRerender && hasCompletedRef.current) {
      setDisplayedText(text);
      return;
    }

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex <= text.length) {
        setDisplayedText(text.substring(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(interval);
        hasCompletedRef.current = true; // Mark as completed
        if (onComplete) {
          onComplete();
        }
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, onComplete, skipOnRerender]);

  return <span className={className}>{displayedText}</span>;
}
