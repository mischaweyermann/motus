import type { Metadata } from 'next'
import '../scss/globals.scss'

export const metadata: Metadata = {
  title: 'motus',
  description: 'One plan, every sport.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  )
}
