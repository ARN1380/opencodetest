import { NextRequest, NextResponse } from 'next/server'

const API_URL = 'http://217.218.114.245:58022/v1/chat/completions'
const API_KEY = 'token-abc123'

const SYSTEM_PROMPT = `You are a task parser. Extract all tasks from the user's spoken text and assign each a priority.

Priority rules — detect from the user's word choice:
- urgent: words like "urgent", "asap", "immediately", "critical", "deadline", "today", "tonight", "right away", "emergency"
- high: words like "important", "high priority", "must", "need to", "essential", "crucial", "top", "significant"
- medium: neutral statements with no urgency indicators
- low: words like "someday", "maybe", "later", "low priority", "optional", "if I have time", "eventually"

Rules:
- Split compound sentences into separate tasks
- Remove filler words from the title (keep it concise)
- If a single sentence contains multiple tasks, split them

Return ONLY a valid JSON array. No markdown, no explanation, no code blocks.
Example format:
[{"title": "Buy groceries", "priority": "medium"}, {"title": "Fix the login bug", "priority": "urgent"}]`

export async function POST(req: NextRequest) {
  let text = ''

  try {
    const body = await req.json()
    text = body.text || ''
    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 })
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gemma',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: text },
        ],
        stream: false,
        max_tokens: 300,
        temperature: 0.3,
        top_p: 1.0,
      }),
    })

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || '[]'
    const cleaned = content.replace(/```json\s*|\s*```/g, '').trim()
    const tasks = JSON.parse(cleaned)

    return NextResponse.json({ tasks: Array.isArray(tasks) ? tasks : [] })
  } catch (error) {
    console.error('Parse API error:', error)
    return NextResponse.json(
      { error: 'AI parsing failed, using fallback', tasks: parseTasksHeuristic(text) },
      { status: 200 }
    )
  }
}

function parseTasksHeuristic(text: string) {
  const sentences = text.split(/[.!\n;]+/).map(s => s.trim()).filter(s => s.length > 3)
  if (sentences.length === 0) return [{ title: text.trim(), priority: 'medium' }]

  return sentences.map(s => {
    const lower = s.toLowerCase()
    let priority: 'urgent' | 'high' | 'medium' | 'low' = 'medium'
    if (/\b(urgent|asap|immediately?|critical|deadline|today|tonight|right away|emergency)\b/i.test(lower)) priority = 'urgent'
    else if (/\b(important|high priority|must|need to|essential|crucial|top|significant|major)\b/i.test(lower)) priority = 'high'
    else if (/\b(someday|maybe|later|low priority|optional|if I have time|eventually)\b/i.test(lower)) priority = 'low'
    return { title: s.replace(/^(urgent|asap|important|high priority|low priority)\s*/i, '').trim(), priority }
  })
}
