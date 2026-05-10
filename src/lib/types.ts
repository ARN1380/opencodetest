export type Priority = 'urgent' | 'high' | 'medium' | 'low'
export type Status = 'todo' | 'in-progress' | 'done'

export interface Task {
  id: string
  title: string
  description?: string
  priority: Priority
  status: Status
  createdAt: number
}
