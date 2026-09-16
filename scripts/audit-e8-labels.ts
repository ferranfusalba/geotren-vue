import { E8_STOPS } from '@/data/e8Timetable'
import { e8ScheduleLabel, e8TripsFor } from '@/utils/e8'

const QC = E8_STOPS.indexOf('QC')
const byLabel = new Map<string, Map<string, { days: number; sample: string }>>()

const start = new Date(2026, 8, 16)
for (let i = 0; i < 365; i += 1) {
  const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
  const label = e8ScheduleLabel(d)
  const trips = e8TripsFor('fromBarcelona', d)
  const sig = trips.map((t) => t.stops[QC]).join(',')

  if (!byLabel.has(label)) byLabel.set(label, new Map())
  const sigs = byLabel.get(label)!
  const entry = sigs.get(sig) ?? { days: 0, sample: d.toDateString() }
  entry.days += 1
  sigs.set(sig, entry)
}

console.log('label                 distinct bus sets   days/yr   buses')
for (const [label, sigs] of byLabel) {
  for (const [sig, { days, sample }] of sigs) {
    console.log(
      `${label.padEnd(20)} ${String(sigs.size).padStart(6)}   ${String(days).padStart(
        6
      )}   ${String(sig.split(',').filter(Boolean).length).padStart(3)}   e.g. ${sample}`
    )
  }
}

const allSigs = new Map<string, string[]>()
for (const [label, sigs] of byLabel)
  for (const sig of sigs.keys()) allSigs.set(sig, [...(allSigs.get(sig) ?? []), label])

console.log('\nbus sets shared by more than one label (redundant labels):')
let redundant = 0
for (const [, labels] of allSigs)
  if (labels.length > 1) {
    console.log('   ', labels.join(' == '))
    redundant += 1
  }
if (!redundant) console.log('    none')

console.log('\nlabels covering more than one bus set (a missing distinction):')
let missing = 0
for (const [label, sigs] of byLabel)
  if (sigs.size > 1) {
    console.log(`    ${label}: ${sigs.size} different sets`)
    missing += 1
  }
if (!missing) console.log('    none')
