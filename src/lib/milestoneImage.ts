import i18n from '@/i18n'
/** 節目達成のシェア画像(1200x630, X のカード比率)を canvas で生成する */
export interface MilestoneImage { title: string; detail: string; color: string; metric: string }

export async function makeMilestoneImage(m: MilestoneImage): Promise<Blob> {
  await document.fonts?.ready
  const W = 1200, H = 630
  const cv = document.createElement('canvas')
  cv.width = W; cv.height = H
  const g = cv.getContext('2d')!
  const font = (w: number, px: number) => `${w} ${px}px "Noto Sans JP", "Geist Variable", system-ui, sans-serif`
  const bg = g.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#0b0b10'); bg.addColorStop(1, '#171722')
  g.fillStyle = bg; g.fillRect(0, 0, W, H)
  const glow = g.createRadialGradient(W / 2, 250, 20, W / 2, 250, 420)
  glow.addColorStop(0, m.color + '66'); glow.addColorStop(1, m.color + '00')
  g.fillStyle = glow; g.fillRect(0, 0, W, H)
  g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 2
  g.beginPath(); g.roundRect(30, 30, W - 60, H - 60, 28); g.stroke()
  g.textAlign = 'center'
  // バッジ(円 + 星)
  g.fillStyle = m.color; g.beginPath(); g.arc(W / 2, 190, 78, 0, Math.PI * 2); g.fill()
  g.fillStyle = '#fff'; g.font = font(700, 84); g.textBaseline = 'middle'; g.fillText('★', W / 2, 194)
  g.textBaseline = 'alphabetic'
  g.fillStyle = 'rgba(255,255,255,0.65)'; g.font = font(500, 30); g.fillText(i18n.t('cn.milestone', { metric: m.metric }), W / 2, 330)
  g.fillStyle = '#fff'; g.font = font(800, 96); g.fillText(m.title, W / 2, 440)
  g.fillStyle = m.color; g.font = font(600, 40); g.fillText(m.detail, W / 2, 500)
  g.fillStyle = 'rgba(255,255,255,0.5)'; g.font = font(600, 28); g.fillText('おはツイKeeper  ohatwikeeper.com', W / 2, 570)
  return new Promise((res, rej) => cv.toBlob(b => (b ? res(b) : rej(new Error('toBlob failed'))), 'image/png'))
}
