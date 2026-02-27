import { Bot } from 'lucide-react'

export function TravisAvatar({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-12 h-12' }[size]
  return (
    <div className={`${s} rounded-full bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center`}>
      <Bot className="text-white" size={size === 'sm' ? 14 : size === 'md' ? 18 : 22} />
    </div>
  )
}
