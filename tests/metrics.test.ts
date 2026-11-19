import assert from 'node:assert/strict'
import test from 'node:test'
import { cases, dedupeCases, formatFine } from '../src/data/cases'
import { getDashboardMetrics } from '../src/data/dashboardMetrics'

test('DSA dashboard totals are derived from the case register', () => {
  const metrics = getDashboardMetrics(cases)

  assert.equal(metrics.fineTotal, 120)
  assert.equal(metrics.decisionCount, 1)
  assert.equal(metrics.finedEntityCount, 1)
  assert.equal(metrics.proceedingCount, 3)
  assert.equal(metrics.remedyCount, 1)
  assert.equal(metrics.categoryCounts.reduce((sum, item) => sum + item.count, 0), cases.length)
})

test('fine formatter supports both interface languages', () => {
  assert.equal(formatFine(120, 'zh'), '€1.2 亿')
  assert.equal(formatFine(120, 'en'), '€120m')
  assert.equal(formatFine(1200, 'zh'), '€12 亿')
  assert.equal(formatFine(1200, 'en'), '€1.2bn')
})

test('case register de-duplicates by case_id', () => {
  const duplicate = { ...cases[0] }
  assert.equal(dedupeCases([cases[0], duplicate, cases[1]]).length, 2)
})
