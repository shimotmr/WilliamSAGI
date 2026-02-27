'use client'

import { useEffect, useState } from 'react'

import { supabase } from '@/lib/supabase'

export default function TestRealtimePage() {
  const [messages, setMessages] = useState<any[]>([])
  const [connected, setConnected] = useState(false)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
    console.log(message)
  }

  useEffect(() => {
    addLog('Setting up Realtime subscription...')
    
    const channel = supabase
      .channel('test_realtime_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_messages',
        },
        (payload) => {
          addLog(`New message received: ${JSON.stringify(payload.new)}`)
          setMessages(prev => [...prev, payload.new])
        }
      )
      .subscribe((status: string, err?: any) => {
        addLog(`Subscribe status: ${status}, error: ${err}`)
        if (status === 'SUBSCRIBED') {
          addLog('Successfully subscribed to realtime!')
          setConnected(true)
        } else {
          addLog(`Failed to subscribe: ${status}`)
        }
      })

    return () => {
      addLog('Cleaning up subscription...')
      supabase.removeChannel(channel)
    }
  }, [])

  const testInsert = async () => {
    addLog('Testing manual insert...')
    try {
      const { error } = await supabase
        .from('agent_messages')
        .insert({
          thread_id: 'ddc7fa78-6b15-476b-8a8e-21c0f932808d',
          sender: 'test',
          content: `Test message at ${new Date().toISOString()}`,
          message_type: 'text'
        })
      
      if (error) {
        addLog(`Insert error: ${JSON.stringify(error)}`)
      } else {
        addLog('Insert successful!')
      }
    } catch (err) {
      addLog(`Insert exception: ${err}`)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Realtime Test Page</h1>
      
      <div className="mb-6">
        <div className={`inline-flex items-center gap-2 px-3 py-2 rounded ${
          connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            connected ? 'bg-green-500' : 'bg-red-500'
          }`} />
          {connected ? 'Connected' : 'Disconnected'}
        </div>
      </div>

      <div className="mb-6">
        <button 
          onClick={testInsert}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test Insert
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">Messages Received via Realtime</h2>
          <div className="bg-gray-100 p-4 rounded h-64 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-gray-500">No messages received yet...</p>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className="mb-2 p-2 bg-white rounded">
                  <div className="font-medium">{msg.sender}</div>
                  <div className="text-sm">{msg.content}</div>
                  <div className="text-xs text-gray-500">{msg.timestamp}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Debug Logs</h2>
          <div className="bg-gray-900 text-green-400 p-4 rounded h-64 overflow-y-auto font-mono text-xs">
            {logs.map((log, idx) => (
              <div key={idx} className="mb-1">{log}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}