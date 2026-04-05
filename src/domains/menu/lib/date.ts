const TZ = 'Asia/Ho_Chi_Minh'
const OFFSET_MS = 7 * 60 * 60 * 1000

// Today's date normalized to midnight Vietnam time, stored as UTC
export function getTodayUTC(): Date {
  const now = new Date()
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(now)

  const year = Number(parts.find((p) => p.type === 'year')?.value)
  const month = Number(parts.find((p) => p.type === 'month')?.value)
  const day = Number(parts.find((p) => p.type === 'day')?.value)

  return new Date(Date.UTC(year, month - 1, day) - OFFSET_MS)
}

// Parse YYYY-MM-DD route param into UTC date for DB query
export function parseDateParam(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day) - OFFSET_MS)
}
