'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Task, Status } from '@/lib/types'
import TaskCard from './TaskCard'
import { Clock, PlayCircle, CheckCircle2 } from 'lucide-react'

interface TaskColumnProps {
  status: Status
  tasks: Task[]
  onUpdate: (id: string, updates: Partial<Task>) => void
  onDelete: (id: string) => void
}

const columnConfig: Record<Status, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  'todo': {
    label: 'To Do',
    icon: <Clock className="w-4 h-4" />,
    color: 'text-gray-700',
    bg: 'bg-gray-100/50',
  },
  'in-progress': {
    label: 'In Progress',
    icon: <PlayCircle className="w-4 h-4" />,
    color: 'text-amber-700',
    bg: 'bg-amber-50/50',
  },
  'done': {
    label: 'Done',
    icon: <CheckCircle2 className="w-4 h-4" />,
    color: 'text-green-700',
    bg: 'bg-green-50/50',
  },
}

export default function TaskColumn({ status, tasks, onUpdate, onDelete }: TaskColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const config = columnConfig[status]

  return (
    <div className={`flex flex-col w-full min-w-[280px] max-w-[400px] rounded-xl ${config.bg} p-4`}>
      <div className={`flex items-center gap-2 mb-4 pb-3 border-b border-gray-200 ${config.color}`}>
        {config.icon}
        <h2 className="font-semibold text-sm uppercase tracking-wide">{config.label}</h2>
        <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full bg-white/80 text-gray-500">
          {tasks.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex flex-col gap-2 min-h-[200px] transition-all rounded-lg p-1 ${isOver ? 'bg-purple-100/50 ring-2 ring-purple-300' : ''}`}
      >
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} onUpdate={onUpdate} onDelete={onDelete} />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="flex items-center justify-center h-24 text-sm text-gray-400 italic">
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  )
}
