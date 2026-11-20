import { formatFine, text, type Bilingual, type DsaCase, type Language, type RegulatoryCalendarItem } from './cases'

function searchableValues(item: DsaCase): string[] {
  return [
    item.case_id,
    item.title.zh,
    item.title.en,
    item.entity.zh,
    item.entity.en,
    item.authority.zh,
    item.authority.en,
    item.country.zh,
    item.country.en,
    item.status.zh,
    item.status.en,
    item.stage.zh,
    item.stage.en,
    ...item.platforms,
    ...item.articles,
  ]
}

export function searchCases(items: DsaCase[], query: string): DsaCase[] {
  const needle = query.trim().toLocaleLowerCase()
  if (!needle) return items
  return items.filter((item) => searchableValues(item).some((value) => value.toLocaleLowerCase().includes(needle)))
}

export function exportMarkdown(items: DsaCase[], language: Language, exportedAt = new Date()): string {
  const title = language === 'zh' ? '# DSA 执法追踪器导出' : '# DSA Enforcement Tracker export'
  const intro = language === 'zh' ? `\n导出时间：${exportedAt.toISOString()}\n案件数：${items.length}\n` : `\nExported at: ${exportedAt.toISOString()}\nCases: ${items.length}\n`
  const sections = items.map((item) => {
    const heading = text(item.title, language)
    const facts = language === 'zh'
      ? [`- 案件 ID：${item.case_id}`, `- 主体：${text(item.entity, language)}`, `- 主管机关：${text(item.authority, language)}`, `- 当前状态：${text(item.status, language)}`, `- DSA 条款：${item.articles.join('、')}`, `- 风险等级：${item.risk_level}`, `- 首次日期：${item.first_date}`, `- 最新进展：${item.latest_date}`, `- 罚款：${item.fine == null ? '—' : formatFine(item.fine, language)}`, `- 下一步：${text(item.nextAction, language)}`, `- 来源：${item.source_url}`]
      : [`- Case ID: ${item.case_id}`, `- Entity: ${text(item.entity, language)}`, `- Authority: ${text(item.authority, language)}`, `- Status: ${text(item.status, language)}`, `- DSA articles: ${item.articles.join(', ')}`, `- Risk level: ${item.risk_level}`, `- First date: ${item.first_date}`, `- Latest progress: ${item.latest_date}`, `- Fine: ${item.fine == null ? '—' : formatFine(item.fine, language)}`, `- Next action: ${text(item.nextAction, language)}`, `- Source: ${item.source_url}`]
    return `\n## ${heading}\n\n${facts.join('\n')}\n\n${text(item.evidence_snapshot, language)}`
  })
  return `${title}${intro}${sections.join('\n')}`
}

function csvCell(value: string | number | null): string {
  const textValue = value == null ? '' : String(value)
  return `"${textValue.replaceAll('"', '""')}"`
}

export function exportCsv(items: DsaCase[], language: Language): string {
  const columns = ['case_id', 'title', 'entity', 'platforms', 'country', 'authority', 'designation', 'case_type', 'articles', 'first_date', 'latest_date', 'status', 'fine_eur_millions', 'risk_level', 'owner', 'next_action', 'deadline', 'source_url', 'source_type', 'evidence_snapshot', 'last_verified_at']
  const rows = items.map((item) => [
    item.case_id,
    text(item.title, language),
    text(item.entity, language),
    item.platforms.join(' | '),
    text(item.country, language),
    text(item.authority, language),
    item.designation,
    item.case_type,
    item.articles.join(' | '),
    item.first_date,
    item.latest_date,
    text(item.status, language),
    item.fine,
    item.risk_level,
    text(item.owner, language),
    text(item.nextAction, language),
    item.deadline ? text(item.deadline, language) : null,
    item.source_url,
    item.source_type.join(' | '),
    text(item.evidence_snapshot, language),
    item.last_verified_at,
  ].map(csvCell).join(','))
  return [columns.join(','), ...rows].join('\n') + '\n'
}

export function exportJson(items: DsaCase[], language: Language, exportedAt = new Date()): string {
  return JSON.stringify({ exported_at: exportedAt.toISOString(), language, cases: items }, null, 2)
}

function escapeIcs(value: string): string {
  return value.replaceAll('\\', '\\\\').replaceAll(';', '\\;').replaceAll(',', '\\,').replaceAll('\r\n', '\\n').replaceAll('\n', '\\n')
}

function formatUtcStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
}

function formatCalendarDate(date: string): string {
  return date.replaceAll('-', '')
}

function calendarUid(item: RegulatoryCalendarItem, index: number): string {
  const slug = item.title.en.toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return `${item.date}-${index + 1}-${slug || 'dsa-event'}@dsa-enforcement-tracker`
}

export function exportCalendarIcs(items: RegulatoryCalendarItem[], language: Language = 'en', generatedAt = new Date()): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DSA Enforcement Tracker//Regulatory Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ]
  items.forEach((item, index) => {
    const title: Bilingual = item.title
    const owner = text(item.owner, language)
    const status = text(item.status, language)
    lines.push(
      'BEGIN:VEVENT',
      `UID:${calendarUid(item, index)}`,
      `DTSTAMP:${formatUtcStamp(generatedAt)}`,
      `DTSTART;VALUE=DATE:${formatCalendarDate(item.date)}`,
      `SUMMARY:${escapeIcs(text(title, language))}`,
      `DESCRIPTION:${escapeIcs(`${owner} — ${status}`)}`,
      'END:VEVENT',
    )
  })
  lines.push('END:VCALENDAR')
  return `${lines.join('\r\n')}\r\n`
}
