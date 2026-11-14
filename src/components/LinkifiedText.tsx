import { Fragment } from 'react'

// @handle -> x.com/handle, #tag -> x.com/hashtag/tag
const RE = /(^|[^\w@#＠＃/])([@＠][A-Za-z0-9_]{1,15}|[#＃][^\s#＃@＠!-/:-@[-^`{-~、。，．！？!?「」『』（）()【】]+)/g

export function LinkifiedText({ text }: { text: string }) {
  const out: React.ReactNode[] = []
  let last = 0
  let i = 0
  for (const m of text.matchAll(RE)) {
    const start = (m.index ?? 0) + m[1].length
    const tok = m[2]
    if (start > last) out.push(<Fragment key={`t${i}`}>{text.slice(last, start)}</Fragment>)
    const body = tok.slice(1)
    const href = tok[0] === '@' || tok[0] === '＠'
      ? `https://x.com/${body}`
      : `https://x.com/hashtag/${encodeURIComponent(body)}`
    out.push(
      <a key={`a${i++}`} href={href} target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:underline">
        {tok}
      </a>,
    )
    last = start + tok.length
  }
  if (last < text.length) out.push(<Fragment key="end">{text.slice(last)}</Fragment>)
  return <>{out}</>
}
