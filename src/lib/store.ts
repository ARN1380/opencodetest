'use client'

import { useState, useEffect, useCallback } from 'react'
import { Task, Status } from './types'

const STORAGE_KEY = 'voice-task-manager-tasks'

function loadTasks(): Task[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function saveTasks(tasks: Task[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
}

export function useTaskStore() {
  const [tasks, setTasks] = useState<Task[]>([])

  useEffect(() => {
    setTasks(loadTasks())
  }, [])

  useEffect(() => {
    if (tasks.length > 0 || loadTasks().length > 0) {
      saveTasks(tasks)
    }
  }, [tasks])

  const addTasks = useCallback((newTasks: Task[]) => {
    setTasks(prev => [...prev, ...newTasks])
  }, [])

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
  }, [])

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id))
  }, [])

  const moveTask = useCallback((id: string, newStatus: Status) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t))
  }, [])

  const reorderTasks = useCallback((reordered: Task[]) => {
    setTasks(reordered)
  }, [])

  const getTasksByStatus = useCallback((status: Status) => {
    return tasks.filter(t => t.status === status)
  }, [tasks])

  return { tasks, addTasks, updateTask, deleteTask, moveTask, reorderTasks, getTasksByStatus }
}
