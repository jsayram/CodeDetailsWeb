import * as React from "react";
import { useIsBrowser } from "@/lib/ClientSideUtils";

const MOBILE_BREAKPOINT = 960;

export function useIsMobile() {
  const isBrowser = useIsBrowser();
  const [isMobile, setIsMobile] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (!isBrowser) return;

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // Modern browsers
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", onChange);
      onChange(); // Initial check
      return () => mql.removeEventListener("change", onChange);
    }
    // Fallback for older browsers
    else if (typeof mql.addListener === "function") {
      mql.addListener(onChange);
      onChange(); // Initial check
      return () => mql.removeListener(onChange);
    }

    // For browsers without matchMedia support
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
  }, [isBrowser]);

  // During SSR, we can't know if it's mobile, so default to non-mobile
  return isBrowser ? isMobile : false;
}
