/** beta 限定の実験機能を出すか(beta 環境とローカル開発のみ) */
export const IS_BETA = typeof location !== 'undefined' && (location.hostname.startsWith('beta.') || location.hostname === 'localhost')
