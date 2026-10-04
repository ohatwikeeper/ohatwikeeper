import { Children, isValidElement, type ReactNode } from 'react'
import { DOC_SECTIONS, H2, type DocSection } from './sections'

export interface DocPage { section: DocSection; slug: string; title: string; content: ReactNode }

// 章(section)の <H2> ごとにページへ分割する。URL は /howtouse/<章>/<ページ>
const SLUGS: Record<string, string[]> = {
  start: ['about', 'signup', 'first-steps', 'support'],
  pages: ['logged-in', 'public', 'user-pages'],
  dashboard: ['overview', 'register', 'update-timing', 'delete', 'images'],
  analytics: ['graph', 'grass', 'awards', 'ranking'],
  share: ['public-page', 'r-links'],
  organize: ['folders', 'search', 'diff'],
  settings: ['profile', 'sns', 'birthday', 'export'],
  tips: ['palette', 'sidebar', 'terminal'],
  integrations: ['email', 'webhook'],
  'tools-ext': ['extension', 'cli', 'tools'],
  api: ['overview', 'auth', 'endpoints', 'widget'],
  faq: ['usage', 'records', 'privacy', 'bugs'],
}
const text = (n: ReactNode): string => Children.toArray(n).map((c) => (typeof c === 'string' || typeof c === 'number' ? String(c) : isValidElement(c) ? text((c.props as { children?: ReactNode }).children) : '')).join('')

export const CATEGORY_ORDER = ['導入', '基本機能', '高度な機能', '連携・サポート', 'API・開発者向け'] as const

function split(section: DocSection): DocPage[] {
  const kids = Children.toArray((section.content as { props: { children?: ReactNode } }).props.children)
  const groups: { title: string; nodes: ReactNode[] }[] = []
  for (const k of kids) {
    if (isValidElement(k) && k.type === H2) groups.push({ title: text((k.props as { children?: ReactNode }).children), nodes: [] })
    else if (groups.length) groups[groups.length - 1].nodes.push(k)
    else groups.push({ title: section.title, nodes: [k] })
  }
  return groups.map((g, i) => ({ section, slug: SLUGS[section.id]?.[i] ?? `p${i + 1}`, title: g.title, content: <>{g.nodes}</> }))
}

export const DOC_PAGES: DocPage[] = [...DOC_SECTIONS]
  .sort((a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category))
  .flatMap(split)
export const pagesOf = (sectionId: string) => DOC_PAGES.filter((p) => p.section.id === sectionId)
