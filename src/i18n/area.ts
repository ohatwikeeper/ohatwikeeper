/** 言語の並び。areas/*.ts の各行はこの順に10言語ぶんの訳を持つ(タプル長で抜けを型エラーにする) */
export const LANG_ORDER = ['ja', 'en', 'ko', 'de', 'fr', 'es', 'zh', 'pt', 'it', 'ru'] as const
export type Row = readonly [string, string, string, string, string, string, string, string, string, string]

/** キー別の訳(10言語タプル)を、言語別の辞書へ変換する */
export function defineArea(rows: Record<string, Row>): Record<(typeof LANG_ORDER)[number], Record<string, string>> {
  const out = Object.fromEntries(LANG_ORDER.map((l) => [l, {} as Record<string, string>])) as Record<(typeof LANG_ORDER)[number], Record<string, string>>
  for (const [key, row] of Object.entries(rows)) LANG_ORDER.forEach((l, i) => { out[l][key] = row[i] })
  return out
}
