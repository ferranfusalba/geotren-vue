/**
 * Hand-maintained calendar — unlike the other files in this folder, this one is
 * edited by hand, not generated.
 *
 * The FGC side does not need it: the API reports the service actually running, and
 * detectDayType scores it against the three printed patterns. The e8 has no API at
 * all, so which of its four timetables applies can only come from a calendar.
 *
 * Sources:
 *  - Holidays: https://ajuntament.barcelona.cat/calendarifestius/ca/
 *  - School year: the Generalitat calendar, as reported by Betevé for 2026-27.
 *
 * The Easter-derived holidays are computed rather than listed, so they never go
 * stale. SCHOOL_* is what needs replacing each summer.
 */
import type { E8DayType } from '@/data/e8Timetable'

/**
 * Barcelona's working holidays that fall on the same date every year, as MM-DD.
 *
 * The council's own list drops any that land on a Sunday in a given year, which
 * is why it shows fourteen entries rather than this many; that distinction does
 * not matter here, because a Sunday already runs the Sunday timetable.
 */
const FIXED_HOLIDAYS: { day: string; name: string }[] = [
  { day: '01-01', name: "Cap d'Any" },
  { day: '01-06', name: 'Reis' },
  { day: '05-01', name: 'Festa del Treball' },
  { day: '06-24', name: 'Sant Joan' },
  { day: '08-15', name: "L'Assumpció" },
  { day: '09-11', name: 'Diada Nacional de Catalunya' },
  { day: '09-24', name: 'Mare de Déu de la Mercè' },
  { day: '10-12', name: "Dia Nacional d'Espanya" },
  { day: '11-01', name: 'Tots Sants' },
  { day: '12-06', name: 'Dia de la Constitució' },
  { day: '12-08', name: 'La Immaculada' },
  { day: '12-25', name: 'Nadal' },
  { day: '12-26', name: 'Sant Esteve' }
]

/** The three days the e8 runs its own reduced timetable for. */
const CHRISTMAS_DATES = [
  '12-25', // Nadal
  '12-26', // Sant Esteve
  '01-01' //  Cap d'any
]

/**
 * The 2026-27 school year. Only the fourteen "dies lectius" expeditions depend on
 * any of this; everything else runs regardless.
 *
 * REPLACE EACH SUMMER. Betevé flagged these as provisional pending the
 * Departament d'Educació's official calendar, so they are worth re-checking.
 */
export const SCHOOL_TERMS = [
  { from: '2026-09-08', to: '2026-12-21' },
  { from: '2027-01-08', to: '2027-06-21' }
]

/** Breaks that fall inside a term. Christmas is already a gap between terms. */
export const SCHOOL_BREAKS = [
  { from: '2027-03-20', to: '2027-03-29' } // Setmana Santa
]

/** Barcelona's days of free disposal — term time, but no school. */
export const SCHOOL_FREE_DAYS = [
  '2026-10-30', // La Castanyada
  '2026-12-07', // pont de la Immaculada
  '2027-02-08', // Carnaval
  '2027-05-14' // Segona Pasqua
]

/** The anonymous Gregorian algorithm; returns Easter Sunday for a given year. */
const easterSunday = (year: number) => {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

const iso = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`

const shift = (date: Date, days: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)

/**
 * The three holidays that hang off Easter: Divendres Sant, Dilluns de Pasqua
 * Florida, and Dilluns de Pasqua Granada, which is a Barcelona local holiday and
 * moves with the rest — 25 May in 2026, 17 May in 2027.
 */
const easterHolidays = (year: number): Holiday[] => {
  const easter = easterSunday(year)
  return [
    { date: shift(easter, -2), name: 'Divendres Sant' },
    { date: shift(easter, 1), name: 'Dilluns de Pasqua Florida' },
    { date: shift(easter, 50), name: 'Dilluns de Pasqua Granada' }
  ]
}

/** One day off, by the name the council gives it. */
export interface Holiday {
  date: Date
  name: string
}

/**
 * Every holiday of a year, in order — the fixed ones and the three that move
 * with Easter.
 *
 * This is the list the rest of the app decides days by, so showing it is how the
 * hand-written calendar can be checked against the council's own.
 */
export const holidaysIn = (year: number): Holiday[] =>
  [
    ...FIXED_HOLIDAYS.map(({ day, name }) => ({
      date: new Date(year, Number(day.slice(0, 2)) - 1, Number(day.slice(3))),
      name
    })),
    ...easterHolidays(year)
  ].sort((a, b) => a.date.getTime() - b.date.getTime())

const within = (day: string, ranges: { from: string; to: string }[]) =>
  ranges.some((range) => day >= range.from && day <= range.to)

export const isHoliday = (date: Date) =>
  FIXED_HOLIDAYS.some((holiday) => holiday.day === iso(date).slice(5)) ||
  easterHolidays(date.getFullYear()).some((holiday) => iso(holiday.date) === iso(date))

/** A weekday that is not a public holiday — the poster's "feiner". */
export const isWorkingDay = (date: Date) =>
  date.getDay() !== 0 && date.getDay() !== 6 && !isHoliday(date)

/**
 * Whether the FGC poster's Ⓤ trips run: "Circula els divendres feiners i els
 * dies feiners vigílies de festius".
 *
 * They are small-hours trips, so the date is the service day they belong to —
 * the Friday you board on, not the Saturday you arrive on.
 *
 * A Saturday is not a festiu, so the eve rule only ever adds working days before
 * a public holiday; the eve of a Sunday is a Saturday, which is not feiner.
 */
export const runsFridayEve = (date: Date) =>
  isWorkingDay(date) && (date.getDay() === 5 || isHoliday(shift(date, 1)))

/** One of the three days the e8 runs its reduced Christmas service. */
export const isChristmasService = (date: Date) => CHRISTMAS_DATES.includes(iso(date).slice(5))

/** A day schools are actually open: in term, and not a break, free day or holiday. */
export const isSchoolDay = (date: Date) => {
  const day = iso(date)
  const weekend = date.getDay() === 0 || date.getDay() === 6

  return (
    !weekend &&
    !isHoliday(date) &&
    within(day, SCHOOL_TERMS) &&
    !within(day, SCHOOL_BREAKS) &&
    !SCHOOL_FREE_DAYS.includes(day)
  )
}

/** Which of the e8's four printed timetables applies on a given date. */
export const e8DayType = (date: Date): E8DayType => {
  if (isChristmasService(date)) return 'christmas'
  if (date.getDay() === 0 || isHoliday(date)) return 'sundayHoliday'
  if (date.getDay() === 6) return 'saturday'
  return 'weekday'
}
