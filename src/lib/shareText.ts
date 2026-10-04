import type { TFunction } from 'i18next'

const TAG = '\n#おはツイKeeper'

/** ページごとの「Xでシェア」文面。name はプロフィールページのときだけ渡す */
export function shareText(t: TFunction, pathname: string, name?: string): string {
  const p = pathname.replace(/\/+$/, '')
  const sub = p.split('/')[2] // /:uuid/<sub>
  if (name) {
    if (!sub) return t('nb.shareText', { name })
    const k = ({ graph: 'st.graph', gallery: 'st.gallery', recap: 'st.recap', folder: 'st.folder' } as Record<string, string>)[sub]
    return k ? t(k, { name }) + TAG : t('nb.shareText', { name })
  }
  const first = p.split('/')[1] ?? ''
  const key =
    first === 'ranking' ? 'st.ranking' : first === 'search' ? 'st.search' : first === 'diff' ? 'st.diff' : first === 'survey' ? 'st.survey'
    : first === 'patchnote' ? 'st.patch'
    : ['howtouse', 'cli', 'extensions', 'tools', 'terminal', 'dev', 'terms', 'policy'].includes(first) ? 'st.guide'
    : 'st.home'
  return t(key) + TAG
}
