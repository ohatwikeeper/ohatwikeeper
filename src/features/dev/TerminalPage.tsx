import { useEffect, useRef, useState, type ReactNode } from 'react'
import i18n from '@/i18n'
import { useDashboard } from '@/lib/dashboard/hooks'

// 実際の `ohax` コマンドと同じ出力(サーバーが curl 向けに返す ANSI テキスト)をブラウザ上のターミナルで表示する
const KEY = 'ohax_term_user'
const HIST_KEY = 'ohax_term_hist'
const LINES_KEY = 'ohax_term_lines'
const load = <T,>(k: string, d: T): T => { try { return JSON.parse(localStorage.getItem(k) ?? '') as T } catch { return d } }
const help = () => `${i18n.t('tm.cmds')}
  ohax [<user>] | ohax profile [<user>]   ${i18n.t('tm.profile')}
  ohax graph|grass|awards|gallery [<user>]
  ohax all [<user>]                        ${i18n.t('tm.all')}
  ohax use <user> | ohax use --clear       ${i18n.t('tm.use')}
  ohax whoami                              ${i18n.t('tm.whoami')}
  clear / clr                              ${i18n.t('tm.clear')}`

type Line = { kind: 'in' | 'out'; text: string }

// ANSI(SGR・24bit色・OSC8リンク)を React 要素へ変換
const ANSI16 = ['#000', '#cd3131', '#0dbc79', '#e5e510', '#2472c8', '#bc3fbc', '#11a8cd', '#e5e5e5', '#666', '#f14c4c', '#23d18b', '#f5f543', '#3b8eea', '#d670d6', '#29b8db', '#fff']
function c256(n: number): string {
  if (n < 16) return ANSI16[n]
  if (n >= 232) { const v = 8 + (n - 232) * 10; return `rgb(${v},${v},${v})` }
  const k = n - 16, f = (x: number) => (x === 0 ? 0 : 55 + x * 40)
  return `rgb(${f(Math.floor(k / 36))},${f(Math.floor(k / 6) % 6)},${f(k % 6)})`
}
// 全角・絵文字は端末と同じ2桁幅の箱に入れて罫線のずれを防ぐ
const isWide = (cp: number) =>
  (cp >= 0x1100 && cp <= 0x115f) || (cp >= 0x2e80 && cp <= 0xa4cf && cp !== 0x303f) || (cp >= 0xac00 && cp <= 0xd7a3) ||
  (cp >= 0xf900 && cp <= 0xfaff) || (cp >= 0xfe30 && cp <= 0xfe6f) || (cp >= 0xff01 && cp <= 0xff60) ||
  (cp >= 0xffe0 && cp <= 0xffe6) || (cp >= 0x1f300 && cp <= 0x1faff) || (cp >= 0x20000 && cp <= 0x3fffd)
function cells(t: string): ReactNode[] {
  const out: ReactNode[] = []
  let buf = ''
  let n = 0
  for (const ch of t) {
    if (isWide(ch.codePointAt(0)!)) {
      if (buf) { out.push(buf); buf = '' }
      out.push(<span key={n++} className="inline-block h-[18px] w-[2ch] overflow-visible text-center align-top leading-[18px]">{ch}</span>)
    } else buf += ch
  }
  if (buf) out.push(buf)
  return out
}
function ansi(text: string): ReactNode[] {
  const out: ReactNode[] = []
  let style: React.CSSProperties = {}
  let href = ''
  const re = /\x1b\[([0-9;]*)m|\x1b\]8;;([^\x1b]*)\x1b\\|([^\x1b]+)/g
  let m: RegExpExecArray | null
  let i = 0
  while ((m = re.exec(text))) {
    if (m[3] !== undefined) {
      const el = <span key={i++} style={style}>{cells(m[3])}</span>
      out.push(href ? <a key={i++} href={href} target="_blank" rel="noreferrer" className="underline">{el}</a> : el)
    } else if (m[2] !== undefined) {
      href = m[2]
    } else {
      const p = m[1] === '' ? [0] : m[1].split(';').map(Number)
      for (let k = 0; k < p.length; k++) {
        const n = p[k]
        if (n === 0) style = {}
        else if (n === 22) { const { fontWeight: _w, opacity: _o, ...rest } = style; style = rest }
        else if (n === 39) { const { color: _c, ...rest } = style; style = rest }
        else if (n === 3) style = { ...style, fontStyle: 'italic' }
        else if (n === 4) style = { ...style, textDecoration: 'underline' }
        else if (n >= 30 && n <= 37) style = { ...style, color: ANSI16[n - 30] }
        else if (n >= 90 && n <= 97) style = { ...style, color: ANSI16[n - 82] }
        else if (n === 38 && p[k + 1] === 5) { style = { ...style, color: c256(p[k + 2]) }; k += 2 }
        else if (n === 1) style = { ...style, fontWeight: 700 }
        else if (n === 2) style = { ...style, opacity: 0.6 }
        else if (n === 36) style = { ...style, color: '#22d3ee' }
        else if (n === 33) style = { ...style, color: '#facc15' }
        else if (n === 38 && p[k + 1] === 2) { style = { ...style, color: `rgb(${p[k + 2]},${p[k + 3]},${p[k + 4]})` }; k += 4 }
      }
    }
  }
  return out
}

