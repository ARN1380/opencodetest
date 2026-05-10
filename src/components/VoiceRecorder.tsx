'use client'

import { useState, useRef, useCallback } from 'react'
import { Task } from '@/lib/types'
import { parseTasksFromText } from '@/lib/parser'
import { Mic, Square, Loader2, Sparkles, AlertCircle } from 'lucide-react'

interface VoiceRecorderProps {
  onTasksCreated: (tasks: Task[]) => void
}

export default function VoiceRecorder({ onTasksCreated }: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [unsupported, setUnsupported] = useState(false)
  const recognitionRef = useRef<any>(null)
  const transcriptRef = useRef('')

  const SpeechRecognition =
    typeof window !== 'undefined' &&
    ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)

  const startRecording = useCallback(() => {
    if (!SpeechRecognition) {
      setUnsupported(true)
      return
    }

    transcriptRef.current = ''
    setProcessing(false)
    setUnsupported(false)

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event: any) => {
      let final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript + ' '
        }
      }
      if (final) transcriptRef.current += final
    }

    recognition.onerror = () => {
      setRecording(false)
      alert('Speech recognition error. Please try again.')
    }

    recognition.onend = () => {
      setRecording(false)
      if (transcriptRef.current.trim()) {
        processTranscript(transcriptRef.current)
      }
    }

    recognitionRef.current = recognition
    recognition.start()
    setRecording(true)
  }, [])

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
  }, [])

  const processTranscript = async (text: string) => {
    setProcessing(true)
    try {
      const res = await fetch('/api/parse-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()

      const parsed = data.tasks?.length ? data.tasks : parseTasksFromText(text)
      const tasks: Task[] = parsed.map((t: any, i: number) => ({
        id: `${Date.now()}-${i}`,
        title: t.title,
        priority: t.priority || 'medium',
        status: 'todo' as const,
        createdAt: Date.now(),
      }))

      if (tasks.length > 0) onTasksCreated(tasks)
    } catch {
      const parsed = parseTasksFromText(text)
      const tasks: Task[] = parsed.map((t, i) => ({
        id: `${Date.now()}-${i}`,
        title: t.title,
        priority: t.priority,
        status: 'todo' as const,
        createdAt: Date.now(),
      }))
      if (tasks.length > 0) onTasksCreated(tasks)
    } finally {
      setProcessing(false)
    }
  }

  if (unsupported) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span>Speech recognition is not supported in this browser. Try Chrome or Edge.</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4">
      {!recording ? (
        <button
          onClick={startRecording}
          disabled={processing}
          className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white rounded-full font-medium transition-all hover:scale-105 active:scale-95 shadow-lg disabled:shadow-none"
        >
          {processing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
          {processing ? 'Processing...' : 'Start Recording'}
        </button>
      ) : (
        <button
          onClick={stopRecording}
          className="flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-900 text-white rounded-full font-medium transition-all animate-pulse shadow-lg"
        >
          <Square className="w-5 h-5" />
          Stop Recording
        </button>
      )}
      {recording && (
        <span className="flex items-center gap-2 text-red-500 font-medium">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
          Recording...
        </span>
      )}
      {!recording && !processing && (
        <span className="text-sm text-gray-500 flex items-center gap-1">
          <Sparkles className="w-4 h-4 text-purple-400" />
          Say your tasks — priority keywords auto-detected
        </span>
      )}
    </div>
  )
}
