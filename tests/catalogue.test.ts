import assert from 'node:assert/strict'
import test from 'node:test'
import { cases, designatedEntities } from '../src/data/cases'

const requiredCaseIds = [
  'ec-aliexpress-2024',
  'ec-temu-2024',
  'ec-bookingcom-2026',
  'ec-meta-addictive-design-2026',
]

test('catalogue includes the current official matter families', () => {
  const byId = new Map(cases.map((item) => [item.case_id, item]))
  requiredCaseIds.forEach((caseId) => assert.ok(byId.has(caseId), `missing ${caseId}`))
  assert.equal(new Set(cases.map((item) => item.case_id)).size, cases.length)

  for (const caseId of requiredCaseIds) {
    const item = byId.get(caseId)
    assert.ok(item)
    assert.match(item.source_url, /^https:\/\/digital-strategy\.ec\.europa\.eu\//)
    assert.ok(item.articles.length > 0)
    assert.ok(item.events.length >= 2)
    assert.ok(item.evidence_snapshot.zh.length > 0)
    assert.ok(item.evidence_snapshot.en.length > 0)
    assert.ok(item.owner.zh.length > 0)
    assert.ok(item.nextAction.en.length > 0)
    assert.ok(item.events.some((event) => event.date === item.first_date))
    assert.ok(item.events.some((event) => event.date === item.latest_date))
  }
})

test('catalogue spans proceedings, decisions, remedies, RFIs and judicial monitoring', () => {
  assert.ok(cases.some((item) => item.case_type === 'formal_proceeding'))
  assert.ok(cases.some((item) => item.case_type === 'decision_and_fine'))
  assert.ok(cases.some((item) => item.category === 'remedy'))
  assert.ok(cases.some((item) => item.case_type === 'request_for_information'))
  assert.ok(cases.some((item) => item.case_type === 'judicial_review'))
})

test('designation sample includes the latest official VLOP/VLOSE changes', () => {
  const names = new Set(designatedEntities.map((item) => item.name))
  for (const name of ['WhatsApp', 'ChatGPT', 'Reddit', 'Roblox']) assert.ok(names.has(name), `missing ${name}`)
})
