const LETTERS: [number, string][] = [
  [400, 'ת'], [300, 'ש'], [200, 'ר'], [100, 'ק'],
  [90, 'צ'], [80, 'פ'], [70, 'ע'], [60, 'ס'], [50, 'נ'], [40, 'מ'], [30, 'ל'], [20, 'כ'], [10, 'י'],
  [9, 'ט'], [8, 'ח'], [7, 'ז'], [6, 'ו'], [5, 'ה'], [4, 'ד'], [3, 'ג'], [2, 'ב'], [1, 'א'],
]

/** 91 → "צא". 15 and 16 are written טו / טז (also inside 115, 116). */
export function hebNum(n: number): string {
  let out = ''
  let rest = n
  for (const [v, l] of LETTERS) {
    while (rest >= v) {
      if (rest === 15 || rest === 16) return out + (rest === 15 ? 'טו' : 'טז')
      out += l
      rest -= v
    }
  }
  return out
}

const VALUE = new Map<string, number>(LETTERS.map(([v, l]) => [l, v]))

/**
 * "פרק קיה" → 115. Sums the letters, so it reads both the old app's spelling (קיה / קיו for 115 / 116)
 * and the proper one (קטו / קטז). Returns NaN when a character isn't a Hebrew numeral letter.
 */
export function parseHebNum(s: string): number {
  const word = s.replace(/^\s*פרק\s*/, '').replace(/["'״׳\s]/g, '')
  if (!word) return NaN
  let sum = 0
  for (const ch of word) {
    const v = VALUE.get(ch)
    if (v === undefined) return NaN
    sum += v
  }
  return sum
}
