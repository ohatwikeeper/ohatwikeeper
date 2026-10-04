import { useTranslation } from 'react-i18next'
import type { DashboardData } from '@/lib/dashboard/types'
import { dbtn } from '@/components/dashboard-ui/DButton'

export function FlashMessages({ flash }: { flash: DashboardData['flash'] }) {
  return (
    <>
      {flash.message && (
        <div className="mb-8 flex flex-col gap-2 border-l-2 border-d-border p-4 text-d-text">
          {flash.message}
        </div>
      )}
      {flash.error && (
        <div className="mb-8 flex flex-col gap-2 border-l-2 border-d-danger p-4 text-d-danger">
          <p>{flash.error}</p>
        </div>
      )}
    </>
  )
}

export function XLinkPrompt({ csrf }: { csrf: string }) {
  const { t: tr } = useTranslation()
  return (
    <div className="mb-8 border-l-2 border-d-danger p-4 text-d-text">
      <div className="flex items-start gap-4">
        <i className="bx bx-info-circle mt-[0.2rem] text-[2rem] text-d-danger" />
        <div className="grow">
          <h3 className="mb-2 text-[1.1rem] font-semibold text-d-danger">{tr('cn.xTitle')}</h3>
          <p className="mb-4 text-[0.9rem] leading-normal text-d-text2">
            {tr('cn.xBody1')}<br />
            {tr('cn.xBody2')}
          </p>
          <a
            href={`/login?action=login&provider=x&csrf=${encodeURIComponent(csrf)}`}
            className={dbtn('default', '!text-d-text')}
          >
            <i className="bx bxl-xing" />
            {tr('cn.xBtn')}
          </a>
        </div>
      </div>
    </div>
  )
}
