export type Language = 'zh' | 'en'
export type Bilingual = { zh: string; en: string }
export type CaseCategory = 'decision' | 'proceeding' | 'remedy' | 'closed'
export type Designation = 'VLOP' | 'VLOSE' | 'Mixed' | 'Other'
export type RiskLevel = 'high' | 'medium' | 'low'

export interface SourceRef {
  label: Bilingual
  url: string
  source_type?: string
  evidence_snapshot?: Bilingual
  last_verified_at?: string
}

export interface EventItem {
  date: string
  label: Bilingual
  description: Bilingual
  kind: 'rfi' | 'proceeding' | 'finding' | 'decision' | 'remedy' | 'review'
}

export interface DsaCase {
  id: string
  case_id: string
  title: Bilingual
  entity: Bilingual
  platforms: string[]
  authority: Bilingual
  country: Bilingual
  designation: Designation
  articles: string[]
  category: CaseCategory
  case_type: string
  stage: Bilingual
  fine: number | null
  first_date: string
  latest_date: string
  risk_level: RiskLevel
  source_url: string
  source_type: string[]
  evidence_snapshot: Bilingual
  last_verified_at: string
  openedDate?: string
  openedLabel?: Bilingual
  latestDate: string
  deadline?: Bilingual
  appeal?: Bilingual
  status: Bilingual
  summary: Bilingual
  businessImpact: Bilingual
  owner: Bilingual
  nextAction: Bilingual
  keyPoints: Bilingual[]
  events: EventItem[]
  sources: SourceRef[]
}

export interface Gatekeeper {
  name: string
  designation: string
  fined: boolean
  fineTotal: number
  dsc: Bilingual
}

export interface LegalBasisRecord {
  case_id: string
  article: string
  obligation: Bilingual
  source_url: string
}

export interface RemedyMeasureRecord {
  case_id: string
  measure_type: 'commitment' | 'interim_measure' | 'remediation'
  description: Bilingual
  status: Bilingual
  deadline?: string
}

export interface FineRecord {
  case_id: string
  amount_eur_millions: number
  decision_date: string
  status: Bilingual
}

export interface ComplianceActionRecord {
  case_id: string
  action_id: string
  owner: Bilingual
  next_action: Bilingual
  deadline?: Bilingual
  evidence_snapshot: Bilingual
  status: Bilingual
}

export interface ReviewLogRecord {
  case_id: string
  reviewer: string
  reviewed_at: string
  decision: Bilingual
  evidence_snapshot: Bilingual
}

export interface MonitorRunRecord {
  run_id: string
  source_type: string
  started_at: string
  finished_at?: string
  items_found: number
  status: 'success' | 'failed'
}

export interface RegulatoryCalendarItem {
  date: string
  title: Bilingual
  owner: Bilingual
  status: Bilingual
  kind: 'deadline' | 'review' | 'court' | 'monitoring'
}

export const DATA_OBJECTS = [
  'enforcement_cases',
  'case_events',
  'legal_basis',
  'entities_platforms',
  'regulators',
  'remedies_measures',
  'fines',
  'compliance_actions',
  'sources',
  'review_logs',
  'monitor_runs',
] as const

export interface OfficialSource {
  label: Bilingual
  url: string
  desc: Bilingual
}

export interface RuleCard {
  title: Bilingual
  body: Bilingual
}

export const DATA_AS_OF = '2026-11-19'

export const CATEGORY_META: Record<CaseCategory, { label: Bilingual; color: string }> = {
  decision: { label: { zh: '决定 / 罚款', en: 'Decision / fine' }, color: 'badge-red' },
  proceeding: { label: { zh: '在办程序', en: 'Proceeding' }, color: 'badge-blue' },
  remedy: { label: { zh: '承诺 / 整改', en: 'Commitment / remedy' }, color: 'badge-green' },
  closed: { label: { zh: '已结案', en: 'Closed' }, color: 'badge-slate' },
}

const sourceEcEnforcement = 'https://digital-strategy.ec.europa.eu/en/policies/dsa-enforcement'
const sourceVlops = 'https://digital-strategy.ec.europa.eu/en/policies/list-designated-vlops-and-vloses'
const sourceDsc = 'https://digital-strategy.ec.europa.eu/en/policies/dsa-dscs'

