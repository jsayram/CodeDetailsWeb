import { ClerkProvider } from "@clerk/nextjs";
import "@/styles/globals.css";
import { ThemeProvider } from "@/providers/theme-provider";

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
            {/* Main content with centered container and responsive padding */}
            <div className="max-w-[100vw] overflow-x-hidden">{children}</div>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