export default function TerminalPage() {
  const { data } = useDashboard()
  const self = (data as { account?: { public_uuid?: string } } | undefined)?.account?.public_uuid
  const [lines, setLines] = useState<Line[]>(() => load<Line[]>(LINES_KEY, [{ kind: 'out', text: i18n.t('tm.intro') }]))
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const hist = useRef<string[]>(load<string[]>(HIST_KEY, []))
  const hi = useRef(hist.current.length)
  const box = useRef<HTMLDivElement>(null)
  const get = () => { try { return localStorage.getItem(KEY) || self || '' } catch { return self || '' } }
  useEffect(() => {
    box.current?.scrollTo({ top: box.current.scrollHeight })
    // 出力も保持(容量超過に備え新しい方から約400KB分)
    let size = 0
    const keep: Line[] = []
    for (let i = lines.length - 1; i >= 0; i--) { size += lines[i].text.length; if (size > 400_000) break; keep.unshift(lines[i]) }
    try { localStorage.setItem(LINES_KEY, JSON.stringify(keep)) } catch { /* 保存できなくても動作に影響しない */ }
  }, [lines])

  const cli = async (args: string[]) => {
    const w = Math.floor(((box.current?.clientWidth ?? 800) - 32) / 8.4)
    const r = await fetch(`/app-api/view/term?${args.map((x) => `a=${encodeURIComponent(x)}`).join('&')}&width=${w}`).then((x) => x.json())
    return (r.text as string).replace(/\n+$/, '')
  }

  const run = async (cmd: string) => {
    const add = (text: string) => setLines((l) => [...l, { kind: 'out', text }])
    setLines((l) => [...l, { kind: 'in', text: cmd }])
    const [a, b, c] = cmd.trim().split(/\s+/)
    if (!a) return
    if (a === 'clear' || a === 'clr') { setLines([]); return }
    if (a === 'help') return add(help())
    if (a !== 'ohax') return add(i18n.t('tm.notfound', { a }))
    if (b === 'whoami') return add(get() || i18n.t('tm.unset'))
    if (b === 'use') {
      try {
        if (c === '--clear') { localStorage.removeItem(KEY); return add(i18n.t('tm.cleared')) }
        if (!c) return add('usage: ohax use <user>')
        localStorage.setItem(KEY, c)
        return add(i18n.t('tm.default', { c }))
      } catch { return add(i18n.t('tm.nosave')) }
    }
    setBusy(true)
    try {
      const rest = cmd.trim().split(/\s+/).slice(1)
      const first = rest[0]
      const isCmd = ['graph', 'grass', 'awards', 'gallery', 'all', 'profile'].includes(first)
      const isFlag = !first || first.startsWith('-')
      if (!first || (isFlag && !rest.some((x) => !x.startsWith('-') && !/^\d+$/.test(x)))) {
        if (first === '--help' || first === '-h' || !get()) return add(await cli(['--help']))
        return add(await cli([get(), ...rest]))
      }
      const hasUser = rest.slice(isCmd ? 1 : 0).some((x, i, arr) => !x.startsWith('-') && !/^\d+$/.test(x) && !(i > 0 && arr[i - 1].startsWith('-')))
      add(await cli(!isCmd || hasUser ? rest : [...rest, get()].filter(Boolean)))
    } finally { setBusy(false) }
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const v = input
    setInput('')
    if (v.trim()) {
      if (hist.current[hist.current.length - 1] !== v) hist.current.push(v)
      hist.current = hist.current.slice(-200)
      try { localStorage.setItem(HIST_KEY, JSON.stringify(hist.current)) } catch { /* 保存できなくても動作に影響しない */ }
    }
    hi.current = hist.current.length
    void run(v)
  }
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp' && hi.current > 0) { e.preventDefault(); setInput(hist.current[--hi.current]) }
    else if (e.key === 'ArrowDown') { e.preventDefault(); hi.current = Math.min(hist.current.length, hi.current + 1); setInput(hist.current[hi.current] ?? '') }
  }

  return (
    <div className="pt-6">
      <div ref={box} onClick={() => document.getElementById('term-in')?.focus()} className="h-[calc(100vh-6rem)] overflow-auto rounded-xl border border-[var(--arc-border)] bg-[#0b0d10] p-4 font-mono text-[13px] [font-variant-ligatures:none] leading-snug text-[#d4d4d4]">
        {lines.map((l, i) => l.kind === 'in'
          ? <div key={i}><span className="text-[#22d3ee]">$</span> {l.text}</div>
          : <pre key={i} className="m-0 whitespace-pre font-[inherit]">{ansi(l.text)}</pre>)}
        <form onSubmit={submit} className="flex gap-2">
          <span className="text-[#22d3ee]">$</span>
          <input id="term-in" autoFocus value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKey} disabled={busy} spellCheck={false} autoComplete="off" className="min-w-0 flex-1 border-0 bg-transparent p-0 text-inherit outline-none" />
        </form>
      </div>
    </div>
  )
}
