export type InspirationType = "page" | "image" | "quote" | "note" | "video"

export const NOTE_TITLE_MAX_LENGTH = 120
export const NOTE_CONTENT_MAX_LENGTH = 10000
export const NOTE_NOTES_MAX_LENGTH = 5000
export const NOTE_TAG_MAX_COUNT = 12
export const NOTE_TAG_MAX_LENGTH = 40
export const WORKSPACE_NAME_MAX_LENGTH = 60

export interface CreateNoteInput {
  title?: string
  content: string
  notes?: string
  tags?: string[]
  workspaceId?: string
}

export interface UpdateNoteInput extends CreateNoteInput {
  id: string
}

export interface NoteInspiration {
  id: string
  type: "note"
  title?: string
  content: string
  notes?: string
  tags: string[]
  workspaceId?: string
  createdAt: number
  updatedAt: number
}

export interface WorkspacePreviewItem {
  id: string
  type: InspirationType
  title?: string
  text?: string
  imageUrl?: string
  createdAt: number
}

/** Thumbnails only: counts live on `WorkspaceSummary.itemCount`. */
export interface WorkspacePreview {
  items: WorkspacePreviewItem[]
}

export interface WorkspaceSummary {
  id: string
  name: string
  itemCount: number
  preview: WorkspacePreview
  createdAt: number
  updatedAt: number
}

export interface WorkspaceDetail {
  id: string
  name: string
  items: NoteInspiration[]
  createdAt: number
  updatedAt: number
}

export function normalizeWorkspaceName(name: string) {
  return name.trim()
}

export function getWorkspaceNameKey(name: string) {
  return normalizeWorkspaceName(name).toLocaleLowerCase()
}

export function validateWorkspaceName(name: string) {
  const normalizedName = normalizeWorkspaceName(name)

  if (!normalizedName) {
    throw new Error("Workspace name is required.")
  }

  if (normalizedName.length > WORKSPACE_NAME_MAX_LENGTH) {
    throw new Error(
      `Workspace name must be ${WORKSPACE_NAME_MAX_LENGTH} characters or fewer.`
    )
  }

  return normalizedName
}

export const INSIGHTS_TYPE_ORDER: readonly InspirationType[] = [
  "page",
  "image",
  "quote",
  "note",
  "video"
]

export const INSIGHTS_HEATMAP_WINDOW_DAYS = 365
export const INSIGHTS_ACTIVE_WINDOW_DAYS = 30
export const INSIGHTS_TOP_TAG_LIMIT = 5
/** Monday, matching the Settings prototype's default week start. */
export const INSIGHTS_WEEK_START_DAY = 1

export interface InsightDayCount {
  /** Local calendar day as `YYYY-MM-DD`, resolved in the requested time zone. */
  date: string
  count: number
}

export interface InsightTypeCount {
  type: InspirationType
  count: number
}

export interface InsightTagCount {
  tag: string
  count: number
}

export interface InsightsSummary {
  totalCount: number
  createdThisMonth: number
  createdLastMonth: number
  createdThisWeek: number
  createdLastWeek: number
  /** Distinct days with at least one creation inside the active window. */
  activeDayCount: number
  /** One entry per local day across the heatmap window, ascending, zero filled. */
  dailyCounts: InsightDayCount[]
  typeCounts: InsightTypeCount[]
  topTags: InsightTagCount[]
}

/** Minimal projection of an `inspirations` row needed to aggregate insights. */
export interface InsightSourceItem {
  createdAt: number
  type: InspirationType
  tags: string[]
}

const MS_PER_DAY = 24 * 60 * 60 * 1000
const dateKeyFormatters = new Map<string, Intl.DateTimeFormat>()

function getDateKeyFormatter(timeZone: string) {
  const cached = dateKeyFormatters.get(timeZone)

  if (cached) {
    return cached
  }

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  })

  dateKeyFormatters.set(timeZone, formatter)

  return formatter
}

/** Falls back to UTC when the client sends a missing or unknown time zone. */
export function normalizeInsightsTimeZone(timeZone?: string) {
  const candidate = timeZone?.trim()

  if (!candidate) {
    return "UTC"
  }

  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: candidate })

    return candidate
  } catch {
    return "UTC"
  }
}

/** Local calendar day (`YYYY-MM-DD`) of a timestamp in the given IANA time zone. */
export function getInsightsDateKey(timestamp: number, timeZone: string) {
  const parts = getDateKeyFormatter(timeZone).formatToParts(timestamp)
  let year = ""
  let month = ""
  let day = ""

  for (const part of parts) {
    if (part.type === "year") {
      year = part.value
    } else if (part.type === "month") {
      month = part.value
    } else if (part.type === "day") {
      day = part.value
    }
  }

  return `${year}-${month}-${day}`
}

/**
 * Date keys are `YYYY-MM-DD`, so they sort lexicographically and plain day
 * arithmetic can run on a UTC representation of the same calendar day.
 */
