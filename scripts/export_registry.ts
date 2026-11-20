import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { createRegistryPayload } from '../src/data/registry'

const output = resolve(process.cwd(), 'public/data/registry.json')
mkdirSync(dirname(output), { recursive: true })
writeFileSync(output, `${JSON.stringify(createRegistryPayload(), null, 2)}\n`, 'utf8')
console.log(`Wrote registry to ${output}`)