export const cases: DsaCase[] = [
  {
    id: 'ec-meta-2024',
    case_id: 'ec-meta-2024',
    title: { zh: 'Meta：透明度、研究者数据访问与举报机制', en: 'Meta: transparency, researcher access & reporting' },
    entity: { zh: 'Meta Platforms Ireland Ltd.', en: 'Meta Platforms Ireland Ltd.' },
    platforms: ['Facebook', 'Instagram'],
    authority: { zh: '欧盟委员会（EC）', en: 'European Commission (EC)' },
    country: { zh: '爱尔兰', en: 'Ireland' },
    designation: 'VLOP',
    articles: ['Art. 16', 'Art. 20', 'Art. 34–35', 'Art. 39–40'],
    category: 'proceeding',
    case_type: 'formal_proceeding',
    first_date: '2024-03-19',
    latest_date: '2025-10-24',
    risk_level: 'high',
    source_url: 'https://digital-strategy.ec.europa.eu/en/news/commission-preliminarily-finds-tiktok-and-meta-breach-their-transparency-obligations-under-digital',
    source_type: ['EC press release', 'EC enforcement page'],
    evidence_snapshot: { zh: '初步认定与正式程序官方页面，待逐项映射内部控制证据。', en: 'Official preliminary-findings and proceeding pages, pending claim-by-claim internal evidence mapping.' },
    last_verified_at: DATA_AS_OF,
    stage: { zh: '初步认定', en: 'Preliminary findings' },
    fine: null,
    openedDate: '2024-04-30',
    openedLabel: { zh: '启动正式程序', en: 'Formal proceedings opened' },
    latestDate: '2025-10-24',
    deadline: { zh: '等待 Meta 在响应窗口内提交意见', en: 'Meta response window remains open' },
    status: { zh: '已发出初步认定；程序继续', en: 'Preliminary findings issued; proceedings continue' },
    summary: { zh: '欧委会正在评估 Meta 的透明度、用户举报机制以及研究者访问公共数据的做法。', en: 'The Commission is assessing Meta’s transparency, notice-and-action mechanisms and access to public data for researchers.' },
    businessImpact: { zh: '影响广告库、内容举报、研究者访问和系统性风险文档。', en: 'Potential impact on ad repositories, reporting flows, researcher access and systemic-risk documentation.' },
    owner: { zh: 'EU DSA Team（法务）', en: 'EU DSA Team (Legal)' },
    nextAction: { zh: '复核 Meta 对初步认定的回应', en: 'Review Meta response to preliminary findings' },
    keyPoints: [
      { zh: '重点涉及第 16、20、34–35、39–40 条义务。', en: 'Scope includes Articles 16, 20, 34–35 and 39–40.' },
      { zh: '程序尚未形成最终不合规决定或罚款金额。', en: 'No final non-compliance decision or fine amount has been issued.' },
      { zh: '需要把官方原文中的事实与内部控制证据逐项对应。', en: 'Official findings should be mapped claim-by-claim to internal control evidence.' },
    ],
    events: [
      { date: '2025-10-24', label: { zh: '发出初步认定', en: 'Preliminary findings issued' }, description: { zh: '初步认定涉及研究者数据访问及透明度义务。', en: 'Preliminary findings covered researcher access and transparency obligations.' }, kind: 'finding' },
      { date: '2024-04-30', label: { zh: '启动正式程序', en: 'Formal proceedings opened' }, description: { zh: '针对 Facebook 与 Instagram 的 DSA 合规性启动程序。', en: 'Proceedings opened into Facebook and Instagram compliance.' }, kind: 'proceeding' },
      { date: '2024-03-19', label: { zh: '发出信息请求', en: 'Request for information sent' }, description: { zh: '收集平台风险缓解和内容治理资料。', en: 'Information requested on risk mitigation and content governance.' }, kind: 'rfi' },
    ],
    sources: [
      { label: { zh: '欧委会：Meta / TikTok 初步认定', en: 'EC: preliminary findings for Meta / TikTok' }, url: 'https://digital-strategy.ec.europa.eu/en/news/commission-preliminarily-finds-tiktok-and-meta-breach-their-transparency-obligations-under-digital' },
      { label: { zh: 'DSA 执法框架', en: 'DSA enforcement framework' }, url: sourceEcEnforcement },
    ],
  },
  {
    id: 'ec-x-2023',
    case_id: 'ec-x-2023',
    title: { zh: 'X：广告库、蓝色认证与研究者数据访问', en: 'X: ad repository, blue checkmark & researcher access' },
    entity: { zh: 'X Internet Unlimited Company', en: 'X Internet Unlimited Company' },
    platforms: ['X'],
    authority: { zh: '欧盟委员会（EC）', en: 'European Commission (EC)' },
    country: { zh: '爱尔兰', en: 'Ireland' },
    designation: 'VLOP',
    articles: ['Art. 25', 'Art. 39', 'Art. 40(12)'],
    category: 'decision',
    case_type: 'decision_and_fine',
    first_date: '2023-12-18',
    latest_date: '2025-12-05',
    risk_level: 'high',
    source_url: 'https://digital-strategy.ec.europa.eu/en/news/commission-fines-x-eu120-million-under-digital-services-act',
    source_type: ['EC decision press release', 'EC action-plan follow-up'],
    evidence_snapshot: { zh: '罚款决定、广告库页面与研究者访问材料；整改证据持续收集中。', en: 'Fine decision, ad-repository materials and researcher-access evidence; remediation proof remains open.' },
    last_verified_at: DATA_AS_OF,
    stage: { zh: '不合规决定 / 罚款', en: 'Non-compliance decision / fine' },
    fine: 120,
    openedDate: '2023-12-18',
    openedLabel: { zh: '启动正式程序', en: 'Formal proceedings opened' },
    latestDate: '2025-12-05',
    deadline: { zh: '整改与后续证据跟踪中', en: 'Remediation evidence is being tracked' },
    status: { zh: '决定已作出；整改承诺后续跟踪', en: 'Decision issued; commitment follow-up active' },
    summary: { zh: '欧委会认定 X 在蓝色认证设计、广告库透明度和研究者访问公共数据方面违反 DSA。', en: 'The Commission found breaches involving the blue checkmark design, ad repository transparency and researcher access to public data.' },
    businessImpact: { zh: '需要持续核验广告库可搜索性、API 访问和研究者条款。', en: 'Requires ongoing evidence for searchable ads data, API access and researcher terms.' },
    owner: { zh: '平台法务（EC）', en: 'Legal — Platforms (EC)' },
    nextAction: { zh: '跟踪 X 行动计划的整改证据', en: 'Track X action-plan evidence and milestones' },
    keyPoints: [
      { zh: '这是首个 DSA 不合规决定，罚款 €1.2 亿。', en: 'This was the first DSA non-compliance decision, with a €120 million fine.' },
      { zh: '违反事项包括欺骗性设计、广告库透明度与研究者数据访问。', en: 'Breaches covered deceptive design, ad repository transparency and researcher data access.' },
      { zh: '后续行动计划承诺改善广告库搜索和研究者 API 访问。', en: 'A follow-up action plan committed to better ad search and researcher API access.' },
    ],
    events: [
      { date: '2026-07-16', label: { zh: '接受 X 行动计划', en: 'X action plan accepted' }, description: { zh: '后续计划覆盖广告库与研究者数据访问。', en: 'Follow-up plan covered ad repository and researcher access.' }, kind: 'remedy' },
      { date: '2025-12-05', label: { zh: '作出 €1.2 亿罚款决定', en: '€120m fine issued' }, description: { zh: '首个 DSA 不合规决定。', en: 'First DSA non-compliance decision.' }, kind: 'decision' },
      { date: '2024-07-12', label: { zh: '发出初步认定', en: 'Preliminary findings sent' }, description: { zh: '涉及蓝色认证、广告透明度和研究者访问。', en: 'Covered the blue checkmark, ad transparency and researcher access.' }, kind: 'finding' },
    ],
    sources: [
      { label: { zh: '欧委会：X €1.2 亿罚款', en: 'EC: €120m fine for X' }, url: 'https://digital-strategy.ec.europa.eu/en/news/commission-fines-x-eu120-million-under-digital-services-act' },
      { label: { zh: '欧委会：接受 X 行动计划', en: 'EC: X action plan accepted' }, url: 'https://digital-strategy.ec.europa.eu/en/news/commission-accepts-xs-action-plan-comply-digital-services-act' },
    ],
  },
  {
    id: 'ec-tiktok-2025',
    case_id: 'ec-tiktok-2025',
    title: { zh: 'TikTok：透明度、研究者访问与未成年人保护', en: 'TikTok: transparency, researcher access & minors' },
    entity: { zh: 'TikTok Technology Limited', en: 'TikTok Technology Limited' },
    platforms: ['TikTok'],
    authority: { zh: '欧盟委员会（EC）', en: 'European Commission (EC)' },
    country: { zh: '爱尔兰', en: 'Ireland' },
    designation: 'VLOP',
    articles: ['Art. 28', 'Art. 34–35', 'Art. 39–40'],
    category: 'proceeding',
    case_type: 'formal_proceeding',
    first_date: '2024-02-17',
    latest_date: '2026-07-24',
    risk_level: 'high',
    source_url: 'https://digital-strategy.ec.europa.eu/en/news/commission-preliminarily-finds-tiktok-and-meta-breach-their-transparency-obligations-under-digital',
    source_type: ['EC formal proceeding', 'EC preliminary findings'],
    evidence_snapshot: { zh: '透明度与研究者访问初步认定，未成年人工作流另行跟踪。', en: 'Preliminary findings on transparency and researcher access; minor-safety workstream tracked separately.' },
    last_verified_at: DATA_AS_OF,
    stage: { zh: '初步认定', en: 'Preliminary findings' },
    fine: null,
    openedDate: '2024-02-19',
    openedLabel: { zh: '登记调查工作流', en: 'Investigation workstream logged' },
    latestDate: '2026-07-24',
    deadline: { zh: '回应研究者访问和透明度认定', en: 'Respond to researcher-access and transparency findings' },
    status: { zh: '初步认定已发出；其他调查继续', en: 'Preliminary findings issued; other workstreams continue' },
    summary: { zh: '欧委会正在评估 TikTok 的透明度、研究者访问和未成年人风险控制。', en: 'The Commission is assessing TikTok’s transparency, researcher access and risk controls for minors.' },
    businessImpact: { zh: '影响研究者准入、广告库字段、未成年人保护和风险评估留痕。', en: 'Potential impact on researcher onboarding, ad repository fields, minor-safety controls and risk records.' },
    owner: { zh: 'T&S Policy（EU）', en: 'T&S Policy (EU)' },
    nextAction: { zh: '把未成年人工作流与 DSA 认定交叉核对', en: 'Reconcile minor-safety workstream with DSA findings' },
    keyPoints: [
      { zh: '涉及第 28 条未成年人保护以及第 39–40 条透明度义务。', en: 'Scope includes Article 28 minor protection and Articles 39–40 transparency duties.' },
      { zh: '目前没有最终罚款决定。', en: 'No final fine decision has been issued.' },
    ],
    events: [
      { date: '2026-07-24', label: { zh: '未成年人账户安全初步认定', en: 'Preliminary findings on minor-account safety' }, description: { zh: '欧委会认为未成年人公开账户的默认设置与推荐范围需要调整。', en: 'The Commission considered default visibility and recommendation settings for minors’ public accounts insufficient.' }, kind: 'finding' },
      { date: '2025-10-24', label: { zh: '发出初步认定', en: 'Preliminary findings issued' }, description: { zh: '涉及研究者数据访问和透明度。', en: 'Covered researcher access and transparency.' }, kind: 'finding' },
      { date: '2024-02-17', label: { zh: '发出推荐系统信息请求', en: 'Recommender-systems RFI' }, description: { zh: '要求说明推荐系统设计及相关风险。', en: 'Requested information on recommender-system design and risks.' }, kind: 'rfi' },
    ],
    sources: [
      { label: { zh: '欧委会：TikTok / Meta 初步认定', en: 'EC: preliminary findings for TikTok / Meta' }, url: 'https://digital-strategy.ec.europa.eu/en/news/commission-preliminarily-finds-tiktok-and-meta-breach-their-transparency-obligations-under-digital' },
      { label: { zh: '欧委会：TikTok 未成年人账户安全初步认定', en: 'EC: TikTok minor-account safety preliminary findings' }, url: 'https://digital-strategy.ec.europa.eu/en/news/commission-preliminary-finds-tiktok-breach-digital-services-act-failing-ensure-safe-accounts-minors' },
      { label: { zh: 'VLOP / VLOSE 名单', en: 'VLOP / VLOSE register' }, url: sourceVlops },
    ],
  },
  {
    id: 'ec-financial-scams-2025',
    case_id: 'ec-financial-scams-2025',
    title: { zh: '金融诈骗：跨平台信息请求', en: 'Financial scams: cross-platform RFIs' },
    entity: { zh: 'Apple · Booking.com · Google · Microsoft', en: 'Apple · Booking.com · Google · Microsoft' },
    platforms: ['Apple App Store', 'Booking.com', 'Google Search', 'Google Play', 'Bing'],
    authority: { zh: '欧盟委员会（EC）', en: 'European Commission (EC)' },
    country: { zh: '欧盟 / 多个设立地', en: 'EU / multiple establishments' },
    designation: 'Mixed',
    articles: ['Art. 30', 'Art. 34–35', 'Art. 39'],
    category: 'proceeding',
    case_type: 'request_for_information',
    first_date: '2025-09-23',
    latest_date: '2025-09-23',
    risk_level: 'medium',
    source_url: 'https://digital-strategy.ec.europa.eu/en/news/commission-requests-information-under-digital-services-act-apple-bookingcom-google-and-microsoft-financial-scams',
    source_type: ['EC request for information', 'EC enforcement page'],
    evidence_snapshot: { zh: '金融诈骗 RFI 与平台回复核验清单。', en: 'Financial-scams RFI and platform-response review checklist.' },
    last_verified_at: DATA_AS_OF,
    stage: { zh: '信息请求（RFI）', en: 'Request for information (RFI)' },
    fine: null,
    openedDate: '2025-09-23',
    openedLabel: { zh: '发出信息请求', en: 'Requests for information sent' },
    latestDate: '2025-09-23',
    deadline: { zh: '核验各平台回复完整性', en: 'Review completeness of platform responses' },
    status: { zh: '回复审查中', en: 'Responses under review' },
    summary: { zh: '欧委会要求平台说明如何识别并降低金融诈骗、虚假应用、虚假房源和诈骗广告风险。', en: 'The Commission asked platforms how they identify and mitigate financial scams, fraudulent apps, listings and ads.' },
    businessImpact: { zh: '需要跨市场、广告库、KYC 与系统性风险控制取证。', en: 'Requires evidence across marketplace KYC, ad repositories and systemic-risk controls.' },
    owner: { zh: 'Compliance Ops（ACM）', en: 'Compliance Ops (ACM)' },
    nextAction: { zh: '按 RFI 问题集复核回复与证据', en: 'Review responses against the RFI question set' },
    keyPoints: [
      { zh: '涉及平台如何处理诈骗广告、诈骗网站和仿冒金融应用。', en: 'Covers scam ads, fraudulent websites and impersonating financial apps.' },
      { zh: '关联第 30 条交易者可追溯性和第 34–35 条系统性风险义务。', en: 'Linked to Article 30 trader traceability and Articles 34–35 systemic-risk duties.' },
    ],
    events: [
      { date: '2025-09-23', label: { zh: '发出金融诈骗 RFI', en: 'Financial-scams RFI sent' }, description: { zh: '覆盖 Apple、Booking.com、Google 和 Microsoft。', en: 'Covered Apple, Booking.com, Google and Microsoft.' }, kind: 'rfi' },
    ],
    sources: [
      { label: { zh: '欧委会：金融诈骗 RFI', en: 'EC: financial-scams RFI' }, url: 'https://digital-strategy.ec.europa.eu/en/news/commission-requests-information-under-digital-services-act-apple-bookingcom-google-and-microsoft-financial-scams' },
      { label: { zh: 'DSA 执法框架', en: 'DSA enforcement framework' }, url: sourceEcEnforcement },
    ],
  },
  {
    id: 'ec-x-commitment-2026',
    case_id: 'ec-x-commitment-2026',
    title: { zh: 'X：广告库与研究者访问行动计划', en: 'X: ad repository & researcher-access action plan' },
    entity: { zh: 'X Internet Unlimited Company', en: 'X Internet Unlimited Company' },
    platforms: ['X'],
    authority: { zh: '欧盟委员会（EC）', en: 'European Commission (EC)' },
    country: { zh: '爱尔兰', en: 'Ireland' },
    designation: 'VLOP',
    articles: ['Art. 39', 'Art. 40(12)', 'Art. 75'],
    category: 'remedy',
    case_type: 'commitment_and_remediation',
    first_date: '2025-12-05',
    latest_date: '2026-07-16',
    risk_level: 'high',
    source_url: 'https://digital-strategy.ec.europa.eu/en/news/commission-accepts-xs-action-plan-comply-digital-services-act',
    source_type: ['EC commitment follow-up'],
    evidence_snapshot: { zh: '行动计划接受页面与季度广告库、研究者访问整改证据。', en: 'Accepted action-plan page plus quarterly ad-repository and researcher-access remediation evidence.' },
    last_verified_at: DATA_AS_OF,
    stage: { zh: '承诺 / 整改跟踪', en: 'Commitment / remediation follow-up' },
    fine: null,
    openedDate: '2025-12-05',
    openedLabel: { zh: '从决定转入整改跟踪', en: 'Follow-up created from decision' },
    latestDate: '2026-07-16',
    deadline: { zh: '收集季度整改证据', en: 'Collect quarterly remediation evidence' },
    status: { zh: '行动计划已接受；实施监测中', en: 'Action plan accepted; implementation monitored' },
    summary: { zh: 'X 承诺改善广告库搜索、广告信息披露和研究者公共数据访问。', en: 'X committed to improve ad search, ad disclosures and researcher access to public data.' },
    businessImpact: { zh: '后续需要证明整改在实际访问、响应速度和条款层面有效。', en: 'Follow-up must evidence effective access, response times and terms.' },
    owner: { zh: 'EU DSA Team（法务）', en: 'EU DSA Team (Legal)' },
    nextAction: { zh: '收集下一季度行动计划证据', en: 'Collect next-quarter action-plan evidence' },
    keyPoints: [
      { zh: '行动计划承接 X 的 2025 年不合规决定。', en: 'The action plan follows the 2025 non-compliance decision for X.' },
      { zh: '属于整改闭环，不应与新的案件重复计数。', en: 'This is a remediation workstream and should not be double-counted as a new case.' },
    ],
    events: [
      { date: '2026-07-16', label: { zh: '接受行动计划', en: 'Action plan accepted' }, description: { zh: '确认广告库与研究者访问整改方向。', en: 'Confirmed remediation direction for ads and researcher access.' }, kind: 'remedy' },
      { date: '2025-12-05', label: { zh: '关联不合规决定', en: 'Linked to non-compliance decision' }, description: { zh: '从罚款决定建立后续整改记录。', en: 'Follow-up record created from the fine decision.' }, kind: 'review' },
    ],
    sources: [
      { label: { zh: '欧委会：接受 X 行动计划', en: 'EC: X action plan accepted' }, url: 'https://digital-strategy.ec.europa.eu/en/news/commission-accepts-xs-action-plan-comply-digital-services-act' },
    ],
  },
  {
    id: 'ec-dsc-referral-2025',
    case_id: 'ec-dsc-referral-2025',
    title: { zh: 'DSC 指定与授权：成员国程序', en: 'DSC designation & empowerment: Member State proceedings' },
    entity: { zh: '捷克、西班牙、波兰、葡萄牙', en: 'Czechia, Spain, Poland & Portugal' },
    platforms: ['Digital Services Coordinators'],
    authority: { zh: '欧盟委员会 / 欧盟法院', en: 'European Commission / CJEU' },
    country: { zh: '多成员国', en: 'Multiple Member States' },
    designation: 'Other',
    articles: ['Art. 49–50'],
    category: 'closed',
    case_type: 'judicial_review',
    first_date: '2024-07-02',
    latest_date: '2025-05-15',
    risk_level: 'medium',
    source_url: 'https://digital-strategy.ec.europa.eu/en/policies/dsa-dscs',
    source_type: ['EC infringement notice', 'CURIA docket'],
    evidence_snapshot: { zh: '成员国 DSC 指定与授权程序页面，并链接 CURIA 案件台账。', en: 'Member State DSC designation material linked to the CURIA docket.' },
    last_verified_at: DATA_AS_OF,
    stage: { zh: '司法阶段 / 案件监测', en: 'Judicial phase / docket monitoring' },
    fine: null,
    openedDate: '2024-07-02',
    openedLabel: { zh: '发出正式通知', en: 'Formal notices sent' },
    latestDate: '2025-05-15',
    deadline: { zh: '检查 CURIA 案件进展', en: 'Check CURIA docket for updates' },
    status: { zh: '已进入司法阶段；持续监测', en: 'Judicial phase; monitoring continues' },
    summary: { zh: '欧委会就成员国数字服务协调员的指定与授权义务推进程序，提醒国家监管网络是 DSA 执法闭环的一部分。', en: 'The Commission advanced proceedings concerning Member State DSC designation and empowerment, highlighting the national enforcement network.' },
    businessImpact: { zh: '影响国家层面监管覆盖、升级路径和跨境案件协调。', en: 'May affect national supervisory coverage, escalation paths and cross-border coordination.' },
    owner: { zh: 'Regulatory Affairs', en: 'Regulatory Affairs' },
    nextAction: { zh: '检查 CURIA docket 是否有新节点', en: 'Check CURIA docket for a new milestone' },
    keyPoints: [
      { zh: 'DSC 负责成员国境内中介服务提供商的监督与执法。', en: 'DSCs supervise and enforce intermediary-service obligations at national level.' },
      { zh: 'VLOP/VLOSE 的增强义务仍由欧委会承担核心监督职能。', en: 'The Commission retains core supervision for enhanced VLOP/VLOSE duties.' },
    ],
    events: [
      { date: '2025-05-15', label: { zh: '转入欧盟法院阶段', en: 'Referred to the Court of Justice' }, description: { zh: '成员国 DSC 义务进入司法阶段。', en: 'Proceedings moved into the judicial phase.' }, kind: 'review' },
      { date: '2024-07-02', label: { zh: '发出正式通知', en: 'Formal notices sent' }, description: { zh: '关于 DSC 义务启动程序。', en: 'Proceedings opened over DSC obligations.' }, kind: 'proceeding' },
    ],
    sources: [
      { label: { zh: 'DSC 官方页面', en: 'Digital Services Coordinators' }, url: sourceDsc },
      { label: { zh: 'CURIA', en: 'Court of Justice of the EU' }, url: 'https://curia.europa.eu/jcms/jcms/j_6/en/' },
    ],
  },
]

