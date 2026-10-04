import { apiSend } from '@/lib/dashboard/api'

/** title / description は翻訳キー(表示側で t() する) */
export const TOUR_STEPS = [
  { element: '#tour-center', title: 'tu.0t', description: 'tu.0d' },
  { element: '#share-url-block', title: 'tu.1t', description: 'tu.1d' },
  { element: '#site-links-box', title: 'tu.2t', description: 'tu.2d' },
  { element: '.add-post-form', title: 'tu.3t', description: 'tu.3d' },
  { element: '#bulk-add-btn', title: 'tu.4t', description: 'tu.4d' },
  { element: '#update-month-btn', title: 'tu.5t', description: 'tu.5d' },
  { element: '#streak-hero', title: 'tu.6t', description: 'tu.6d' },
  { element: '#contribution-graph', title: 'tu.7t', description: 'tu.7d' },
  { element: '.summary-stats', title: 'tu.8t', description: 'tu.8d' },
  { element: '#records-container', title: 'tu.9t', description: 'tu.9d' },
  { element: '#ohax-cli-card', title: 'tu.10t', description: 'tu.10d' },
]

/** 使い方ツアーを開始する(実体は TourHost。終了時に完了フラグをサーバーへ送る) */
export function startTour() {
  window.dispatchEvent(new Event('ohatwi:tour'))
}

export function completeTour() {
  apiSend('complete_tour', 'POST').catch(() => {})
}
