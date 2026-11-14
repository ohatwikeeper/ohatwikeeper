// サーバーが持つ権限・共有項目の一覧(画面のトグルとサーバーの判定をずらさないため、毎回サーバーから取る)
export type Catalog = { api_scopes: string[]; share_fields: string[] }
let cache: Promise<Catalog> | null = null
export const loadCatalog = () => (cache ??= fetch('/app-api/r-links/meta/catalog', { credentials: 'include' })
  .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
  .catch((e) => { cache = null; throw e }))

const OPS = ['read', 'create', 'update', 'delete']
const DATA = ['stats', 'logs', 'cities', 'bots', 'csv', 'qr']
export function scopeGroups(ids: string[], t: (k: string) => string) {
  return [
    { title: t('rs.gOps'), ids: ids.filter((x) => OPS.includes(x)) },
    { title: t('rs.gData'), ids: ids.filter((x) => DATA.includes(x)) },
    { title: t('rs.gFields'), ids: ids.filter((x) => !OPS.includes(x) && !DATA.includes(x)) },
  ]
}
