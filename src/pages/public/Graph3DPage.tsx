import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { ArrowLeft } from 'lucide-react'
import { usePublicCtx } from '@/app/layouts/publicContext'
import { PageLoader } from '@/components/ui/page-loader'
import { Button } from '@/components/ui/button'

type Key = 'likes' | 'views' | 'reposts' | 'replies'
const METRICS: { key: Key; label: string; color: string }[] = [
  { key: 'likes', label: 'rc.likes', color: '#ec4899' },
  { key: 'views', label: 'rc.views', color: '#fb923c' },
  { key: 'reposts', label: 'rc.reposts', color: '#22c55e' },
  { key: 'replies', label: 'rc.replies', color: '#60a5fa' },
]
interface Chart { labels: string[]; likes: number[]; views: number[]; reposts: number[]; replies: number[] }
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
type Day = { date: string; v: number; x: number; z: number; m: number }

/** /{uuid}/graph/3d: 直近1年を 週(列) × 曜日(行) の柱で表す3Dグラフ */
export default function Graph3DPage() {
  const { t } = useTranslation()
  const { publicUuid, profile } = usePublicCtx()
  const [chart, setChart] = useState<Chart | null | undefined>(undefined)
  const [metric, setMetric] = useState<Key>('likes')

  const [tip, setTip] = useState<{ x: number; y: number; text: string } | null>(null)
  const host = useRef<HTMLDivElement>(null)
  const api = useRef<{ build: (days: Day[], max: number, color: string) => void } | null>(null)
  const info = useRef<Day[]>([])

  useEffect(() => { document.title = `${t('g3.title')} - ${profile.name} - おはツイKeeper` }, [t, profile.name])
  useEffect(() => {
    setChart(undefined)
    fetch(`/app-api/view/graph-data/?uuid=${encodeURIComponent(publicUuid)}`)
      .then((r) => r.json()).then((d) => setChart(d.chart_data ?? null)).catch(() => setChart(null))
  }, [publicUuid])

  // 直近53週(日曜始まり)を GitHub のコントリビューション風に 週=列 × 曜日=行 で並べる。投稿のない日は低い板
  const days = useMemo(() => {
    if (!chart) return []
    const map = new Map<string, number>()
    chart.labels.forEach((l, i) => map.set(ymd(new Date(l)), Number(chart[metric][i] ?? 0)))
    const now = new Date(), out: Day[] = []
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() - 52 * 7)
    for (let w = 0; w < 53; w++) for (let r = 0; r < 7; r++) {
      const dt = new Date(start.getFullYear(), start.getMonth(), start.getDate() + w * 7 + r)
      if (dt > now) continue
      out.push({ date: ymd(dt), v: map.get(ymd(dt)) ?? 0, x: w - 26 + 0.5, z: r - 3.5 + 0.5, m: r === 0 && dt.getDate() <= 7 ? dt.getMonth() + 1 : 0 })
    }
    return out
  }, [chart, metric])

  const hasData = days.some((d) => d.v > 0)

  useEffect(() => {
    if (!chart || !host.current) return
    const el = host.current
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.shadowMap.enabled = true
    el.appendChild(renderer.domElement)
    const scene = new THREE.Scene(); scene.background = new THREE.Color('#1c1c1c')
    const cam = new THREE.PerspectiveCamera(36, 1, 0.1, 600); cam.position.set(-8, 34, 52)
    const ctl = new OrbitControls(cam, renderer.domElement); ctl.enableDamping = true; ctl.maxPolarAngle = Math.PI / 2.1
    scene.add(new THREE.HemisphereLight('#ffffff', '#555555', 1.2))
    const sun = new THREE.DirectionalLight('#ffffff', 2.2); sun.position.set(-30, 60, 40); sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 25, bottom: -25, far: 250 }); scene.add(sun)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), new THREE.ShadowMaterial({ opacity: 0.35 }))
    floor.rotation.x = -Math.PI / 2; floor.position.y = -0.62; floor.receiveShadow = true; scene.add(floor)
    const geo = new RoundedBoxGeometry(0.84, 1, 0.84, 2, 0.08)
    const plate = new THREE.Mesh(new THREE.BoxGeometry(56, 0.6, 10.4), new THREE.MeshStandardMaterial({ color: '#171a1f', roughness: 0.8 }))
    plate.position.y = -0.32; plate.receiveShadow = true; scene.add(plate)
    const mat = new THREE.MeshStandardMaterial({ roughness: 0.5 })
    let mesh: THREE.InstancedMesh | null = null
    let labels: THREE.Sprite[] = []
    const resize = () => { const w = el.clientWidth, h = el.clientHeight; renderer.setSize(w, h); cam.aspect = w / h; cam.zoom = Math.min(1, w / h / 1.5); cam.updateProjectionMatrix() }
    const ro = new ResizeObserver(resize); ro.observe(el); resize()

    api.current = {
      build: (ds, max, color) => {
        if (mesh) { scene.remove(mesh); mesh.dispose() }
        mesh = new THREE.InstancedMesh(geo, mat, ds.length); mesh.castShadow = true; mesh.receiveShadow = true
        const m = new THREE.Matrix4(), base = new THREE.Color('#2e343e'), hi = new THREE.Color(color), c = new THREE.Color()
        ds.forEach((d, i) => {
          const h = d.v > 0 ? 0.5 + Math.sqrt(d.v / max) * 12 : 0.12
          m.compose(new THREE.Vector3(d.x, h / 2, d.z), new THREE.Quaternion(), new THREE.Vector3(1, h, 1))
          mesh!.setMatrixAt(i, m)
          mesh!.setColorAt(i, d.v > 0 ? c.copy(base).lerp(hi, 0.35 + 0.65 * Math.sqrt(d.v / max)) : base)
        })
        labels.forEach((s) => { scene.remove(s); s.material.map?.dispose(); s.material.dispose() }); labels = []
        ds.filter((d) => d.m && d.z < -2.9 && d.x > -24).forEach((d) => {
          const cv = document.createElement('canvas'); cv.width = 128; cv.height = 64
          const g = cv.getContext('2d')!; g.fillStyle = '#d4d4d4'; g.font = 'bold 40px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(`${d.m}月`, 64, 34)
          const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthWrite: false }))
          sp.scale.set(4, 2, 1); sp.position.set(d.x + 1, 0.2, 5.2); scene.add(sp); labels.push(sp)
        })
        mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
        scene.add(mesh)
      },
    }
    const ray = new THREE.Raycaster(), mouse = new THREE.Vector2()
    const onMove = (e: PointerEvent) => {
      const r = renderer.domElement.getBoundingClientRect()
      mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
      ray.setFromCamera(mouse, cam)
      const hit = mesh ? ray.intersectObject(mesh)[0] : null
      const d = hit?.instanceId != null ? info.current[hit.instanceId] : null
      setTip(d && d.v > 0 ? { x: e.clientX - r.left, y: e.clientY - r.top, text: `${d.date}  ${d.v.toLocaleString()}` } : null)
    }
    renderer.domElement.addEventListener('pointermove', onMove)
    renderer.domElement.addEventListener('pointerleave', () => setTip(null))
    let raf = 0
    const loop = () => { ctl.update(); renderer.render(scene, cam); raf = requestAnimationFrame(loop) }
    loop()
    return () => { cancelAnimationFrame(raf); ro.disconnect(); ctl.dispose(); geo.dispose(); mat.dispose(); renderer.dispose(); renderer.domElement.remove(); api.current = null }
  }, [chart])

  useEffect(() => {
    info.current = days
    const max = Math.max(1, ...days.map((d) => d.v))
    api.current?.build(days, max, METRICS.find((m) => m.key === metric)!.color)
  }, [days, metric, chart])


  if (chart === undefined) return <PageLoader />
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold text-d-text">{t('g3.title')}</h1>
          <p className="mt-1 text-xs text-d-text3">{t('g3.desc', { name: profile.name })}</p>
        </div>
        <Button size="sm" variant="outline" render={<Link to={`/${publicUuid}/graph`} />} nativeButton={false}><ArrowLeft className="size-4" />{t('g3.back')}</Button>
      </div>
      {!chart || !hasData ? (
        <div className="rounded-xl border border-dashed border-d-border py-20 text-center text-sm text-d-text3">{t('g3.empty')}</div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            {METRICS.map((m) => (
              <Button key={m.key} size="sm" variant={metric === m.key ? 'default' : 'outline'} onClick={() => setMetric(m.key)}>
                <span className="size-2 rounded-full" style={{ background: m.color }} />{t(m.label)}
              </Button>
            ))}

          </div>
          <div className="relative">
            <div ref={host} className="h-[min(62vh,540px)] w-full overflow-hidden rounded-xl border border-d-border [&>canvas]:block [&>canvas]:cursor-grab" />
            {tip && <div className="pointer-events-none absolute rounded-md bg-black/80 px-2 py-1 text-xs tabular-nums text-white" style={{ left: tip.x + 12, top: tip.y + 12 }}>{tip.text}</div>}
          </div>
        </>
      )}
    </div>
  )
}
