import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import { Puzzle } from 'lucide-react'
import PageHeader from '@/components/dashboard-ui/PageHeader'
import { CONFIG } from '@/lib/config'

export default function ExtensionsPage() {
  const { t: tr } = useTranslation()
  useEffect(() => {
    document.title = tr('ex.doc')
  }, [])

  return (
    <div className="dash-scope min-h-screen bg-d-bg text-d-text py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Hero Section */}
        <div className="pb-2">
          <PageHeader icon={Puzzle} title={tr('ex.title')} desc={tr('ex.desc')} />
          <div className="mt-6 flex flex-wrap gap-4 justify-center sm:justify-start">
            <a
              href="https://chromewebstore.google.com/detail/ohatwikeeper/..."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-d-text !text-d-bg font-bold text-sm hover:opacity-90 transition-opacity"
            >
              <i className="bx bxl-chrome text-lg" /> {tr('ex.chrome')}
            </a>
            <a
              href="https://addons.mozilla.org/ja/firefox/addon/ohatwikeeper/..."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-d-card border border-d-border hover:border-d-text3 text-d-text font-bold text-sm transition-colors"
            >
              <i className="bx bxl-firefox text-lg" /> {tr('ex.firefox')}
            </a>
          </div>
        </div>

        {/* Benefits Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-d-text text-center sm:text-left">
            {tr('ex.merits')}
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="bg-d-card border border-d-border rounded-xl p-6 flex flex-col">
              <div className="w-12 h-12 rounded-xl bg-d-med text-d-text flex items-center justify-center text-2xl mb-4 shrink-0">
                <i className="bx bx-mouse" />
              </div>
              <h3 className="text-lg font-bold text-d-text mb-2">{tr('ex.m1t')}</h3>
              <p className="text-sm text-d-text2 leading-relaxed">
                {tr('ex.m1d')}
              </p>
            </div>

            <div className="bg-d-card border border-d-border rounded-xl p-6 flex flex-col">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 text-green-400 flex items-center justify-center text-2xl mb-4 shrink-0">
                <i className="bx bx-bolt-circle" />
              </div>
              <h3 className="text-lg font-bold text-d-text mb-2">{tr('ex.m2t')}</h3>
              <p className="text-sm text-d-text2 leading-relaxed">
                {tr('ex.m2d')}
              </p>
            </div>

            <div className="bg-d-card border border-d-border rounded-xl p-6 flex flex-col">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center text-2xl mb-4 shrink-0">
                <i className="bx bx-slider-alt" />
              </div>
              <h3 className="text-lg font-bold text-d-text mb-2">{tr('ex.m3t')}</h3>
              <p className="text-sm text-d-text2 leading-relaxed">
                {tr('ex.m3d')}
              </p>
            </div>
          </div>
        </section>

        {/* Installation Steps */}
        <section className="bg-d-card border border-d-border rounded-xl p-6 sm:p-8">
          <h2 className="text-xl font-bold text-d-text mb-6 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-d-med text-d-text flex items-center justify-center text-sm font-bold">1</span>
            {tr('ex.steps')}
          </h2>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-d-med border border-d-border text-d-text font-bold text-sm flex items-center justify-center shrink-0 mt-0.5">
                1
              </div>
              <div>
                <h3 className="font-bold text-d-text mb-1">{tr('ex.s1t')}</h3>
                <p className="text-sm text-d-text2 leading-relaxed">
                  {tr('ex.s1d')}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-d-med border border-d-border text-d-text font-bold text-sm flex items-center justify-center shrink-0 mt-0.5">
                2
              </div>
              <div>
                <h3 className="font-bold text-d-text mb-1">{tr('ex.s2t')}</h3>
                <p className="text-sm text-d-text2 leading-relaxed">
                  {tr('ex.s2d')}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-d-med border border-d-border text-d-text font-bold text-sm flex items-center justify-center shrink-0 mt-0.5">
                3
              </div>
              <div>
                <h3 className="font-bold text-d-text mb-1">{tr('ex.s3t')}</h3>
                <p className="text-sm text-d-text2 leading-relaxed">
                  {tr('ex.s3a')}
                  <Link to={CONFIG.PAGES.SETTINGS} className="text-d-text2 mx-1 hover:text-d-text">
                    {tr('ex.s3l')}
                  </Link>
                  {tr('ex.s3b')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-d-card border border-d-border rounded-xl p-6 sm:p-8">
          <h2 className="text-xl font-bold text-d-text mb-6 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-d-med text-d-text flex items-center justify-center text-sm font-bold">2</span>
            {tr('ex.faq')}
          </h2>

          <div className="space-y-5 text-sm">
            <div>
              <h3 className="font-bold text-d-text mb-1 flex items-center gap-2">
                <span className="text-d-text font-bold">Q.</span> {tr('ex.q1')}
              </h3>
              <p className="text-d-text2 ml-5">
                {tr('ex.a1')}
              </p>
            </div>

            <div className="border-t border-d-border/60 pt-4">
              <h3 className="font-bold text-d-text mb-1 flex items-center gap-2">
                <span className="text-d-text font-bold">Q.</span> {tr('ex.q2')}
              </h3>
              <p className="text-d-text2 ml-5">
                {tr('ex.a2')}
              </p>
            </div>

            <div className="border-t border-d-border/60 pt-4">
              <h3 className="font-bold text-d-text mb-1 flex items-center gap-2">
                <span className="text-d-text font-bold">Q.</span> {tr('ex.q3')}
              </h3>
              <p className="text-d-text2 ml-5">
                {tr('ex.a3a')}
                <Link to={CONFIG.PAGES.SETTINGS} className="text-d-text2 mx-1 hover:text-d-text">
                  {tr('ex.a3l')}
                </Link>
                {tr('ex.a3b')}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
