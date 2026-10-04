import { useLocation, useNavigate } from 'react-router-dom'
import { useGlimm } from 'glimm/react'
import type { SweepOptions } from 'glimm/react'
import type { AnchorHTMLAttributes } from 'react'

interface GlimmLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string
  sweepOptions?: SweepOptions
}

export default function GlimmLink({ to, onClick, children, sweepOptions, ...rest }: GlimmLinkProps) {
  const navigate = useNavigate()
  const { sweep } = useGlimm()
  const { pathname } = useLocation()

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
    e.preventDefault()
    onClick?.(e)
    // オーロラ演出はトップページ発の遷移だけ
    if (pathname !== '/') navigate(to)
    else sweep(() => navigate(to), sweepOptions)
  }

  return (
    <a href={to} onClick={handleClick} {...rest}>
      {children}
    </a>
  )
}
