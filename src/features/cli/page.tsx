import { useTranslation } from 'react-i18next'
import { rich } from '@/i18n/rich'
import { useState, useEffect } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Terminal } from 'lucide-react'
import PageHeader from '@/components/dashboard-ui/PageHeader'
import { CONFIG } from '@/lib/config'
import { Tabs, TabsList, TabsTrigger } from '@/components/arc/tabs/tabs'

export default function CLIPage() {
  const { t: tr } = useTranslation()
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'npm' | 'sh' | 'go' | 'win'>('npm')

  useEffect(() => {
    document.title = tr('cl.doc')
  }, [])

  function copy(text: string, index: number) {
    navigator.clipboard?.writeText(text).then(() => {
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 1600)
    })
  }

  const installNpm = `npm i -g @lapius/ohatwikeeper-cli`
  const runNpx = `npx @lapius/ohatwikeeper-cli <user>`
  const installSh = `curl -fsSL ${CONFIG.APP_BASE}/cli/install.sh | bash`
  const installGo = `go install github.com/lapius7/ohatwikeeper-cli/cmd/ohax@latest`

  return (
    <div className="dash-scope min-h-screen bg-d-bg text-d-text py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-10">
        <PageHeader icon={Terminal} title={<><span className="font-mono">ohax</span> {tr('cl.title')}</>} desc={tr('cl.desc')} />

        {/* Install Section */}
        <section className="bg-d-card border border-d-border rounded-xl p-6 sm:p-8">
          <h2 className="text-xl font-bold text-d-text mb-4 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-d-med text-d-text flex items-center justify-center text-sm font-bold">1</span>
            {tr('cl.install')}
          </h2>

          {/* OS Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="mb-6">
            <TabsList aria-label={tr('cl.method')}>
              <TabsTrigger value="npm">{tr('cl.npmRec')}</TabsTrigger>
              <TabsTrigger value="sh">Linux / macOS (curl)</TabsTrigger>
              <TabsTrigger value="go">Go (go install)</TabsTrigger>
              <TabsTrigger value="win">Windows</TabsTrigger>
            </TabsList>
          </Tabs>

          {activeTab === 'npm' && (
            <div className="space-y-4">
              <div>
                <div className="text-xs font-bold text-d-text mb-2">{tr('cl.global')}</div>
                <div className="flex items-center justify-between bg-d-med/80 border border-d-border rounded-xl p-4 font-mono text-sm">
                  <span className="text-d-text select-all overflow-x-auto">{installNpm}</span>
                  <button
                    onClick={() => copy(installNpm, 0)}
                    className="ml-3 px-3 py-1.5 rounded-lg bg-d-card border border-d-border text-d-text hover:border-d-text3 text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors"
                  >
                    <i className={`bx ${copiedIndex === 0 ? 'bx-check text-green-400' : 'bx-copy'}`} />
                    {copiedIndex === 0 ? tr('cl.copied') : tr('cl.copy')}
                  </button>
                </div>
              </div>

              <div>
                <div className="text-xs font-bold text-d-text mb-2">{tr('cl.npx')}</div>
                <div className="flex items-center justify-between bg-d-med/80 border border-d-border rounded-xl p-4 font-mono text-sm">
                  <span className="text-d-text2 select-all overflow-x-auto">{runNpx}</span>
                  <button
                    onClick={() => copy(runNpx, 99)}
                    className="ml-3 px-3 py-1.5 rounded-lg bg-d-card border border-d-border text-d-text hover:border-d-text3 text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors"
                  >
                    <i className={`bx ${copiedIndex === 99 ? 'bx-check text-green-400' : 'bx-copy'}`} />
                    {copiedIndex === 99 ? tr('cl.copied') : tr('cl.copy')}
                  </button>
                </div>
              </div>

              <p className="text-xs text-d-text3">
                {tr('cl.npmNote')}
              </p>
            </div>
          )}

          {activeTab === 'sh' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-d-med/80 border border-d-border rounded-xl p-4 font-mono text-sm">
                <span className="text-d-text select-all overflow-x-auto">{installSh}</span>
                <button
                  onClick={() => copy(installSh, 1)}
                  className="ml-3 px-3 py-1.5 rounded-lg bg-d-card border border-d-border text-d-text hover:border-d-text3 text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors"
                >
                  <i className={`bx ${copiedIndex === 1 ? 'bx-check text-green-400' : 'bx-copy'}`} />
                  {copiedIndex === 1 ? tr('cl.copied') : tr('cl.copy')}
                </button>
              </div>
              <p className="text-xs text-d-text3">
                {rich(tr, 'cl.binNote', { p: <code className="text-d-text">~/.local/bin/ohax</code> })}
              </p>
            </div>
          )}

          {activeTab === 'go' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-d-med/80 border border-d-border rounded-xl p-4 font-mono text-sm">
                <span className="text-d-text select-all overflow-x-auto">{installGo}</span>
                <button
                  onClick={() => copy(installGo, 2)}
                  className="ml-3 px-3 py-1.5 rounded-lg bg-d-card border border-d-border text-d-text hover:border-d-text3 text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors"
                >
                  <i className={`bx ${copiedIndex === 2 ? 'bx-check text-green-400' : 'bx-copy'}`} />
                  {copiedIndex === 2 ? tr('cl.copied') : tr('cl.copy')}
                </button>
              </div>
              <p className="text-xs text-d-text3">
                {rich(tr, 'cl.goNote', { p: <code className="text-d-text">$(go env GOPATH)/bin</code> })}
              </p>
            </div>
          )}

          {activeTab === 'win' && (
            <div className="space-y-3 text-sm text-d-text2">
              <p>
                {rich(tr, 'cl.winA', { f: <code className="text-d-text">ohax-windows-amd64.exe</code> })}
                {rich(tr, 'cl.winB', { f: <code className="text-d-text">ohax.exe</code> })}
              </p>
              <div className="pt-2">
                <a
                  href="https://github.com/Lapius7/ohatwikeeper-cli/releases"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-d-text !text-d-bg font-semibold text-xs hover:opacity-90 transition-opacity"
                >
                  <i className="bx bxl-github" /> {tr('cl.dl')}
                </a>
              </div>
            </div>
          )}
        </section>

        {/* Usage Section */}
        <section className="bg-d-card border border-d-border rounded-xl p-6 sm:p-8">
          <h2 className="text-xl font-bold text-d-text mb-4 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-d-med text-d-text flex items-center justify-center text-sm font-bold">2</span>
            {tr('cl.basic')}
          </h2>
          <p className="text-sm text-d-text2 mb-4 leading-relaxed">
            {rich(tr, 'cl.userNote', { u: <code className="text-d-text font-mono">&lt;user&gt;</code>, p: <code className="text-d-text font-mono">public_uuid</code>, e: <code className="text-d-text font-mono">ohatwikeeper.com/xxxxx</code>, x: <code className="text-d-text font-mono">xxxxx</code> })}
          </p>

          <div className="grid sm:grid-cols-2 gap-3 font-mono text-xs">
            <div className="p-3.5 bg-d-med/60 border border-d-border rounded-xl">
              <div className="text-d-text3 mb-1">{tr('cl.cProfile')}</div>
              <code className="text-d-text font-bold">ohax &lt;user&gt;</code>
            </div>
            <div className="p-3.5 bg-d-med/60 border border-d-border rounded-xl">
              <div className="text-d-text3 mb-1">{tr('cl.cGraph')}</div>
              <code className="text-d-text font-bold">ohax graph &lt;user&gt;</code>
            </div>
            <div className="p-3.5 bg-d-med/60 border border-d-border rounded-xl">
              <div className="text-d-text3 mb-1">{tr('cl.cGrass')}</div>
              <code className="text-d-text font-bold">ohax grass &lt;user&gt;</code>
            </div>
            <div className="p-3.5 bg-d-med/60 border border-d-border rounded-xl">
              <div className="text-d-text3 mb-1">{tr('cl.cAwards')}</div>
              <code className="text-d-text font-bold">ohax awards &lt;user&gt;</code>
            </div>
            <div className="p-3.5 bg-d-med/60 border border-d-border rounded-xl">
              <div className="text-d-text3 mb-1">{tr('cl.cGallery')}</div>
              <code className="text-d-text font-bold">ohax gallery &lt;user&gt;</code>
            </div>
            <div className="p-3.5 bg-d-med/60 border border-d-border rounded-xl">
              <div className="text-d-text3 mb-1">{tr('cl.cAll')}</div>
              <code className="text-d-text font-bold">ohax all &lt;user&gt;</code>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-d-border">
            <h3 className="text-sm font-bold text-d-text mb-2">{tr('cl.useTitle')}</h3>
            <p className="text-xs text-d-text2 mb-3">
              {rich(tr, 'cl.useDesc', { c: <code className="text-d-text font-mono">ohax use &lt;user&gt;</code> })}
            </p>
            <div className="bg-d-med/80 border border-d-border rounded-xl p-3 font-mono text-xs text-d-text2 space-y-1">
              <div><span className="text-d-text3">$</span> ohax use your_public_uuid <span className="text-d-text3">{tr('cl.cUse')}</span></div>
              <div><span className="text-d-text3">$</span> ohax profile <span className="text-d-text3">{tr('cl.cProf2')}</span></div>
              <div><span className="text-d-text3">$</span> ohax whoami <span className="text-d-text3">{tr('cl.cWho')}</span></div>
              <div><span className="text-d-text3">$</span> ohax use --clear <span className="text-d-text3">{tr('cl.cClear')}</span></div>
            </div>
          </div>
        </section>

        {/* Curl Preview Section */}
        <section className="bg-d-card border border-d-border rounded-xl p-6 sm:p-8">
          <h2 className="text-xl font-bold text-d-text mb-4 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-d-med text-d-text flex items-center justify-center text-sm font-bold">3</span>
            {tr('cl.curlTitle')}
          </h2>
          <p className="text-sm text-d-text2 mb-4 leading-relaxed">
            {rich(tr, 'cl.curlDesc', { c: <code className="text-d-text font-mono">curl</code> })}
          </p>

          <div className="bg-d-med/80 border border-d-border rounded-xl p-4 font-mono text-xs text-d-text2 space-y-2 overflow-x-auto">
            <div><span className="text-d-text3">$</span> curl https://&lt;uuid&gt;.ohax.pw <span className="text-d-text3">{tr('cl.uProfile')}</span></div>
            <div><span className="text-d-text3">$</span> curl https://&lt;uuid&gt;.ohax.pw/graph <span className="text-d-text3">{tr('cl.uGraph')}</span></div>
            <div><span className="text-d-text3">$</span> curl https://&lt;uuid&gt;.ohax.pw/grass <span className="text-d-text3">{tr('cl.uGrass')}</span></div>
            <div><span className="text-d-text3">$</span> curl https://&lt;uuid&gt;.ohax.pw/awards <span className="text-d-text3">{tr('cl.uAwards')}</span></div>
          </div>
        </section>

        {/* Command Reference Table */}
        <section className="bg-d-card border border-d-border rounded-xl p-6 sm:p-8">
          <h2 className="text-xl font-bold text-d-text mb-4 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-d-med text-d-text flex items-center justify-center text-sm font-bold">4</span>
            {tr('cl.cmds')}
          </h2>
          
          <div className="overflow-x-auto">
            <Table className="w-full text-left text-xs text-d-text2 border-collapse">
              <TableHeader>
                <TableRow className="border-b border-d-border text-d-text font-semibold">
                  <TableHead className="py-2.5 px-3">{tr('cl.hCmd')}</TableHead>
                  <TableHead className="py-2.5 px-3">{tr('cl.hDesc')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-d-border/60">
                <TableRow>
                  <TableCell className="py-2.5 px-3 font-mono text-d-text font-semibold">ohax &lt;user&gt;, ohax profile</TableCell>
                  <TableCell className="py-2.5 px-3">{tr('cl.dProfile')}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="py-2.5 px-3 font-mono text-d-text font-semibold">ohax graph [&lt;user&gt;]</TableCell>
                  <TableCell className="py-2.5 px-3">{tr('cl.dGraph')}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="py-2.5 px-3 font-mono text-d-text font-semibold">ohax grass [&lt;user&gt;]</TableCell>
                  <TableCell className="py-2.5 px-3">{tr('cl.dGrass')}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="py-2.5 px-3 font-mono text-d-text font-semibold">ohax awards [&lt;user&gt;]</TableCell>
                  <TableCell className="py-2.5 px-3">{tr('cl.dAwards')}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="py-2.5 px-3 font-mono text-d-text font-semibold">ohax gallery [&lt;user&gt;]</TableCell>
                  <TableCell className="py-2.5 px-3">{tr('cl.dGallery')}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="py-2.5 px-3 font-mono text-d-text font-semibold">ohax rss [&lt;user&gt;]</TableCell>
                  <TableCell className="py-2.5 px-3">{tr('cl.dRss')}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="py-2.5 px-3 font-mono text-d-text font-semibold">ohax all [&lt;user&gt;]</TableCell>
                  <TableCell className="py-2.5 px-3">{tr('cl.dAll')}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="py-2.5 px-3 font-mono text-d-text font-semibold">ohax open [&lt;page&gt;]</TableCell>
                  <TableCell className="py-2.5 px-3">{tr('cl.dOpen')}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="py-2.5 px-3 font-mono text-d-text font-semibold">ohax url [&lt;page&gt;]</TableCell>
                  <TableCell className="py-2.5 px-3">{tr('cl.dUrl')}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <div className="mt-6 pt-6 border-t border-d-border">
            <h3 className="text-sm font-bold text-d-text mb-3">{tr('cl.opts')}</h3>
            <div className="grid sm:grid-cols-2 gap-2 text-xs text-d-text2">
              <div className="p-2.5 bg-d-med/50 rounded-lg"><code className="text-d-text font-mono">-d, --days &lt;N&gt;</code>: {tr('cl.oDays')}</div>
              <div className="p-2.5 bg-d-med/50 rounded-lg"><code className="text-d-text font-mono">-w, --weeks &lt;N&gt;</code>: {tr('cl.oWeeks')}</div>
              <div className="p-2.5 bg-d-med/50 rounded-lg"><code className="text-d-text font-mono">-l, --limit &lt;N&gt;</code>: {tr('cl.oLimit')}</div>
              <div className="p-2.5 bg-d-med/50 rounded-lg"><code className="text-d-text font-mono">--no-images</code>: {tr('cl.oNoImg')}</div>
              <div className="p-2.5 bg-d-med/50 rounded-lg"><code className="text-d-text font-mono">-n, --no-color</code>: {tr('cl.oNoColor')}</div>
              <div className="p-2.5 bg-d-med/50 rounded-lg"><code className="text-d-text font-mono">--color</code>: {tr('cl.oColor')}</div>
            </div>
          </div>
        </section>

        {/* Footer / Community */}
        <div className="flex flex-wrap gap-4 items-center justify-between p-6 bg-d-med/40 border border-d-border rounded-xl">
          <div>
            <div className="font-bold text-sm text-d-text">{tr('cl.oss')}</div>
            <div className="text-xs text-d-text3">{tr('cl.ossD')}</div>
          </div>
          <div className="flex gap-3 flex-wrap">
            <a
              href="https://www.npmjs.com/package/@lapius/ohatwikeeper-cli"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#CB3837]/10 border border-[#CB3837]/20 text-xs font-semibold text-[#CB3837] transition-colors"
            >
              <i className="bx bxl-nodejs text-base" /> npm: @lapius/ohatwikeeper-cli
            </a>
            <a
              href="https://github.com/Lapius7/ohatwikeeper-cli"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-d-card border border-d-border hover:border-d-text3 text-xs font-semibold text-d-text transition-colors"
            >
              <i className="bx bxl-github text-base" /> GitHub
            </a>
            <a
              href="https://discord.ohatwikeeper.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#5865F2]/10 border border-[#5865F2]/20 text-xs font-semibold text-[#5865F2] transition-colors"
            >
              <i className="bx bxl-discord text-base" /> {tr('cl.discord')}
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
