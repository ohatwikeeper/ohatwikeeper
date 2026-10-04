import type { ComponentType, ReactNode } from 'react'

// サイト共通のフラットな見出し: アイコン+タイトル+説明、下に区切り線
export default function PageHeader({ icon: Icon, iconNode, title, desc, right }: { icon?: ComponentType<{ className?: string }>; iconNode?: ReactNode; title: ReactNode; desc?: ReactNode; right?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-d-border pb-4">
      <div>
        <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-d-text">
          {Icon ? <Icon className="size-6 text-d-text2" /> : iconNode}{title}
        </h1>
        {desc && <p className="mt-1.5 text-sm text-d-text3">{desc}</p>}
      </div>
      {right}
    </header>
  )
}
