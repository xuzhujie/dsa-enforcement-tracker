import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Database,
  Download,
  ExternalLink,
  FileText,
  Gavel,
  Landmark,
  Languages,
  LayoutDashboard,
  LayoutGrid,
  LineChart,
  ListFilter,
  RefreshCw,
  Scale,
  SearchCheck,
  ShieldCheck,
} from 'lucide-react'
import {
  CATEGORY_META,
  DATA_AS_OF,
  cases,
  calendarItems,
  dedupeCases,
  formatDate,
  formatFine,
  designatedEntities,
  officialSources,
  rules,
  text,
  type CaseCategory,
  type DsaCase,
  type Language,
} from './data/cases'
import { getDashboardMetrics, type DashboardMetrics } from './data/dashboardMetrics'

type TabKey = 'dashboard' | 'cases' | 'timeline' | 'charts'
const ALL = '__all__'

const UI = {
  zh: {
    portal: '欧盟委员会 · 《数字服务法》（Regulation (EU) 2022/2065）',
    title: 'DSA 执法追踪器',
    subtitle: '聚合欧盟委员会、数字服务协调员、EUR-Lex 与欧盟法院的官方执法进展，并把案件阶段、条款、证据与整改动作放进同一条可核验记录。',
    dataAsOf: '数据核验截至',
    language: '语言',
    filter: '筛选',
    allTypes: '全部类型',
    allPlatforms: '全部平台',
    allArticles: '全部条款',
    clear: '清除筛选',
    dashboard: '驾驶舱',
    cases: '案件总览',
    timeline: '时间线',
    charts: '统计图表',
    attention: '待关注案件',
    attentionSub: '按阶段、VLOP/VLOSE 状态与整改动作排序，便于下一步人工复核。',
    freshness: '数据新鲜度',
    freshnessSub: '区分人工核验的案件库与官方动态文件。',
    caseData: '案件主数据核验截至',
    updatesData: '官方动态最后更新',
    monitorNote: '动态文件由 GitHub Actions 监测官方来源；没有新动态的运行不会制造空提交。',
    updates: '自动监测动态',
    updatesSub: '来源：欧委会 DSA 官方页面与 Press Corner；后续可接入 DSC、EUR-Lex 与 CURIA 抓取器。',
    noUpdates: '暂无新动态，监测任务每日运行中。',
    designatedServices: '已指定 VLOP / VLOSE 样本',
    designatedServicesSub: '当前登记样本的设立地和 DSC 关联用于案件归属与监管路径判断。',
    calendar: '监管日历',
    calendarSub: '把回应窗口、证据复核与 DSC / 欧盟法院节点放入下一步工作计划。',
    exportView: '导出当前筛选',
    exportMarkdown: 'Markdown',
    exportJson: 'JSON',
    exportCsv: 'CSV',
    fined: '已有罚款记录',
    notFined: '暂无罚款记录',
    rules: 'DSA 执法规则速览',
    sources: '官方数据来源',
    open: '展开详情',
    close: '收起详情',
    keyPoints: '案件要点',
    impact: '业务影响',
    status: '当前状态',
    evidence: '证据快照',
    nextAction: '下一步动作',
    source: '官方来源',
    allCases: '全部案件',
    proceedings: '在办程序',
    decisions: '决定 / 罚款',
    remedies: '承诺 / 整改',
    closed: '已结案',
    fines: '累计罚款',
    fineDecisions: '罚款 / 不合规决定',
    finedEntities: '已有罚款主体',
    activeCases: '在办与整改案件',
    official: '官方',
    noCases: '没有符合筛选条件的案件。',
    fineTrend: '罚款决定趋势（百万欧元）',
    entityFine: '主体累计罚款（百万欧元）',
    articleCoverage: '案件涉及的 DSA 条款',
    categoryMix: '案件阶段分布',
    items: '项',
    casesCount: '案件',
    sourceReview: '来源与复核',
  },
  en: {
    portal: 'European Commission · Digital Services Act (Regulation (EU) 2022/2065)',
    title: 'DSA Enforcement Tracker',
    subtitle: 'A source-first tracker for official Commission, DSC, EUR-Lex and CJEU developments, connecting case stage, legal basis, evidence and remediation in one verifiable record.',
    dataAsOf: 'Data verified through',
    language: 'Language',
    filter: 'Filters',
    allTypes: 'All types',
    allPlatforms: 'All platforms',
    allArticles: 'All articles',
    clear: 'Clear filters',
    dashboard: 'Dashboard',
    cases: 'Case register',
    timeline: 'Timeline',
    charts: 'Charts',
    attention: 'Cases to review',
    attentionSub: 'Prioritised by stage, VLOP/VLOSE status and remediation work.',
    freshness: 'Data freshness',
    freshnessSub: 'Separate manually verified case records from official update files.',
    caseData: 'Case catalogue verified through',
    updatesData: 'Official updates last changed',
    monitorNote: 'The update file is monitored by GitHub Actions; empty runs do not create empty commits.',
    updates: 'Automatic source updates',
    updatesSub: 'European Commission DSA pages and Press Corner first; DSC, EUR-Lex and CURIA connectors can follow.',
    noUpdates: 'No new updates. The monitor runs daily.',
    designatedServices: 'Designated VLOP / VLOSE sample',
    designatedServicesSub: 'This curated sample uses establishment and DSC links to resolve case ownership and escalation paths.',
    calendar: 'Regulatory calendar',
    calendarSub: 'Keep response windows, evidence reviews and DSC / CJEU milestones in the next-action queue.',
    exportView: 'Export current view',
    exportMarkdown: 'Markdown',
    exportJson: 'JSON',
    exportCsv: 'CSV',
    fined: 'Fine recorded',
    notFined: 'No fine recorded',
    rules: 'DSA enforcement rules at a glance',
    sources: 'Official data sources',
    open: 'Open details',
    close: 'Hide details',
    keyPoints: 'Key points',
    impact: 'Business impact',
    status: 'Current status',
    evidence: 'Evidence snapshot',
    nextAction: 'Next action',
    source: 'Official source',
    allCases: 'All cases',
    proceedings: 'Proceedings',
    decisions: 'Decisions / fines',
    remedies: 'Commitments / remedies',
    closed: 'Closed',
    fines: 'Cumulative fines',
    fineDecisions: 'Fines / decisions',
    finedEntities: 'Entities fined',
    activeCases: 'Active / remediation cases',
    official: 'Official',
    noCases: 'No cases match those filters.',
    fineTrend: 'Fine decision trend (€ millions)',
    entityFine: 'Fines by entity (€ millions)',
    articleCoverage: 'DSA articles in the catalogue',
    categoryMix: 'Case stage mix',
    items: 'items',
    casesCount: 'cases',
    sourceReview: 'Source registry & review',
  },
} as const

