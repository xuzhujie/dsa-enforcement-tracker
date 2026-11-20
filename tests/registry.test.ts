import assert from 'node:assert/strict'
import test from 'node:test'
import { cases } from '../src/data/cases'
import { createRegistryPayload, dedupeRegistryCases, validateRegistry } from '../src/data/registry'

test('registry payload contains every normalized data object and valid foreign keys', () => {
  const payload = createRegistryPayload()

  assert.ok(payload.enforcement_cases.length >= cases.length)
  assert.ok(payload.case_events.length >= cases.length)
  assert.ok(payload.legal_basis.length > 0)
  assert.ok(payload.entities.length > 0)
  assert.ok(payload.regulators.length > 0)
  assert.ok(payload.remedies_measures.length > 0)
  assert.ok(payload.fines.length > 0)
  assert.ok(payload.compliance_actions.length > 0)
  assert.ok(payload.sources.length > 0)
  assert.ok(payload.review_logs.length > 0)
  assert.ok(Array.isArray(payload.monitor_runs))
  assert.ok(Array.isArray(payload.review_queue))
  assert.deepEqual(validateRegistry(payload), [])
})

test('registry de-duplicates cases by canonical case_id', () => {
  const duplicate = { ...cases[0] }
  const result = dedupeRegistryCases([cases[0], duplicate, cases[1]])

  assert.equal(result.length, 2)
  assert.deepEqual(result.map((item) => item.case_id), [cases[0].case_id, cases[1].case_id])
})
