import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import { Wrench } from 'lucide-react'
import PageHeader from '@/components/dashboard-ui/PageHeader'

export default function ToolsPage() {
  const { t: tr } = useTranslation()
  useEffect(() => {
    document.title = tr('tl.listDoc')
  }, [])

  const tools = [
    [
      {
        icon: 'bx-upload',
        title: tr('tl.t1'),
        desc: tr('tl.t1d'),
        url: '/tools/get_tweeturl/',
        badge: tr('tl.t1b'),
      },
      {
        icon: 'bx-search',
        title: tr('tl.t2'),
        desc: tr('tl.t2d'),
        url: '/tools/search_ohatwi/',
        badge: tr('tl.t2b'),
      },
    ]
  ][0]

  return (
    <div className="dash-scope text-d-text py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-8">
<PageHeader icon={Wrench} title={tr('tl.title')} desc={tr('tl.desc')} />

        {/* Tools List */}
        <div className="grid gap-4">
          {tools.map((t, idx) => (
            <a
              key={idx}
              href={t.url}
              className="bg-d-card border border-d-border rounded-xl p-6 hover:border-d-text3 transition-all block group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-d-med text-d-text flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
                  <i className={`bx ${t.icon}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                    <h2 className="text-lg font-bold text-d-text group-hover:text-d-text transition-colors">
                      {t.title}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-d-med text-d-text border border-d-border text-xs font-semibold">
                      {t.badge}
                    </span>
                  </div>
                  <p className="text-sm text-d-text2 leading-relaxed">
                    {t.desc}
                  </p>
                </div>
                <i className="bx bx-chevron-right text-d-text3 group-hover:text-d-text text-2xl shrink-0 self-center transition-colors" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
