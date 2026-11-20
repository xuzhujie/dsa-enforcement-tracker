import {
  DATA_AS_OF,
  calendarItems,
  cases,
  dedupeCases,
  type Bilingual,
  type DsaCase,
  type EventItem,
  type RegulatoryCalendarItem,
} from './cases'

export interface RegistryEvent extends EventItem {
  event_id: string
  case_id: string
}

export interface RegistryLegalBasis {
  legal_basis_id: string
  case_id: string
  article: string
  obligation: Bilingual
  source_url: string
}

export interface RegistryEntity {
  entity_id: string
  name: Bilingual
  platforms: string[]
  country: Bilingual
  designation: DsaCase['designation']
  case_ids: string[]
}

export interface RegistryRegulator {
  regulator_id: string
  name: Bilingual
  scope: Bilingual
  source_url: string
}

export interface RegistryRemedy {
  remedy_id: string
  case_id: string
  measure_type: 'commitment' | 'interim_measure' | 'remediation'
  description: Bilingual
  status: Bilingual
  deadline?: Bilingual
}

export interface RegistryFine {
  fine_id: string
  case_id: string
  amount_eur_millions: number
  decision_date: string
  status: Bilingual
}

export interface RegistryComplianceAction {
  action_id: string
  case_id: string
  owner: Bilingual
  next_action: Bilingual
  deadline?: Bilingual
  evidence_snapshot: Bilingual
  status: Bilingual
}

export interface RegistrySource {
  source_id: string
  case_id?: string
  label: Bilingual
  url: string
  source_type: string
  evidence_snapshot?: Bilingual
  last_verified_at: string
}

export interface RegistryReviewLog {
  review_id: string
  case_id: string
  reviewer: string
  reviewed_at: string
  decision: Bilingual
  evidence_snapshot: Bilingual
}

export interface RegistryMonitorRun {
  run_id: string
  source_type: string
  started_at: string
  finished_at?: string
  items_found: number
  status: 'success' | 'failed'
  error?: string
}

export interface ReviewQueueItem {
  review_id: string
  item_key: string
  case_id?: string
  title: string
  link: string
  published_at: string
  source_type: string
  evidence_snapshot: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
}

export interface RegistryPayload {
  schema_version: 1
  generated_at: string
  data_as_of: string
  enforcement_cases: DsaCase[]
  case_events: RegistryEvent[]
  legal_basis: RegistryLegalBasis[]
  entities: RegistryEntity[]
  regulators: RegistryRegulator[]
  remedies_measures: RegistryRemedy[]
  fines: RegistryFine[]
  compliance_actions: RegistryComplianceAction[]
  sources: RegistrySource[]
  review_logs: RegistryReviewLog[]
  monitor_runs: RegistryMonitorRun[]
  review_queue: ReviewQueueItem[]
  calendar: RegulatoryCalendarItem[]
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)]
}

export function dedupeRegistryCases(items: DsaCase[]): DsaCase[] {
  return dedupeCases(items)
}

