import i18n from '@/i18n'
export class ApiError extends Error {
  code?: string
  status: number
  constructor(message: string, status: number, code?: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

const STATUS_CODES = [400, 401, 403, 404, 408, 429, 500, 502, 503, 504]
const statusMsg = (st: number): string | undefined => (STATUS_CODES.includes(st) ? i18n.t(`ae.${st}`) : undefined)

/** 例外・英語メッセージをユーザー向けの日本語に変換する */
export function friendlyError(e: unknown, fallback = i18n.t('ae.fallback')): string {
  const msg = e instanceof Error ? e.message : typeof e === 'string' ? e : ''
  if (e instanceof ApiError && statusMsg(e.status) && (!msg || /^API error|^[\x00-\x7F]*$/.test(msg))) return statusMsg(e.status)!
  if (/failed to fetch|networkerror|load failed|network request failed|err_/i.test(msg))
    return i18n.t('ae.net')
  if (/timeout|timed out|abort/i.test(msg)) return i18n.t('ae.408')
  if (/oembed|tweet/i.test(msg) && /^[\x00-\x7F]*$/.test(msg)) return i18n.t('ae.tweet')
  if (/unexpected token|is not valid json|json/i.test(msg) && /^[\x00-\x7F]*$/.test(msg)) return i18n.t('ae.json')
  if (msg && /[^\x00-\x7F]/.test(msg)) return msg // すでに日本語
  const m = e instanceof ApiError ? statusMsg(e.status) : undefined
  return m ?? fallback
}

let csrfToken = ''
export const setCsrfToken = (t: string) => { csrfToken = t }
export const csrfHeaders = (): Record<string, string> => ({ 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken })

async function parse(res: Response) {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(data.error || data.message || `API error (${res.status})`, res.status, data.code)
  return data
}

async function safeFetch(url: string, init: RequestInit): Promise<Response> {
  try { return await fetch(url, init) } catch (e) { throw new ApiError(friendlyError(e), 0, 'network') }
}

export async function apiGet<T = unknown>(path: string): Promise<T> {
  return parse(await safeFetch(`/app-api/${path}`, { credentials: 'include' }))
}

export async function apiSend<T = unknown>(
  path: string,
  method: 'POST' | 'DELETE' | 'PATCH',
  body?: unknown,
): Promise<T> {
  return parse(
    await safeFetch(`/app-api/${path}`, {
      method,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  )
}
