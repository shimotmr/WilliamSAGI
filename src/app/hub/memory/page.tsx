import type { Metadata } from 'next';

import MemorySystemsClient from './MemorySystemsClient';

export const metadata: Metadata = {
  title: '記憶系統全景 · WilliamSAGI',
  description: '短期/中期/長期/超長期記憶系統完整介紹 — lossless-claw、qmd、Notion、MEMORY.md 分層架構',
};

export default function MemorySystemsPage() {
  return <MemorySystemsClient />;
}
