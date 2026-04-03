import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Durioo In-house Production',
  description: 'Animation production tracking',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