export function createRegistryPayload(seed: DsaCase[] = cases, asOf = DATA_AS_OF): RegistryPayload {
  const enforcementCases = dedupeRegistryCases(seed)
  const caseEvents: RegistryEvent[] = enforcementCases.flatMap((item) => item.events.map((event, index) => ({
    ...event,
    event_id: `${item.case_id}-${event.date}-${index + 1}`,
    case_id: item.case_id,
  })))

  const legalBasis: RegistryLegalBasis[] = enforcementCases.flatMap((item) => unique(item.articles).map((article) => ({
    legal_basis_id: `${item.case_id}-${slugify(article)}`,
    case_id: item.case_id,
    article,
    obligation: {
      zh: `${article} 相关义务`,
      en: `DSA obligations related to ${article}`,
    },
    source_url: item.source_url,
  })))

  const entities = new Map<string, RegistryEntity>()
  enforcementCases.forEach((item) => {
    const key = item.entity.en.toLowerCase()
    const existing = entities.get(key)
    if (existing) {
      existing.platforms = unique([...existing.platforms, ...item.platforms])
      existing.case_ids = unique([...existing.case_ids, item.case_id])
      return
    }
    entities.set(key, {
      entity_id: `entity-${slugify(item.entity.en)}`,
      name: item.entity,
      platforms: [...item.platforms],
      country: item.country,
      designation: item.designation,
      case_ids: [item.case_id],
    })
  })

  const regulators = new Map<string, RegistryRegulator>()
  enforcementCases.forEach((item) => {
    const key = item.authority.en.toLowerCase()
    if (!regulators.has(key)) {
      regulators.set(key, {
        regulator_id: `regulator-${slugify(item.authority.en)}`,
        name: item.authority,
        scope: {
          zh: `负责 ${item.country.zh} 的 DSA 执法与案件监督`,
          en: `DSA enforcement and case supervision for ${item.country.en}`,
        },
        source_url: item.source_url,
      })
    }
  })

  const remediesMeasures: RegistryRemedy[] = enforcementCases
    .filter((item) => item.category === 'remedy' || item.events.some((event) => event.kind === 'remedy'))
    .map((item) => ({
      remedy_id: `${item.case_id}-remedy`,
      case_id: item.case_id,
      measure_type: item.category === 'remedy' ? 'commitment' : 'remediation',
      description: item.summary,
      status: item.status,
      ...(item.deadline ? { deadline: item.deadline } : {}),
    }))

  const fines: RegistryFine[] = enforcementCases
    .filter((item): item is DsaCase & { fine: number } => item.fine != null)
    .map((item) => ({
      fine_id: `${item.case_id}-fine`,
      case_id: item.case_id,
      amount_eur_millions: item.fine,
      decision_date: item.latest_date,
      status: item.status,
    }))

  const complianceActions: RegistryComplianceAction[] = enforcementCases.map((item) => ({
    action_id: `${item.case_id}-next-action`,
    case_id: item.case_id,
    owner: item.owner,
    next_action: item.nextAction,
    ...(item.deadline ? { deadline: item.deadline } : {}),
    evidence_snapshot: item.evidence_snapshot,
    status: item.status,
  }))

  const sources: RegistrySource[] = enforcementCases.flatMap((item) => item.sources.map((source, index) => ({
    source_id: `${item.case_id}-source-${index + 1}`,
    case_id: item.case_id,
    label: source.label,
    url: source.url,
    source_type: source.source_type ?? item.source_type[0] ?? 'Official EU source',
    ...(source.evidence_snapshot ? { evidence_snapshot: source.evidence_snapshot } : {}),
    last_verified_at: source.last_verified_at ?? item.last_verified_at,
  })))

  const reviewLogs: RegistryReviewLog[] = enforcementCases.map((item) => ({
    review_id: `${item.case_id}-review-${item.last_verified_at}`,
    case_id: item.case_id,
    reviewer: 'Curated seed',
    reviewed_at: item.last_verified_at,
    decision: { zh: '已核验登记', en: 'Curated and verified' },
    evidence_snapshot: item.evidence_snapshot,
  }))

  return {
    schema_version: 1,
    generated_at: new Date().toISOString(),
    data_as_of: asOf,
    enforcement_cases: enforcementCases,
    case_events: caseEvents,
    legal_basis: legalBasis,
    entities: [...entities.values()],
    regulators: [...regulators.values()],
    remedies_measures: remediesMeasures,
    fines,
    compliance_actions: complianceActions,
    sources,
    review_logs: reviewLogs,
    monitor_runs: [],
    review_queue: [],
    calendar: calendarItems,
  }
}

export function validateRegistry(payload: RegistryPayload): string[] {
  const errors: string[] = []
  const caseIds = new Set(payload.enforcement_cases.map((item) => item.case_id))
  if (caseIds.size !== payload.enforcement_cases.length) errors.push('enforcement_cases contains duplicate case_id values')

  const checkCaseIds = (collection: Array<{ case_id: string }>, name: string) => {
    collection.forEach((item) => {
      if (!caseIds.has(item.case_id)) errors.push(`${name} references unknown case_id: ${item.case_id}`)
    })
  }
  checkCaseIds(payload.case_events, 'case_events')
  checkCaseIds(payload.legal_basis, 'legal_basis')
  checkCaseIds(payload.remedies_measures, 'remedies_measures')
  checkCaseIds(payload.fines, 'fines')
  checkCaseIds(payload.compliance_actions, 'compliance_actions')
  checkCaseIds(payload.sources.filter((item): item is RegistrySource & { case_id: string } => Boolean(item.case_id)), 'sources')
  checkCaseIds(payload.review_logs, 'review_logs')

  const sourceUrls = payload.sources.map((item) => item.url)
  if (sourceUrls.some((url) => !url.startsWith('http'))) errors.push('sources contains a non-HTTP URL')
  if (new Set(payload.sources.map((item) => item.source_id)).size !== payload.sources.length) errors.push('sources contains duplicate source_id values')
  if (payload.schema_version !== 1) errors.push('unsupported registry schema_version')
  return errors
}

export async function loadRegistry(baseUrl = ''): Promise<RegistryPayload> {
  const prefix = baseUrl.endsWith('/') || baseUrl === '' ? baseUrl : `${baseUrl}/`
  const response = await fetch(`${prefix}data/registry.json`)
  if (!response.ok) throw new Error(`Registry request failed with HTTP ${response.status}`)
  const payload = await response.json() as RegistryPayload
  const errors = validateRegistry(payload)
  if (errors.length > 0) throw new Error(`Registry validation failed: ${errors.join('; ')}`)
  return payload
}
