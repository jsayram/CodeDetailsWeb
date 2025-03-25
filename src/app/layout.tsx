import { ClerkProvider } from "@clerk/nextjs";
import "@/styles/globals.css";
import { ThemeProvider } from "@/providers/theme-provider";
import Header from "@/components/layout/header";

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
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col">
        <ClerkProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {/* Fixed height header to prevent shifts */}
            <Header />
            {/* Main content with centered container and responsive padding */}
            <main className="flex-grow">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
                {children}
              </div>
            </main>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
