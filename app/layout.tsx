import "@/styles/globals.css";
import { ClerkProvider, SignedIn, SignIn, SignInButton, SignOutButton, UserButton } from "@clerk/nextjs";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}