export const designatedEntities: Gatekeeper[] = [
  { name: 'Alphabet', designation: 'VLOP / VLOSE', fined: true, fineTotal: 0, dsc: { zh: '爱尔兰', en: 'Ireland' } },
  { name: 'Apple', designation: 'VLOP', fined: false, fineTotal: 0, dsc: { zh: '爱尔兰', en: 'Ireland' } },
  { name: 'Meta', designation: 'VLOP', fined: false, fineTotal: 0, dsc: { zh: '爱尔兰', en: 'Ireland' } },
  { name: 'TikTok', designation: 'VLOP', fined: false, fineTotal: 0, dsc: { zh: '爱尔兰', en: 'Ireland' } },
  { name: 'Amazon', designation: 'VLOP', fined: false, fineTotal: 0, dsc: { zh: '卢森堡', en: 'Luxembourg' } },
  { name: 'Booking.com', designation: 'VLOP', fined: false, fineTotal: 0, dsc: { zh: '荷兰', en: 'Netherlands' } },
  { name: 'Microsoft', designation: 'VLOP / VLOSE', fined: false, fineTotal: 0, dsc: { zh: '爱尔兰', en: 'Ireland' } },
  { name: 'X', designation: 'VLOP', fined: true, fineTotal: 120, dsc: { zh: '爱尔兰', en: 'Ireland' } },
]

