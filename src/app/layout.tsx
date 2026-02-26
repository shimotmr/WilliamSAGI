import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'WilliamSAGI',
  description: "William's Super AGI Hub",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <html lang="zh-TW"><body>{children}</body></html>
}
