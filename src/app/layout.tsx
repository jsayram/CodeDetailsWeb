import { ClerkProvider } from '@clerk/nextjs';
import '@/styles/globals.css';
import { ThemeProvider } from '@/providers/theme-provider';

export const metadata = {
  title: 'Code Details',
  description: 'Demo of code based web app',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              {children}
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}
