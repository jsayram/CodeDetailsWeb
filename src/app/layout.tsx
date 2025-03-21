import { ClerkProvider } from '@clerk/nextjs';
import '@/styles/globals.css';

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
          {children}
        </ClerkProvider>
      </body>
    </html>
  )
}