export function shiftInsightsDateKey(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split("-")
  const shifted =
    Date.UTC(Number(year), Number(month) - 1, Number(day)) + days * MS_PER_DAY

  return new Date(shifted).toISOString().slice(0, 10)
}

export function getInsightsWeekStartDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-")
  const weekday = new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day))
  ).getUTCDay()
  const offset = (weekday - INSIGHTS_WEEK_START_DAY + 7) % 7

  return shiftInsightsDateKey(dateKey, -offset)
}

export function buildInsightsDateKeys(endDateKey: string, days: number) {
  const dateKeys: string[] = []

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    dateKeys.push(shiftInsightsDateKey(endDateKey, -offset))
  }

  return dateKeys
}

function getMonthKey(dateKey: string) {
  return dateKey.slice(0, 7)
}

function shiftMonthKey(monthKey: string, months: number) {
  const year = Number(monthKey.slice(0, 4))
  const month = Number(monthKey.slice(5, 7))
  const totalMonths = year * 12 + (month - 1) + months
  const shiftedYear = Math.floor(totalMonths / 12)
  const shiftedMonth = (totalMonths % 12) + 1

  return `${String(shiftedYear).padStart(4, "0")}-${String(shiftedMonth).padStart(2, "0")}`
}

/**
 * Aggregates the owner's current rows. Deletions leave the set immediately, so
 * every figure on the Insights surface describes the same living collection.
 * Day/week/month boundaries are resolved in `timeZone`, which is why the
 * aggregate is computed server-side from a client-supplied IANA zone.
 */
export function buildInsightsSummary(
  items: readonly InsightSourceItem[],
  now: number,
  timeZone?: string
): InsightsSummary {
  const resolvedTimeZone = normalizeInsightsTimeZone(timeZone)
  const todayKey = getInsightsDateKey(now, resolvedTimeZone)
  const weekStartKey = getInsightsWeekStartDateKey(todayKey)
  const previousWeekStartKey = shiftInsightsDateKey(weekStartKey, -7)
  const currentMonthKey = getMonthKey(todayKey)
  const previousMonthKey = shiftMonthKey(currentMonthKey, -1)
  const heatmapDateKeys = buildInsightsDateKeys(
    todayKey,
    INSIGHTS_HEATMAP_WINDOW_DAYS
  )
  const activeWindowStartKey =
    heatmapDateKeys[heatmapDateKeys.length - INSIGHTS_ACTIVE_WINDOW_DAYS] ??
    heatmapDateKeys[0] ??
    todayKey
  const dailyCounts = new Map<string, number>()
  const typeCounts = new Map<InspirationType, number>()
  const tagCounts = new Map<string, number>()

  for (const dateKey of heatmapDateKeys) {
    dailyCounts.set(dateKey, 0)
  }

  for (const type of INSIGHTS_TYPE_ORDER) {
    typeCounts.set(type, 0)
  }

  let createdThisMonth = 0
  let createdLastMonth = 0
  let createdThisWeek = 0
  let createdLastWeek = 0

  for (const item of items) {
    typeCounts.set(item.type, (typeCounts.get(item.type) ?? 0) + 1)

    const itemDateKey = getInsightsDateKey(item.createdAt, resolvedTimeZone)
    const itemMonthKey = getMonthKey(itemDateKey)

    if (itemMonthKey === currentMonthKey) {
      createdThisMonth += 1
    } else if (itemMonthKey === previousMonthKey) {
      createdLastMonth += 1
    }

    if (itemDateKey >= weekStartKey) {
      createdThisWeek += 1
    } else if (itemDateKey >= previousWeekStartKey) {
      createdLastWeek += 1
    }

    if (dailyCounts.has(itemDateKey)) {
      dailyCounts.set(itemDateKey, (dailyCounts.get(itemDateKey) ?? 0) + 1)
    }

    // One content contributes at most once per distinct tag.
    for (const tag of new Set(item.tags)) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1)
    }
  }

  let activeDayCount = 0

  for (const dateKey of heatmapDateKeys) {
    if (dateKey < activeWindowStartKey) {
      continue
    }

    if ((dailyCounts.get(dateKey) ?? 0) > 0) {
      activeDayCount += 1
    }
  }

  return {
    totalCount: items.length,
    createdThisMonth,
    createdLastMonth,
    createdThisWeek,
    createdLastWeek,
    activeDayCount,
    dailyCounts: heatmapDateKeys.map((date) => ({
      date,
      count: dailyCounts.get(date) ?? 0
    })),
    typeCounts: INSIGHTS_TYPE_ORDER.map((type) => ({
      type,
      count: typeCounts.get(type) ?? 0
    })),
    topTags: Array.from(tagCounts, ([tag, count]) => ({ tag, count }))
      .sort(
        (left, right) =>
          right.count - left.count || left.tag.localeCompare(right.tag)
      )
      .slice(0, INSIGHTS_TOP_TAG_LIMIT)
  }
}
