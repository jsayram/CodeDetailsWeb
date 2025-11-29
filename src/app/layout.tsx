import { ClerkProvider } from "@clerk/nextjs";
import "@/styles/globals.css";
import { ThemeProvider } from "@/providers/theme-provider";
import { ToasterProvider } from "@/components/ui/toaster";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SWRProvider } from "@/providers/swr-provider";

export const metadata = {
  title: "Code Details",
  description: "Demo of code based web app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
      </head>
      <body className="overflow-x-hidden">
        <ClerkProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <SWRProvider>
              {/* Main content with centered container and responsive padding */}
              <ErrorBoundary>
                <div className="max-w-[100vw] overflow-x-hidden">{children}</div>
              </ErrorBoundary>
              <ToasterProvider />
            </SWRProvider>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
