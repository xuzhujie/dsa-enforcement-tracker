import { CATEGORY_META, type Bilingual, type CaseCategory, type DsaCase } from './cases'

export interface AttentionItem {
  id: string
  title: DsaCase['title']
  entity: DsaCase['entity']
  stage: DsaCase['stage']
  reasons: Bilingual[]
  fine: number | null
  source?: DsaCase['sources'][number]
}

export interface DashboardMetrics {
  fineTotal: number
  decisionCount: number
  finedEntityCount: number
  proceedingCount: number
  remedyCount: number
  attention: AttentionItem[]
  finesByYear: Array<{ year: string; fine: number; cumulative: number }>
  finesByEntity: Array<{ company: string; fine: number; cases: number }>
  casesByArticle: Array<{ article: string; cases: number }>
  categoryCounts: Array<{ category: CaseCategory; label: string; count: number }>
}

export function getDashboardMetrics(items: DsaCase[]): DashboardMetrics {
  const decisions = items.filter((item) => item.category === 'decision' && item.fine != null)
  const fineByYear = new Map<string, number>()
  decisions.forEach((item) => {
    const year = item.latestDate.slice(0, 4)
    fineByYear.set(year, (fineByYear.get(year) ?? 0) + (item.fine ?? 0))
  })
  let cumulative = 0
  const finesByYear = [...fineByYear.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([year, fine]) => {
    cumulative += fine
    return { year, fine, cumulative }
  })

  const byEntity = new Map<string, { company: string; fine: number; cases: number }>()
  decisions.forEach((item) => {
    const company = item.entity.en.split(' ')[0] ?? item.entity.en
    const existing = byEntity.get(company) ?? { company, fine: 0, cases: 0 }
    existing.fine += item.fine ?? 0
    existing.cases += 1
    byEntity.set(company, existing)
  })

  const articleCounts = new Map<string, number>()
  items.forEach((item) => item.articles.forEach((article) => articleCounts.set(article, (articleCounts.get(article) ?? 0) + 1)))
  const categoryOrder: CaseCategory[] = ['decision', 'proceeding', 'remedy', 'closed']
  const categoryCounts = categoryOrder.map((category) => ({ category, label: CATEGORY_META[category].label.en, count: items.filter((item) => item.category === category).length })).filter((item) => item.count > 0)

  const attention = items.filter((item) => item.category !== 'closed').map((item) => ({
    id: item.id,
    title: item.title,
    entity: item.entity,
    stage: item.stage,
    reasons: [
      item.category === 'decision' ? { zh: '决定', en: 'Decision' } : CATEGORY_META[item.category].label,
      item.designation !== 'Other' ? { zh: item.designation, en: item.designation } : { zh: '监管路径', en: 'Regulatory path' },
    ],
    fine: item.fine,
    source: item.sources[0],
  }))

  return {
    fineTotal: decisions.reduce((sum, item) => sum + (item.fine ?? 0), 0),
    decisionCount: decisions.length,
    finedEntityCount: new Set(decisions.map((item) => item.entity.en.split(' ')[0])).size,
    proceedingCount: items.filter((item) => item.category === 'proceeding').length,
    remedyCount: items.filter((item) => item.category === 'remedy').length,
    attention,
    finesByYear,
    finesByEntity: [...byEntity.values()].sort((a, b) => b.fine - a.fine),
    casesByArticle: [...articleCounts.entries()].map(([article, cases]) => ({ article, cases })).sort((a, b) => b.cases - a.cases),
    categoryCounts,
  }
}
