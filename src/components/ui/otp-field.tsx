import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp'

/** 8桁の数字コード入力(Lapount の認証コード画面と同じ見た目) */
export function OtpField({ value, onChange, disabled, success }: { value: string; onChange: (v: string) => void; disabled?: boolean; success?: boolean }) {
  return (
    <div className="flex justify-center py-1">
      <InputOTP maxLength={8} inputMode="numeric" autoComplete="one-time-code" autoFocus value={value} onChange={onChange} disabled={disabled} success={success}>
        <InputOTPGroup>{[0, 1, 2, 3].map((i) => <InputOTPSlot key={i} index={i} />)}</InputOTPGroup>
        <InputOTPSeparator />
        <InputOTPGroup>{[4, 5, 6, 7].map((i) => <InputOTPSlot key={i} index={i} />)}</InputOTPGroup>
      </InputOTP>
    </div>
  )
}
