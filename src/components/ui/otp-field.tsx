import { useEffect, useRef } from 'react'
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp'

/** 8桁の数字コード入力(Lapount の認証コード画面と同じ見た目) */
export function OtpField({ value, onChange, disabled, success, onComplete, error }: { error?: string | null; value: string; onChange: (v: string) => void; disabled?: boolean; success?: boolean; onComplete?: () => void }) {
  const box = useRef<HTMLDivElement>(null)
  const was = useRef(disabled)
  useEffect(() => {
    if (was.current && !disabled) window.setTimeout(() => box.current?.querySelector('input')?.focus(), 0)
    was.current = disabled
  }, [disabled])
  return (
    <div ref={box} className="flex w-full min-w-0 flex-col items-center gap-2 py-1">
      <div key={error ? 'e' : 'n'} className={error ? 'otp-err max-w-full' : 'max-w-full'}>
      <InputOTP aria-invalid={error ? true : undefined} maxLength={8} inputMode="numeric" autoComplete="one-time-code" autoFocus pasteTransformer={(s) => s.replace(/\D/g, "")} value={value} onChange={onChange} onComplete={onComplete ? () => window.setTimeout(onComplete, 0) : undefined} disabled={disabled} success={success}>
        <InputOTPGroup>{[0, 1, 2, 3].map((i) => <InputOTPSlot key={i} index={i} />)}</InputOTPGroup>
        <InputOTPSeparator />
        <InputOTPGroup>{[4, 5, 6, 7].map((i) => <InputOTPSlot key={i} index={i} />)}</InputOTPGroup>
      </InputOTP>
      </div>
      <p className={`text-xs text-red-400 transition-all duration-300 ${error ? 'max-h-6 translate-y-0 opacity-100' : 'max-h-0 -translate-y-1 opacity-0'}`} role="alert">{error || ' '}</p>
    </div>
  )
}