interface UpdateItem {
  title: string
  title_zh?: string
  link: string
  date: string
  summary: string
  summary_zh?: string
}

interface UpdatesData {
  updated_at: string
  items: UpdateItem[]
}

function triggerDownload(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

function exportMarkdown(items: DsaCase[], language: Language): string {
  const title = language === 'zh' ? '# DSA 执法追踪器导出' : '# DSA Enforcement Tracker export'
  const intro = language === 'zh' ? `\n导出时间：${new Date().toISOString()}\n案件数：${items.length}\n` : `\nExported at: ${new Date().toISOString()}\nCases: ${items.length}\n`
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

function exportCsv(items: DsaCase[], language: Language): string {
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

function exportJson(items: DsaCase[], language: Language): string {
  return JSON.stringify({ exported_at: new Date().toISOString(), language, cases: items }, null, 2)
}

function getStoredLanguage(): Language {
  const stored = window.localStorage.getItem('dsa-tracker-language')
  return stored === 'en' ? 'en' : 'zh'
}

function Designation({ value }: { value: DsaCase['designation'] }) {
  if (value === 'Other') return null
  return <span className={`designation designation-${value.toLowerCase().replace('/', '-')}`}>{value}</span>
}

function StatCard({ label, value, note, icon: Icon, tone }: { label: string; value: string; note: string; icon: typeof Landmark; tone: 'blue' | 'red' | 'amber' | 'green' }) {
  return <div className={`stat-card stat-${tone}`}><div className="stat-label"><span>{label}</span><Icon size={16} /></div><div className="stat-value">{value}</div><div className="stat-note">{note}</div></div>
}

function CaseCard({ item, language }: { item: DsaCase; language: Language }) {
  const [expanded, setExpanded] = useState(false)
  const meta = CATEGORY_META[item.category]
  const riskLabel = item.risk_level === 'high' ? (language === 'zh' ? '高风险' : 'High risk') : item.risk_level === 'medium' ? (language === 'zh' ? '中风险' : 'Medium risk') : (language === 'zh' ? '低风险' : 'Low risk')
  return <article className="case-card">
    <div className="case-card-top"><div className="badge-row"><span className={`case-badge ${meta.color}`}>{text(meta.label, language)}</span><span className="stage-pill">{text(item.stage, language)}</span><Designation value={item.designation} /><span className={`risk-pill risk-${item.risk_level}`}>{riskLabel}</span></div><span className="case-id">{item.case_id}</span></div>
    <h3>{text(item.title, language)}</h3>
    <div className="case-meta"><strong>{text(item.entity, language)}</strong><span>{item.platforms.join(' · ')}</span><span>{text(item.authority, language)} · {text(item.country, language)}</span>{item.articles.map((article) => <span key={article} className="article-tag">{article}</span>)}</div>
    {item.fine != null && <div className={`case-fine ${item.category === 'decision' ? 'case-fine-red' : 'case-fine-amber'}`}>{formatFine(item.fine, language)}<small>{language === 'zh' ? '罚款' : 'fine'}</small></div>}
    <p className="case-summary">{text(item.summary, language)}</p>
    <div className="case-facts"><span><CalendarDays size={14} /> {item.latestDate}</span>{item.deadline && <span className="deadline"><AlertTriangle size={14} /> {text(item.deadline, language)}</span>}</div>
    <button className="details-toggle" onClick={() => setExpanded((value) => !value)}>{expanded ? UI[language].close : UI[language].open} <ChevronDown size={15} className={expanded ? 'rotated' : ''} /></button>
    {expanded && <div className="case-details"><div><strong>{UI[language].keyPoints}</strong><ul>{item.keyPoints.map((point, index) => <li key={index}>{text(point, language)}</li>)}</ul></div><div><strong>{UI[language].status}</strong><p>{text(item.status, language)}</p></div><div><strong>{UI[language].impact}</strong><p>{text(item.businessImpact, language)}</p></div><div><strong>{UI[language].evidence}</strong><p>{text(item.evidence_snapshot, language)}</p></div><div className="next-action"><strong>{UI[language].nextAction}</strong><p>{text(item.nextAction, language)} · {text(item.owner, language)}</p></div></div>}
    <div className="case-card-footer">{item.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer"><ExternalLink size={13} /> {text(source.label, language)}</a>)}</div>
  </article>
}

function Timeline({ items, language }: { items: DsaCase[]; language: Language }) {
  const events = items.flatMap((item) => item.events.map((event) => ({ ...event, caseTitle: item.title, caseId: item.id }))).sort((left, right) => right.date.localeCompare(left.date))
  return <div className="timeline-list">{events.map((event, index) => <div className="timeline-event" key={`${event.caseId}-${event.date}-${index}`}><div className={`timeline-dot dot-${event.kind}`} /><div className="timeline-body"><div className="timeline-date">{formatDate(event.date, language)}</div><strong>{text(event.label, language)}</strong><span>{text(event.caseTitle, language)}</span><p>{text(event.description, language)}</p></div></div>)}</div>
}

function BarList({ values, valueLabel, formatter }: { values: Array<{ label: string; value: number; meta?: string }>; valueLabel: string; formatter?: (value: number) => string }) {
  const max = Math.max(...values.map((item) => item.value), 1)
  return <div className="bar-list">{values.map((item) => <div className="bar-row" key={item.label}><div className="bar-row-head"><span>{item.label}</span><strong>{formatter ? formatter(item.value) : item.value} <small>{valueLabel}</small></strong></div><div className="bar-track"><div className="bar-fill" style={{ width: `${Math.max(6, (item.value / max) * 100)}%` }} /></div>{item.meta && <div className="bar-meta">{item.meta}</div>}</div>)}</div>
}

function Charts({ metrics, language }: { metrics: DashboardMetrics; language: Language }) {
  const copy = UI[language]
  return <div className="chart-grid"><section className="chart-card"><div className="section-heading"><h3>{copy.fineTrend}</h3><LineChart size={17} /></div><BarList values={metrics.finesByYear.map((item) => ({ label: item.year, value: item.cumulative, meta: `${formatFine(item.fine, language)} ${language === 'zh' ? '新增' : 'new'}` }))} valueLabel={language === 'zh' ? '累计' : 'cum.'} formatter={(value) => formatFine(value, language)} /></section><section className="chart-card"><div className="section-heading"><h3>{copy.entityFine}</h3><BarChart3 size={17} /></div><BarList values={metrics.finesByEntity.map((item) => ({ label: item.company, value: item.fine, meta: `${item.cases} ${copy.casesCount}` }))} valueLabel="" formatter={(value) => formatFine(value, language)} /></section><section className="chart-card"><div className="section-heading"><h3>{copy.articleCoverage}</h3><Scale size={17} /></div><BarList values={metrics.casesByArticle.slice(0, 6).map((item) => ({ label: item.article, value: item.cases }))} valueLabel={copy.casesCount} /></section><section className="chart-card"><div className="section-heading"><h3>{copy.categoryMix}</h3><ShieldCheck size={17} /></div><BarList values={metrics.categoryCounts.map((item) => ({ label: CATEGORY_META[item.category].label[language], value: item.count }))} valueLabel={copy.casesCount} /></section></div>
}

function DashboardOverview({ metrics, updates, language }: { metrics: DashboardMetrics; updates: UpdatesData | null; language: Language }) {
  const copy = UI[language]
  return <div className="dashboard-grid"><section className="attention-panel"><div className="panel-heading"><div><h2>{copy.attention}</h2><p>{copy.attentionSub}</p></div><SearchCheck size={18} /></div>{metrics.attention.slice(0, 5).map((item) => <div className="attention-row" key={item.id}><div className="attention-badges">{item.reasons.map((reason) => <span className="attention-badge" key={reason.en}>{text(reason, language)}</span>)}{item.fine != null && <strong>{formatFine(item.fine, language)}</strong>}</div><div className="attention-title">{text(item.title, language)}</div><div className="attention-meta">{text(item.entity, language)} · {text(item.stage, language)}{item.source && <a href={item.source.url} target="_blank" rel="noreferrer">{copy.official} <ExternalLink size={12} /></a>}</div></div>)}{metrics.attention.length === 0 && <p className="empty-copy">{copy.noCases}</p>}</section><section className="freshness-panel"><div className="panel-heading"><div><h2>{copy.freshness}</h2><p>{copy.freshnessSub}</p></div><Clock3 size={18} /></div><div className="freshness-item"><CalendarDays size={17} /><div><span>{copy.caseData}</span><strong>{formatDate(DATA_AS_OF, language)}</strong></div></div><div className="freshness-item"><RefreshCw size={17} /><div><span>{copy.updatesData}</span><strong>{updates?.updated_at?.slice(0, 10) ?? '—'}</strong></div></div><div className="freshness-note">{copy.monitorNote}</div></section><section className="recent-panel"><div className="panel-heading"><div><h2>{copy.updates}</h2><p>{copy.updatesSub}</p></div><Database size={18} /></div>{updates?.items?.slice(0, 3).map((update) => <div className="recent-row" key={update.link}><span>{update.date}</span><a href={update.link} target="_blank" rel="noreferrer">{language === 'zh' ? update.title_zh ?? update.title : update.title} <ArrowUpRight size={13} /></a></div>)}{(!updates || updates.items.length === 0) && <p className="empty-copy">{copy.noUpdates}</p>}</section></div>
}

function App() {
  const [language, setLanguage] = useState<Language>(() => getStoredLanguage())
  const [tab, setTab] = useState<TabKey>('dashboard')
  const [category, setCategory] = useState<CaseCategory | typeof ALL>(ALL)
  const [platform, setPlatform] = useState<string>(ALL)
  const [article, setArticle] = useState<string>(ALL)
  const [updates, setUpdates] = useState<UpdatesData | null>(null)
  const copy = UI[language]

  useEffect(() => {
    window.localStorage.setItem('dsa-tracker-language', language)
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en'
  }, [language])

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/updates.json`).then((response) => response.ok ? response.json() as Promise<UpdatesData> : null).then(setUpdates).catch(() => setUpdates(null))
  }, [])

  const register = useMemo(() => dedupeCases(cases), [])
  const platforms = useMemo(() => [...new Set(register.flatMap((item) => item.platforms))], [register])
  const articles = useMemo(() => [...new Set(register.flatMap((item) => item.articles))], [register])
  const filtered = useMemo(() => register.filter((item) => (category === ALL || item.category === category) && (platform === ALL || item.platforms.includes(platform)) && (article === ALL || item.articles.includes(article))), [article, category, platform, register])
  const metrics = useMemo(() => getDashboardMetrics(register), [register])

  const stats = [
    { label: copy.fines, value: formatFine(metrics.fineTotal, language), note: language === 'zh' ? '不含尚未定案的程序' : 'Excludes unresolved proceedings', icon: Gavel, tone: 'red' as const },
    { label: copy.fineDecisions, value: `${metrics.decisionCount} ${copy.items}`, note: `${metrics.finedEntityCount} ${copy.finedEntities.toLowerCase()}`, icon: Scale, tone: 'blue' as const },
    { label: copy.activeCases, value: `${metrics.proceedingCount + metrics.remedyCount} ${copy.items}`, note: language === 'zh' ? '含 RFI、初步认定与整改' : 'RFIs, findings and remediation', icon: SearchCheck, tone: 'amber' as const },
    { label: copy.finedEntities, value: `${metrics.finedEntityCount} ${language === 'zh' ? '个' : ''}`, note: language === 'zh' ? '案件主数据内已记录罚款' : 'With a fine in the case catalogue', icon: CheckCircle2, tone: 'green' as const },
  ]

  const clearFilters = () => { setCategory(ALL); setPlatform(ALL); setArticle(ALL) }
  const hasFilters = category !== ALL || platform !== ALL || article !== ALL
  const exportStamp = new Date().toISOString().slice(0, 10)
  const downloadMarkdown = () => triggerDownload(`dsa-enforcement-${exportStamp}.md`, exportMarkdown(filtered, language), 'text/markdown;charset=utf-8')
  const downloadJson = () => triggerDownload(`dsa-enforcement-${exportStamp}.json`, exportJson(filtered, language), 'application/json;charset=utf-8')
  const downloadCsv = () => triggerDownload(`dsa-enforcement-${exportStamp}.csv`, exportCsv(filtered, language), 'text/csv;charset=utf-8')

  return <div className="app-shell">
    <header className="hero">
      <div className="container hero-inner">
        <div className="hero-top"><div className="eyebrow"><Landmark size={16} /> {copy.portal}</div><div className="hero-tools"><span className="freshness-chip"><CheckCircle2 size={14} /> {copy.dataAsOf} {formatDate(DATA_AS_OF, language)}</span><span className="language-label"><Languages size={14} /> {copy.language}</span><div className="language-toggle"><button className={language === 'zh' ? 'active' : ''} onClick={() => setLanguage('zh')}>中文</button><button className={language === 'en' ? 'active' : ''} onClick={() => setLanguage('en')}>EN</button></div></div></div>
        <h1>{copy.title}</h1><p className="hero-subtitle">{copy.subtitle}</p>
        <div className="stats-grid">{stats.map((stat) => <StatCard key={stat.label} {...stat} />)}</div>
      </div>
    </header>
    <main className="container main-container">
      <div className="filter-bar"><div className="filter-label"><ListFilter size={16} /> {copy.filter}</div><div className="filter-group"><div className="segmented-filter">{([ALL, 'decision', 'proceeding', 'remedy', 'closed'] as const).map((key) => <button key={key} className={(category === key ? 'active ' : '') + 'filter-chip'} onClick={() => setCategory(key)}>{key === ALL ? copy.allTypes : text(CATEGORY_META[key].label, language)}</button>)}</div><select value={platform} onChange={(event) => setPlatform(event.target.value)}><option value={ALL}>{copy.allPlatforms}</option>{platforms.map((item) => <option key={item}>{item}</option>)}</select><select value={article} onChange={(event) => setArticle(event.target.value)}><option value={ALL}>{copy.allArticles}</option>{articles.map((item) => <option key={item}>{item}</option>)}</select>{hasFilters && <button className="clear-button" onClick={clearFilters}>{copy.clear}</button>}</div><div className="export-tools"><span><Download size={14} /> {copy.exportView}</span><button onClick={downloadMarkdown}>{copy.exportMarkdown}</button><button onClick={downloadJson}>{copy.exportJson}</button><button onClick={downloadCsv}>{copy.exportCsv}</button></div></div>
      <div className="tabs" role="tablist">{([['dashboard', LayoutDashboard, copy.dashboard], ['cases', LayoutGrid, copy.cases], ['timeline', ShieldCheck, copy.timeline], ['charts', LineChart, copy.charts]] as const).map(([key, Icon, label]) => <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key as TabKey)}><Icon size={16} /> {label}</button>)}</div>
      {tab === 'dashboard' && <DashboardOverview metrics={metrics} updates={updates} language={language} />}
      {tab === 'cases' && <section className="cases-section"><div className="section-title-row"><div><h2>{copy.cases}</h2><p>{filtered.length} / {register.length} {copy.casesCount}</p></div><FileText size={20} /></div>{filtered.length ? <div className="case-grid">{filtered.map((item) => <CaseCard item={item} language={language} key={item.id} />)}</div> : <p className="empty-state">{copy.noCases}</p>}</section>}
      {tab === 'timeline' && <section className="timeline-panel"><div className="section-title-row"><div><h2>{copy.timeline}</h2><p>{language === 'zh' ? '案件事件按最新官方节点倒序排列。' : 'Case events sorted by the latest official milestone.'}</p></div><Clock3 size={20} /></div><Timeline items={filtered} language={language} /></section>}
      {tab === 'charts' && <Charts metrics={metrics} language={language} />}

      <section className="updates-section"><div className="section-title-row"><div><h2>{copy.updates}</h2><p>{copy.updatesSub}</p></div><RefreshCw size={20} /></div><div className="updates-list">{updates?.items?.length ? updates.items.map((update) => <div className="update-item" key={update.link}><span>{update.date}</span><div><a href={update.link} target="_blank" rel="noreferrer">{language === 'zh' ? update.title_zh ?? update.title : update.title} <ExternalLink size={13} /></a><p>{language === 'zh' ? update.summary_zh ?? update.summary : update.summary}</p></div></div>) : <p className="empty-state">{copy.noUpdates}</p>}</div></section>

      <section className="calendar-section"><div className="section-title-row"><div><h2>{copy.calendar}</h2><p>{copy.calendarSub}</p></div><CalendarDays size={20} /></div><div className="calendar-grid">{calendarItems.map((item) => <div className={`calendar-card calendar-${item.kind}`} key={`${item.date}-${item.title.en}`}><div className="calendar-date">{formatDate(item.date, language)}</div><strong>{text(item.title, language)}</strong><span>{text(item.owner, language)}</span><small>{text(item.status, language)}</small></div>)}</div></section>

      <section className="gatekeeper-section"><div className="section-title-row"><div><h2>{copy.designatedServices}</h2><p>{copy.designatedServicesSub}</p></div><Landmark size={20} /></div><div className="gatekeeper-grid">{designatedEntities.map((item) => <div className={`gatekeeper-card ${item.fined ? 'gatekeeper-fined' : ''}`} key={item.name}><div className="gatekeeper-name">{item.name}</div><div className="gatekeeper-meta"><span>{item.designation}</span><span>{text(item.dsc, language)}</span></div><div className="gatekeeper-status">{item.fined ? `${copy.fined}${item.fineTotal ? ` · ${formatFine(item.fineTotal, language)}` : ''}` : copy.notFined}</div></div>)}</div></section>

      <section className="rules-section"><div className="section-title-row"><div><h2>{copy.rules}</h2></div><Gavel size={20} /></div><div className="rules-grid">{rules.map((rule) => <div key={rule.title.en}><strong>{text(rule.title, language)}</strong><p>{text(rule.body, language)}</p></div>)}</div></section>

      <section className="sources-section"><div className="section-title-row"><div><h2>{copy.sources}</h2><p>{copy.sourceReview}</p></div><Database size={20} /></div><div className="source-grid">{officialSources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer"><strong>{text(source.label, language)} <ArrowUpRight size={14} /></strong><span>{text(source.desc, language)}</span></a>)}</div></section>
    </main>
    <footer><div className="container footer-inner"><span>DSA Enforcement Tracker · {formatDate(DATA_AS_OF, language)}</span><span>{language === 'zh' ? '仅供研究参考，不构成法律意见；以官方原文为准。' : 'For research only; not legal advice. Check the official source text.'}</span></div></footer>
  </div>
}

export default App
