import { ReactNode, FC } from "react";
import { useIsBrowser } from "@/hooks/use-is-browser";

/**
 * Component for rendering content only on the client-side
 * to prevent hydration errors
 */
export const ClientOnly: FC<{ children: ReactNode; fallback?: ReactNode }> = ({
  children,
  fallback = null,
}) => {
  const isBrowser = useIsBrowser();

  if (!isBrowser) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
