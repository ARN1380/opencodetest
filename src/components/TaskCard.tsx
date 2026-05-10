'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Task, Priority } from '@/lib/types'
import { GripVertical, Trash2, Edit2, Check, X } from 'lucide-react'

interface TaskCardProps {
  task: Task
  onUpdate: (id: string, updates: Partial<Task>) => void
  onDelete: (id: string) => void
}

const priorityColors: Record<Priority, string> = {
  urgent: 'border-l-red-500 bg-red-50',
  high: 'border-l-orange-500 bg-orange-50',
  medium: 'border-l-blue-500 bg-blue-50',
  low: 'border-l-gray-400 bg-gray-50',
}

const priorityBadge: Record<Priority, string> = {
  urgent: 'bg-red-500 text-white',
  high: 'bg-orange-500 text-white',
  medium: 'bg-blue-500 text-white',
  low: 'bg-gray-400 text-white',
}

export default function TaskCard({ task, onUpdate, onDelete }: TaskCardProps) {
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', task },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleSave = () => {
    if (editTitle.trim()) {
      onUpdate(task.id, { title: editTitle.trim() })
    }
    setEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') { setEditTitle(task.title); setEditing(false) }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-start gap-2 p-3 rounded-lg border-l-4 shadow-sm border border-gray-200 ${priorityColors[task.priority]} ${isDragging ? 'shadow-xl rotate-2' : ''} transition-all`}
    >
      <button {...attributes} {...listeners} className="mt-0.5 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
        <GripVertical className="w-4 h-4" />
      </button>

      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-400"
              autoFocus
            />
            <button onClick={handleSave} className="p-1 text-green-600 hover:text-green-800">
              <Check className="w-4 h-4" />
            </button>
            <button onClick={() => { setEditTitle(task.title); setEditing(false) }} className="p-1 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-800 break-words">{task.title}</p>
        )}

        <div className="flex items-center gap-2 mt-2">
          <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${priorityBadge[task.priority]}`}>
            {task.priority}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => { setEditing(true); setEditTitle(task.title) }}
          className="p-1 text-gray-400 hover:text-blue-600 rounded hover:bg-white/50"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-white/50"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
