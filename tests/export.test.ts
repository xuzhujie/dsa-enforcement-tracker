import assert from 'node:assert/strict'
import test from 'node:test'
import { cases, calendarItems, type RegulatoryCalendarItem } from '../src/data/cases'
import { exportCalendarIcs, exportCsv, exportJson, exportMarkdown, searchCases } from '../src/data/exports'

test('searchCases searches bilingual fields and metadata', () => {
  assert.deepEqual(searchCases(cases, 'Booking.com').map((item) => item.case_id), ['ec-financial-scams-2025', 'ec-bookingcom-2026'])
  assert.deepEqual(searchCases(cases, '上瘾式设计').map((item) => item.case_id), ['ec-meta-addictive-design-2026'])
  assert.equal(searchCases(cases, 'does-not-exist').length, 0)
})

test('CSV, Markdown and JSON exports preserve Unicode and escaping', () => {
  const item = { ...cases[0], title: { zh: '含,逗号和"引号"', en: 'Comma, and "quote"' } }
  const csv = exportCsv([item], 'zh')
  assert.match(csv, /"含,逗号和""引号"""/)
  assert.match(exportMarkdown([item], 'en', new Date('2026-11-20T00:00:00.000Z')), /Exported at: 2026-11-20T00:00:00\.000Z/)
  const json = JSON.parse(exportJson([item], 'zh', new Date('2026-11-20T00:00:00.000Z')))
  assert.equal(json.cases[0].title.zh, '含,逗号和"引号"')
})

test('ICS export uses escaped values and UTC timestamps', () => {
  const item: RegulatoryCalendarItem = {
    ...calendarItems[0],
    title: { zh: '复核,整改;证据', en: 'Review, remediation; evidence' },
  }
  const ics = exportCalendarIcs([item], 'en', new Date('2026-11-20T01:02:03.000Z'))
  assert.match(ics, /^BEGIN:VCALENDAR\r\n/)
  assert.match(ics, /DTSTAMP:20261120T010203Z/)
  assert.match(ics, /DTSTART;VALUE=DATE:20261205/)
  assert.match(ics, /SUMMARY:Review\\, remediation\\; evidence/)
  assert.match(ics, /END:VCALENDAR\r\n$/)
})
