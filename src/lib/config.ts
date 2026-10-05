// 環境設定・定数管理

export const CONFIG = {
  // API・ドメイン設定
  API_BASE: import.meta.env.VITE_API_BASE ?? 'http://localhost:8790',
  APP_BASE: import.meta.env.VITE_APP_BASE ?? 'http://localhost:5173',
  PHP_ORIGIN: import.meta.env.VITE_PHP_ORIGIN ?? 'http://localhost:8083',

  // ページ URL (相対パス使用で自動的に環境に対応)
  PAGES: {
    HOME: '/',
    DASHBOARD: '/dashboard',
    GRAPH: '/graph',
    AWARDS: '/awards',
    GALLERY: '/gallery',
    SEARCH: '/search',
    PROFILE: (uuid: string) => `/${uuid}`,
    SETTINGS: '/settings',
    SETTINGS_API: '/settings_api',
    EXTENSIONS: '/extension',
    PATCHNOTES: '/patchnote',
    HOW_TO_USE: '/howtouse',
    RANKING: '/ranking',
    CLI: '/cli',
    CLI_TOOLS: '/cli',
    R_LINKS: '/r-links',
    NOTIFICATIONS: '/notification',
    FOLDER: '/folder',
    FOLDER_VIEW: (uuid: string, slug: string) => `/${uuid}/folder/${slug}`,
    RECAP: (uuid?: string) => uuid ? `/${uuid}/recap` : '/recap',
    DIFF: (u1?: string, u2?: string) => u1 && u2 ? `/diff?u1=${u1}&u2=${u2}` : '/diff',
    DETAILS: (id: string) => `/details/${id}`,
    SURVEY: (slug?: string) => slug ? `/survey/${slug}` : '/survey',
    DEV: '/dev',
    POLICY: '/policy',
    TERMS: '/terms',
    TOOLS: '/tools',
  },

  // 外部リンク
  EXTERNAL: {
    X_LOGIN: (returnUrl?: string) => `/login${returnUrl ? `?r=${encodeURIComponent(returnUrl)}` : ''}`,
    LOGOUT: '/logout',
    TIMELINE: 'https://timeline.ohatwikeeper.com/',
    PROFILE_CARD: 'https://profilecard.ohatwikeeper.com/',
    STATUS: 'https://status.ohatwikeeper.com',
    DISCORD: 'https://discord.ohatwikeeper.com',
    VRCHAT: 'https://vrc.ohatwikeeper.com',
    TEMPMAIL: 'https://tempmail.ohax.pw/',
    API_DOCS: '/api-docs',
  },
}

/**
 * API エンドポイント URL 生成
 */
export function getApiUrl(endpoint: string): string {
  return `${CONFIG.API_BASE}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`
}

/**
 * 内部ページ URL 生成
 */
export function getPageUrl(page: string | ((p: string) => string), param?: string): string {
  const pagePath = typeof page === 'function' ? page(param || '') : page
  return `${CONFIG.APP_BASE}${pagePath}`
}

/**
 * 外部ページ URL 生成（PHP）
 */
export function getExternalUrl(path: string): string {
  return `${CONFIG.PHP_ORIGIN}${path.startsWith('/') ? path : '/' + path}`
}
