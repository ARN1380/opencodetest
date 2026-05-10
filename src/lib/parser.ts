import { Task } from './types'

const priorityKeywords: Record<string, RegExp> = {
  urgent: /\b(urgent|asap|immediately?|critical|deadline|today|tonight|right away|emergency|pressing)\b/i,
  high: /\b(important|high priority|must|need to|essential|crucial|top|key|significant|major)\b/i,
  low: /\b(someday|maybe|later|low priority|optional|if I have time|eventually|whenever)\b/i,
}

export function parseTasksFromText(text: string): Omit<Task, 'id' | 'createdAt'>[] {
  const sentences = text
    .split(/[.!\n;]+/)
    .map(s => s.trim())
    .filter(s => s.length > 3)

  if (sentences.length === 0) {
    return [{ title: text.trim(), priority: 'medium', status: 'todo' }]
  }

  return sentences.map(sentence => {
    let priority: 'urgent' | 'high' | 'medium' | 'low' = 'medium'
    const lower = sentence.toLowerCase()

    for (const [p, regex] of Object.entries(priorityKeywords)) {
      if (regex.test(lower)) {
        priority = p as typeof priority
        break
      }
    }

    const clean = sentence
      .replace(/^(urgent|asap|important|high priority|low priority)\s*/i, '')
      .trim()

    return { title: clean, priority, status: 'todo' as const }
  })
}
