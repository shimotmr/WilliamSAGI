import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Plus_Jakarta_Sans, Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/ThemeProvider'

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: 'WilliamSAGI',
  description: "William's Super AGI Hub",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW" data-theme="hub-dark" className={`${plusJakartaSans.variable} ${inter.variable}`}>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
