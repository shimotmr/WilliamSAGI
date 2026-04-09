import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'OpenClaw Nebula OS',
  description: 'OpenClaw 的獨立 WebOS 工作台，聚焦任務、事件、Session、Telegram 與報告證據鏈。',
}

export default function OpenClawOsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
