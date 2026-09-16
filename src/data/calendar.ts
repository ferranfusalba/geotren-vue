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
const FIXED_HOLIDAYS = [
  '01-01', // Cap d'Any
  '01-06', // Reis
  '05-01', // Festa del Treball
  '06-24', // Sant Joan
  '08-15', // L'Assumpció
  '09-11', // Diada Nacional de Catalunya
  '09-24', // Mare de Déu de la Mercè (local)
  '10-12', // Dia Nacional d'Espanya
  '11-01', // Tots Sants
  '12-06', // Dia de la Constitució
  '12-08', // La Immaculada
  '12-25', // Nadal
  '12-26' //  Sant Esteve
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
const easterHolidays = (year: number) => {
  const easter = easterSunday(year)
  return [iso(shift(easter, -2)), iso(shift(easter, 1)), iso(shift(easter, 50))]
}

const within = (day: string, ranges: { from: string; to: string }[]) =>
  ranges.some((range) => day >= range.from && day <= range.to)

export const isHoliday = (date: Date) =>
  FIXED_HOLIDAYS.includes(iso(date).slice(5)) ||
  easterHolidays(date.getFullYear()).includes(iso(date))

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