export const officialSources: OfficialSource[] = [
  { label: { zh: 'DSA 执法框架', en: 'DSA enforcement framework' }, url: sourceEcEnforcement, desc: { zh: '程序、调查权、罚款与救济工具', en: 'Procedure, investigative powers, fines and remedies' } },
  { label: { zh: 'VLOP / VLOSE 名单', en: 'VLOP / VLOSE register' }, url: sourceVlops, desc: { zh: '指定服务、设立地与 DSC 关联', en: 'Designations, establishments and DSC links' } },
  { label: { zh: 'Digital Services Coordinators', en: 'Digital Services Coordinators' }, url: sourceDsc, desc: { zh: '成员国监管网络与执行职责', en: 'National supervisory network and tasks' } },
  { label: { zh: 'EUR-Lex · Regulation 2022/2065', en: 'EUR-Lex · Regulation 2022/2065' }, url: 'https://eur-lex.europa.eu/eli/reg/2022/2065', desc: { zh: 'DSA 法律正文与条款', en: 'Canonical DSA legal text and articles' } },
  { label: { zh: 'CURIA · 欧盟法院', en: 'CURIA · Court of Justice' }, url: 'https://curia.europa.eu/jcms/jcms/j_6/en/', desc: { zh: '司法复核与案件进展', en: 'Judicial review and docket updates' } },
]

