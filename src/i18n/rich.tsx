import { Fragment, type ReactNode } from 'react'
import type { TFunction } from 'i18next'

// {{name}} を ReactNode に差し替える(文中にリンクやcodeを入れる用)
export function rich(t: TFunction, key: string, map: Record<string, ReactNode>): ReactNode[] {
  const vals = Object.fromEntries(Object.keys(map).map((k) => [k, `\u0001${k}\u0001`]))
  return String(t(key, vals)).split(/\u0001(\w+)\u0001/).map((s, i) => (i % 2 ? <Fragment key={i}>{map[s]}</Fragment> : s))
}
