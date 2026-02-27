import { ArrowLeft, Cpu, CheckCircle2, Clock } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { getAgent, agents } from '@/lib/agents-data'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateStaticParams() {
  return agents.map(agent => ({
    id: agent.id,
  }))
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const agent = getAgent(id)
  
  if (!agent) {
    return {
      title: 'Agent Not Found — Travis Daily',
    }
  }

  return {
    title: `${agent.name} — AI Agent — Travis Daily`,
    description: agent.description,
  }
}

const statusConfig = {
  online: {
    color: 'bg-green-500',
    text: 'Online',
    textColor: 'text-green-600',
  },
  offline: {
    color: 'bg-gray-500',
    text: 'Offline',
    textColor: 'text-gray-600',
  },
  busy: {
    color: 'bg-yellow-500',
    text: 'Busy',
    textColor: 'text-yellow-600',
  },
}

export default async function AgentDetailPage({ params }: Props) {
  const { id } = await params
  const agent = getAgent(id)

  if (!agent) {
    notFound()
  }

  const statusInfo = statusConfig[agent.status]

  return (
    <div className="py-6 max-w-3xl mx-auto">
      <Link href="/agents" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft size={16} /> Back to team
      </Link>

      {/* Hero Card */}
      <div className="relative rounded-2xl overflow-hidden mb-6">
        {/* Gradient border effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/20 via-transparent to-pink-500/20 pointer-events-none" />
        <div className="relative border border-primary/20 rounded-2xl bg-card p-6">
          {/* Subtle top accent line */}
          <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
          
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Large Avatar */}
            <div className="relative w-32 h-32 rounded-2xl overflow-hidden border-2 border-border flex-shrink-0">
              <Image
                src={agent.avatar}
                alt={agent.name}
                fill
                className="object-cover"
                style={{ objectPosition: agent.avatarPosition || 'center center' }}
                priority
              />
            </div>
            
            {/* Info */}
            <div className="min-w-0 flex-1">
              <h1 className="font-bold text-3xl mb-2">{agent.name}</h1>
              <p className="text-lg text-muted-foreground mb-3">{agent.role}</p>
              
              {/* Status & Model */}
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <span className={`relative flex h-3 w-3`}>
                    {agent.status === 'online' && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    )}
                    <span className={`relative inline-flex rounded-full h-3 w-3 ${statusInfo.color}`}></span>
                  </span>
                  <span className={`text-sm font-medium ${statusInfo.textColor}`}>{statusInfo.text}</span>
                </div>
                
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Cpu size={14} />
                  <span>{agent.model}</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-muted-foreground leading-relaxed">
                {agent.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Expertise Section */}
      <div className="border border-border rounded-xl bg-card p-6 mb-6">
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
          <CheckCircle2 size={20} className="text-primary" />
          專長領域
        </h2>
        <div className="flex flex-wrap gap-2">
          {agent.expertise.map(skill => (
            <span
              key={skill}
              className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Recent Tasks */}
      {agent.recentTasks && agent.recentTasks.length > 0 && (
        <div className="border border-border rounded-xl bg-card p-6">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Clock size={20} className="text-primary" />
            最近任務
          </h2>
          <ul className="space-y-2">
            {agent.recentTasks.map((task, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0"></span>
                <span>{task}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
