'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable'
import { Task, Status } from '@/lib/types'
import { useTaskStore } from '@/lib/store'
import TaskColumn from './TaskColumn'
import VoiceRecorder from './VoiceRecorder'
import TaskCard from './TaskCard'
import { ListTodo, Sparkles } from 'lucide-react'

export default function TaskBoard() {
  const { tasks, addTasks, updateTask, deleteTask, moveTask, reorderTasks, getTasksByStatus } = useTaskStore()
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleTasksCreated = useCallback((newTasks: Task[]) => {
    addTasks(newTasks)
  }, [addTasks])

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id)
    if (task) setActiveTask(task)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeTaskItem = tasks.find(t => t.id === activeId)
    if (!activeTaskItem) return

    const overTask = tasks.find(t => t.id === overId)

    if (overTask && activeTaskItem.status !== overTask.status) {
      moveTask(activeId, overTask.status)
    } else if (!overTask && isStatus(overId) && activeTaskItem.status !== overId) {
      moveTask(activeId, overId)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeTaskItem = tasks.find(t => t.id === activeId)
    const overTask = tasks.find(t => t.id === overId)

    if (!activeTaskItem) return

    const targetStatus = overTask ? overTask.status : (isStatus(overId) ? overId : activeTaskItem.status)

    if (activeTaskItem.status !== targetStatus) {
      moveTask(activeId, targetStatus)
    }

    const statusTasks = getTasksByStatus(targetStatus).filter(t => t.id !== activeId)
    if (overTask) {
      const overIndex = statusTasks.findIndex(t => t.id === overId)
      statusTasks.splice(overIndex, 0, tasks.find(t => t.id === activeId)!)
      const otherTasks = tasks.filter(t => t.status !== targetStatus)
      reorderTasks([...otherTasks, ...statusTasks])
    }
  }

  if (!mounted) return null

  const statuses: Status[] = ['todo', 'in-progress', 'done']

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg">
              <ListTodo className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Voice Task Manager</h1>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                Speak your tasks, AI organizes them
              </p>
            </div>
          </div>
          <VoiceRecorder onTasksCreated={handleTasksCreated} />
        </header>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-6 overflow-x-auto pb-4">
            {statuses.map(status => (
              <TaskColumn
                key={status}
                status={status}
                tasks={getTasksByStatus(status)}
                onUpdate={updateTask}
                onDelete={deleteTask}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTask ? (
              <div className="opacity-90 rotate-3 scale-105">
                <TaskCard task={activeTask} onUpdate={() => {}} onDelete={() => {}} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  )
}

function isStatus(value: string): value is Status {
  return ['todo', 'in-progress', 'done'].includes(value)
}
