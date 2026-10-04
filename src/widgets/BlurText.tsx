import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'

interface BlurTextProps {
  text: string
  delay?: number
  className?: string
  animateBy?: 'words' | 'letters'
  direction?: 'top' | 'bottom'
  threshold?: number
  rootMargin?: string
  stepDuration?: number
  onAnimationComplete?: () => void
}

function BlurText({
  text = '',
  delay = 200,
  className = '',
  animateBy = 'words',
  direction = 'top',
  threshold = 0.1,
  rootMargin = '0px',
  stepDuration = 0.35,
  onAnimationComplete,
}: BlurTextProps) {
  const elements = animateBy === 'words' ? text.split(' ') : text.split('')
  const [inView, setInView] = useState(false)
  const ref = useRef<HTMLParagraphElement>(null)
  const spansRef = useRef<HTMLSpanElement[]>([])
  const hasAnimatedRef = useRef(false)

  useLayoutEffect(() => {
    const fromY = direction === 'top' ? -50 : 50
    gsap.set(spansRef.current, { filter: 'blur(10px)', opacity: 0, y: fromY })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!ref.current) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.unobserve(ref.current!)
        }
      },
      { threshold, rootMargin }
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [threshold, rootMargin])

  useEffect(() => {
    if (!inView || hasAnimatedRef.current) return
    hasAnimatedRef.current = true
    const rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const spans = spansRef.current
    if (rm) {
      gsap.set(spans, { filter: 'blur(0px)', opacity: 1, y: 0 })
      onAnimationComplete?.()
      return
    }

    const midY = direction === 'top' ? 5 : -5

    const tl = gsap.timeline({
      onComplete: onAnimationComplete,
    })
    spans.forEach((span, i) => {
      tl.to(
        span,
        { filter: 'blur(5px)', opacity: 0.5, y: midY, duration: stepDuration / 2, ease: 'none' },
        (i * delay) / 1000
      ).to(
        span,
        { filter: 'blur(0px)', opacity: 1, y: 0, duration: stepDuration / 2, ease: 'none' },
        (i * delay) / 1000 + stepDuration / 2
      )
    })

    return () => {
      tl.kill()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView])

  return (
    <p ref={ref} className={className} style={{ display: 'flex', flexWrap: 'wrap' }}>
      {elements.map((segment, index) => (
        <span
          key={index}
          ref={(el) => {
            if (el) spansRef.current[index] = el
          }}
          style={{ display: 'inline-block', willChange: 'transform, filter, opacity' }}
        >
          {segment === ' ' ? ' ' : segment}
          {animateBy === 'words' && index < elements.length - 1 && ' '}
        </span>
      ))}
    </p>
  )
}

export default BlurText
