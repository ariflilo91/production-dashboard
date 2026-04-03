import { Holiday } from './supabase'

export const STAGE_FULL: Record<string, Record<string, string>> = {
  Script:     { BR: 'Briefing', IDEA: 'Ideation', PP: 'Pacing plot', D1: 'Detailing 1', D2: 'Detailing 2', F: 'Final', AG: 'Audio guide' },
  Storyboard: { BR: 'Briefing', TH: 'Thumbnail', KP: 'Key pose', IB: 'In-between', F: 'Final' },
  Concept:    { BR: 'Briefing', S: 'Sketching', D1: 'Detailing 1', D2: 'Detailing 2', F: 'Final' },
  Modeling:   { BR: 'Briefing', P1: 'Progress 1', P2: 'Progress 2', P3: 'Progress 3', F: 'Final' },
  Animation:  { BR: 'Briefing', LO: 'Layout', D1: 'Detailing 1', D2: 'Detailing 2', D3: 'Detailing 3', F: 'Final' },
  Recording:  { SR: 'Set recording', SFX: 'Sound FX', S: 'Submit audio' },
  Scoring:    { PR1: 'Preview 1', PR2: 'Preview 2', F: 'Final' },
  Mixing:     { PR1: 'Preview 1', PR2: 'Preview 2', F: 'Final' },
  Render:     { BR: 'Briefing', MS: 'Master shot', R1: 'Render 1', R2: 'Render 2', R3: 'Render 3', F: 'Final' },
  Comp:       { PR1: 'Preview 1', PR2: 'Preview 2', F: 'Final' },
}

export const DEPT_STAGES: Record<string, string[]> = {
  Script:     ['BR', 'IDEA', 'PP', 'D1', 'D2', 'F', 'AG'],
  Storyboard: ['BR', 'TH', 'KP', 'IB', 'F'],
  Concept:    ['BR', 'S', 'D1', 'D2', 'F'],
  Modeling:   ['BR', 'P1', 'P2', 'P3', 'F'],
  Animation:  ['BR', 'LO', 'D1', 'D2', 'D3', 'F'],
  Recording:  ['SR', 'SFX', 'S'],
  Scoring:    ['PR1', 'PR2', 'F'],
  Mixing:     ['PR1', 'PR2', 'F'],
  Render:     ['BR', 'MS', 'R1', 'R2', 'R3', 'F'],
  Comp:       ['PR1', 'PR2', 'F'],
}

export const STATUS_LABELS: Record<string, string> = {
  done: 'Done', wip: 'In progress', review: 'In review',
  overdue: 'Overdue', risk: 'At risk', upcoming: 'Upcoming',
}

export function getStageFull(deptName: string, code: string): string {
  return STAGE_FULL[deptName]?.[code] ?? code
}

export function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

export function dayDiff(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000)
}

export function parseDate(str: string): Date {
  return new Date(str + 'T12:00:00')
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function formatDateInput(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function isOffDay(date: Date, holidays: Holiday[]): { off: boolean; type?: string; name?: string } {
  const dow = date.getDay()
  if (dow === 0 || dow === 6) return { off: true, type: 'weekend' }
  const key = formatDateInput(date)
  const h = holidays.find(h => h.date === key)
  if (h) return { off: true, type: h.type, name: h.name }
  return { off: false }
}

export function workdaysRemaining(endDate: Date, today: Date, holidays: Holiday[]): { val: number; late: boolean } {
  if (today > endDate) return { val: dayDiff(endDate, today), late: true }
  let count = 0
  let cur = new Date(today)
  while (cur <= endDate) {
    if (!isOffDay(cur, holidays).off) count++
    cur = addDays(cur, 1)
  }
  return { val: count, late: false }
}

export function buildDays(start: Date, end: Date): Date[] {
  const days: Date[] = []
  const n = dayDiff(start, end) + 1
  for (let i = 0; i < n; i++) days.push(addDays(start, i))
  return days
}