export const rules: RuleCard[] = [
  { title: { zh: '不合规罚款', en: 'Non-compliance fines' }, body: { zh: '最高可达提供商全球年营业额的 6%；对部分调查和信息请求还可施加额外程序性罚款。', en: 'Up to 6% of worldwide annual turnover; additional procedural penalties may apply to certain investigations and RFIs.' } },
  { title: { zh: '定期罚款与临时措施', en: 'Periodic penalties & interim measures' }, body: { zh: '逾期不配合、未执行措施或承诺时，可按平均日营业额计算定期罚款；危机情况下可采取临时措施。', en: 'Periodic penalties can accrue for delay or non-compliance; interim measures are available in crisis situations.' } },
  { title: { zh: '证据闭环', en: 'Evidence loop' }, body: { zh: '每个状态变化都应绑定官方来源、抓取时间、证据快照、owner 与下一步动作。', en: 'Every status change should link to an official source, snapshot, owner and next action.' } },
]

export const calendarItems: RegulatoryCalendarItem[] = [
  { date: '2026-12-05', title: { zh: 'X 罚款决定一周年证据复核', en: 'One-year evidence review for X fine decision' }, owner: { zh: 'EU DSA Team（法务）', en: 'EU DSA Team (Legal)' }, status: { zh: '待安排', en: 'To schedule' }, kind: 'review' },
  { date: '2026-12-15', title: { zh: 'Meta / TikTok 初步认定回应窗口复核', en: 'Review Meta / TikTok preliminary-findings response window' }, owner: { zh: 'EU DSA Team（法务）', en: 'EU DSA Team (Legal)' }, status: { zh: '待核验', en: 'Verification due' }, kind: 'deadline' },
  { date: '2027-01-15', title: { zh: 'DSC 与 CURIA 案件台账检查', en: 'DSC and CURIA docket check' }, owner: { zh: 'Regulatory Affairs', en: 'Regulatory Affairs' }, status: { zh: '持续监测', en: 'Ongoing monitoring' }, kind: 'court' },
  { date: '2027-02-17', title: { zh: 'DSA 适用周年监管日历更新', en: 'DSA applicability anniversary calendar refresh' }, owner: { zh: 'Compliance Ops', en: 'Compliance Ops' }, status: { zh: '计划中', en: 'Planned' }, kind: 'monitoring' },
]

export function text(value: Bilingual, language: Language): string {
  return value[language]
}

export function dedupeCases(items: DsaCase[]): DsaCase[] {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = item.case_id.trim().toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function formatFine(millions: number, language: Language = 'zh'): string {
  if (language === 'en') return `€${millions >= 1000 ? `${(millions / 1000).toFixed(1)}bn` : `${millions}m`}`
  if (millions >= 100) return `€${(millions / 100).toFixed(millions % 100 === 0 ? 0 : 1)} 亿`
  return `€${millions}00 万`
}

export function formatDate(iso: string, language: Language = 'zh'): string {
  const [year, month, day] = iso.split('-').map(Number)
  if (language === 'en') return `${String(day).padStart(2, '0')} ${new Date(year, month - 1).toLocaleString('en', { month: 'short' })} ${year}`
  return `${year} 年 ${month} 月 ${day} 日`
}

export const DSA_TOTAL_FINE = cases.reduce((sum, item) => sum + (item.fine ?? 0), 0)
