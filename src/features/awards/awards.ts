import i18n from '@/i18n'
// awards.php のマイルストーン定義・計算ロジックを React 側に移植したもの。
// API(/app-api/view/awards-data)は records と totals を返し、節目判定・ベスト集計はここで行う。

export interface AwardRecord {
  url: string
  text: string
  date: string
  likes: number
  reposts: number
  replies: number
  views: number
  image_url: string | null
  engagement_rate: number
}

export interface AwardsData {
  public_uuid: string
  is_public: boolean
  author: { name: string; screen_name: string | null; avatar_url: string | null }
  totals: {
    posts: number
    current_streak: number
    max_streak: number
    likes: number
    views: number
    reposts: number
    replies: number
  }
  records: AwardRecord[]
}

export interface Milestone {
  threshold: number
  title: string
  message: string
  icon: string
  color: string
}

export type MetricKey = 'streak' | 'posts' | 'likes' | 'views' | 'reposts' | 'replies'

const m = (threshold: number, title: string, message: string, icon: string, color: string): Milestone =>
  ({ threshold, title, message, icon, color })

export const MILESTONES: Record<MetricKey, Milestone[]> = {
  streak: [
    m(3, '3日連続', '3日連続達成！良いスタートです🌱', 'bx-leaf', '#22c55e'),
    m(7, '1週間連続', '1週間連続達成！習慣化の第一歩🎉', 'bx-party', '#f59e0b'),
    m(14, '2週間連続', '2週間連続達成！継続は力なり💪', 'bx-dumbbell', '#ef4444'),
    m(21, '3週間連続', '3週間連続達成！もう習慣ですね🔥', 'bx-flame', '#f97316'),
    m(30, '1ヶ月連続', '1ヶ月連続達成！素晴らしい🏆', 'bx-trophy', '#eab308'),
    m(50, '50日連続', '50日連続達成！鉄の意志⚡', 'bx-bolt', '#8b5cf6'),
    m(100, '100日連続', '100日連続達成！おはツイマスター🌟', 'bx-star', '#f59e0b'),
    m(150, '150日連続', '150日連続達成！半年まであと少し🌈', 'bx-sun', '#06b6d4'),
    m(200, '200日連続', '200日連続達成！偉業です✨', 'bx-diamond', '#ec4899'),
    m(300, '300日連続', '300日連続達成！伝説の始まり🔱', 'bx-crown', '#6366f1'),
    m(365, '1年連続', '1年間連続達成！おはツイの達人👑', 'bxs-crown', '#f59e0b'),
    m(500, '500日連続', '500日連続達成！神域に到達🏅', 'bx-medal', '#14b8a6'),
    m(730, '2年連続', '2年間連続達成！まさにレジェンド🎖️', 'bxs-medal', '#d97706'),
    m(1000, '1000日連続', '1000日連続達成！人類の希望🌍', 'bx-world', '#059669'),
    m(1095, '3年連続', '3年間連続達成！不滅の意志🔥', 'bxs-flame', '#dc2626'),
    m(1500, '1500日連続', '1500日連続達成！歴史に刻まれる偉業📜', 'bx-book', '#7c3aed'),
    m(1825, '5年連続', '5年間連続達成！生ける伝説✨', 'bxs-star', '#f59e0b'),
    m(2555, '7年連続', '7年間連続達成！神話の領域🏛️', 'bx-buildings', '#0891b2'),
    m(3650, '10年連続', '10年間連続達成！永遠の記録🌟', 'bxs-crown', '#eab308'),
  ],
  posts: [
    m(5, '5回達成', 'おはツイデビュー記念！🎊', 'bx-gift', '#f472b6'),
    m(10, '10回達成', '10回目のおはツイ！🎯', 'bx-target-lock', '#38bdf8'),
    m(25, '25回達成', '25回達成！順調です🚀', 'bx-rocket', '#a855f7'),
    m(50, '50回達成', '50回達成！半世紀おはツイ🌸', 'bx-spa', '#f472b6'),
    m(75, '75回達成', '75回達成！100回まであと少し🎈', 'bx-party', '#fb923c'),
    m(100, '100回達成', '100回達成！おめでとう🎊', 'bx-trophy', '#eab308'),
    m(150, '150回達成', '150回達成！安定のおはツイャー📣', 'bx-megaphone', '#22d3ee'),
    m(200, '200回達成', '200回達成！ベテランの風格💫', 'bx-star', '#c084fc'),
    m(300, '300回達成', '300回達成！おはツイ職人🎨', 'bx-palette', '#f43f5e'),
    m(500, '500回達成', '500回達成！おはツイエキスパート🏅', 'bx-medal', '#14b8a6'),
    m(750, '750回達成', '750回達成！1000回まであと少し🌠', 'bx-moon', '#818cf8'),
    m(1000, '1000回達成', '1000回達成！偉大な記録✨', 'bx-diamond', '#f59e0b'),
    m(1500, '1500回達成', '1500回達成！おはツイの神🌟', 'bxs-star', '#facc15'),
    m(2000, '2000回達成', '2000回達成！伝説のおはツイャー👑', 'bxs-crown', '#d97706'),
    m(2500, '2500回達成', '2500回達成！歴史に名を残す🏆', 'bx-trophy', '#ea580c'),
    m(3000, '3000回達成', '3000回達成！不滅の投稿者🔥', 'bxs-flame', '#dc2626'),
    m(4000, '4000回達成', '4000回達成！圧巻の記録📈', 'bx-trending-up', '#0ea5e9'),
    m(5000, '5000回達成', '5000回達成！おはツイ界の頂点🗻', 'bx-landscape', '#059669'),
    m(7500, '7500回達成', '7500回達成！人類の到達点🌍', 'bx-world', '#2563eb'),
    m(10000, '10000回達成', '10000回達成！永遠に語り継がれる伝説🌟', 'bxs-crown', '#eab308'),
  ],
  likes: [
    m(50, '50いいね達成', '50いいね突破！嬉しい🎉', 'bx-heart', '#f472b6'),
    m(100, '100いいね達成', '100いいね達成！人気者✨', 'bx-heart', '#ec4899'),
    m(250, '250いいね達成', '250いいね！愛されてます💕', 'bxs-heart', '#f43f5e'),
    m(500, '500いいね達成', '500いいね達成！大人気🔥', 'bxs-heart', '#ef4444'),
    m(1000, '1,000いいね達成', '1,000いいね突破！すごい💖', 'bx-heart-circle', '#dc2626'),
    m(2500, '2,500いいね達成', '2,500いいね！みんなに愛されてる💝', 'bx-heart-circle', '#db2777'),
    m(5000, '5,000いいね達成', '5,000いいね達成！人気者の証🌟', 'bxs-heart-circle', '#c026d3'),
    m(10000, '1万いいね達成', '1万いいね突破！インフルエンサー👑', 'bxs-heart-circle', '#a855f7'),
    m(25000, '2.5万いいね達成', '2.5万いいね！おはツイ界のスター⭐', 'bx-star', '#8b5cf6'),
    m(50000, '5万いいね達成', '5万いいね達成！愛される存在🏆', 'bxs-star', '#7c3aed'),
    m(100000, '10万いいね達成', '10万いいね！まさに神🙏', 'bxs-crown', '#f59e0b'),
    m(250000, '25万いいね達成', '25万いいね！おはツイ界の王👑', 'bxs-crown', '#ea580c'),
    m(500000, '50万いいね達成', '50万いいね！伝説を超えた存在✨', 'bx-diamond', '#0891b2'),
    m(1000000, '100万いいね達成', '100万いいね！ミリオン達成🎊', 'bxs-diamond', '#dc2626'),
    m(2500000, '250万いいね達成', '250万いいね！人類の希望🌍', 'bx-world', '#059669'),
    m(5000000, '500万いいね達成', '500万いいね！神話レベル🏛️', 'bx-buildings', '#7c3aed'),
    m(10000000, '1000万いいね達成', '1000万いいね！宇宙の果てまで届く愛🌌', 'bx-planet', '#6366f1'),
  ],
  views: [
    m(1000, '1,000表示達成', '1,000インプレッション突破！🎉', 'bx-show', '#38bdf8'),
    m(5000, '5,000表示達成', '5,000インプレッション達成！✨', 'bx-show', '#0ea5e9'),
    m(10000, '1万表示達成', '1万インプレッション突破！🚀', 'bxs-show', '#0284c7'),
    m(50000, '5万表示達成', '5万インプレッション達成！🌟', 'bxs-show', '#0369a1'),
    m(100000, '10万表示達成', '10万インプレッション突破！注目の的👀', 'bx-trending-up', '#075985'),
    m(500000, '50万表示達成', '50万インプレッション達成！大人気🔥', 'bx-trending-up', '#0c4a6e'),
    m(1000000, '100万表示達成', '100万インプレッション！ミリオン到達🎊', 'bxs-crown', '#f59e0b'),
    m(5000000, '500万表示達成', '500万インプレッション！伝説の域へ✨', 'bx-diamond', '#dc2626'),
    m(10000000, '1000万表示達成', '1000万インプレッション！人類の視界に🌍', 'bx-world', '#059669'),
  ],
  reposts: [
    m(10, '10リポスト達成', '10リポスト突破！🎉', 'bx-repost', '#22c55e'),
    m(50, '50リポスト達成', '50リポスト達成！✨', 'bx-repost', '#16a34a'),
    m(100, '100リポスト達成', '100リポスト突破！🚀', 'bx-repost', '#15803d'),
    m(500, '500リポスト達成', '500リポスト達成！拡散力抜群📢', 'bx-repost', '#166534'),
    m(1000, '1,000リポスト達成', '1,000リポスト突破！すごい💫', 'bxs-repost', '#14532d'),
    m(5000, '5,000リポスト達成', '5,000リポスト達成！バズり職人🔥', 'bxs-repost', '#a855f7'),
    m(10000, '1万リポスト達成', '1万リポスト突破！伝説の拡散力👑', 'bxs-repost', '#7c3aed'),
    m(50000, '5万リポスト達成', '5万リポスト達成！おはツイ界の頂点🗻', 'bxs-crown', '#f59e0b'),
    m(100000, '10万リポスト達成', '10万リポスト！人類の希望🌍', 'bx-world', '#059669'),
  ],
  replies: [
    m(10, '10リプライ達成', '10リプライ突破！🎉', 'bx-message-rounded-dots', '#fb923c'),
    m(50, '50リプライ達成', '50リプライ達成！✨', 'bx-message-rounded-dots', '#f97316'),
    m(100, '100リプライ達成', '100リプライ突破！会話上手💬', 'bx-message-rounded-dots', '#ea580c'),
    m(500, '500リプライ達成', '500リプライ達成！人気者の証🎊', 'bxs-message-rounded-dots', '#c2410c'),
    m(1000, '1,000リプライ達成', '1,000リプライ突破！コミュニティの中心⭐', 'bxs-message-rounded-dots', '#9a3412'),
    m(5000, '5,000リプライ達成', '5,000リプライ達成！会話の達人🏆', 'bxs-message-rounded-dots', '#7c2d12'),
    m(10000, '1万リプライ達成', '1万リプライ突破！伝説の対話者👑', 'bxs-crown', '#f59e0b'),
    m(50000, '5万リプライ達成', '5万リプライ！おはツイ界の名物🌟', 'bxs-star', '#eab308'),
  ],
}

export const METRIC_META: Record<MetricKey, { label: string; unit: string; icon: string }> = {
  streak: { label: 'awd.mStreak', unit: 'awd.uDay', icon: 'bx-flame' },
  posts: { label: 'awd.mPosts', unit: 'awd.uTimes', icon: 'bx-calendar-check' },
  likes: { label: 'awd.mLikes', unit: '', icon: 'bx-heart' },
  views: { label: 'awd.mViews', unit: '', icon: 'bx-show' },
  reposts: { label: 'awd.mReposts', unit: '', icon: 'bx-repost' },
  replies: { label: 'awd.mReplies', unit: '', icon: 'bx-message-rounded-dots' },
}

/** METRIC_META のキーを現在の言語で解決した表示用ラベル・単位 */
export const metaOf = (k: MetricKey) => ({ ...METRIC_META[k], label: i18n.t(METRIC_META[k].label), unit: METRIC_META[k].unit ? i18n.t(METRIC_META[k].unit) : '' })

/** 節目の称号・メッセージ。日本語は固有文言、他言語は指標ごとのテンプレート */
const isJa = () => i18n.language.startsWith('ja')
export const msTitle = (k: MetricKey, ms: Milestone) => (isJa() ? ms.title : i18n.t(`awd.ms.${k}.t`, { n: ms.threshold.toLocaleString() }))
export const msMessage = (k: MetricKey, ms: Milestone) => (isJa() ? ms.message : i18n.t(`awd.ms.${k}.m`, { n: ms.threshold.toLocaleString() }))

/** その指標の現在値に対する、達成済みの最高マイルストーンと次の目標を返す。 */
export function goalFor(metric: MetricKey, value: number) {
  const list = MILESTONES[metric]
  let achieved: Milestone | null = null
  let next: Milestone | null = null
  for (const ms of list) {
    if (value >= ms.threshold) achieved = ms
    else { next = ms; break }
  }
  const base = achieved?.threshold ?? 0
  const progress = next ? Math.min(100, ((value - base) / (next.threshold - base)) * 100) : 100
  return { achieved, next, progress, remaining: next ? next.threshold - value : 0 }
}

export interface BestSet {
  best_likes: AwardRecord | null
  best_views: AwardRecord | null
  best_reposts: AwardRecord | null
  best_replies: AwardRecord | null
  best_engagement: AwardRecord | null
}

const emptyBest = (): BestSet => ({
  best_likes: null, best_views: null, best_reposts: null, best_replies: null, best_engagement: null,
})

function accumulate(acc: BestSet, r: AwardRecord) {
  if (!acc.best_likes || r.likes > acc.best_likes.likes) acc.best_likes = r
  if (!acc.best_views || r.views > acc.best_views.views) acc.best_views = r
  if (!acc.best_reposts || r.reposts > acc.best_reposts.reposts) acc.best_reposts = r
  if (!acc.best_replies || r.replies > acc.best_replies.replies) acc.best_replies = r
  if (r.views > 0 && (!acc.best_engagement || r.engagement_rate > acc.best_engagement.engagement_rate)) {
    acc.best_engagement = r
  }
}

/** 全期間のベスト記録。 */
export function allTimeBest(records: AwardRecord[]): BestSet {
  const acc = emptyBest()
  for (const r of records) accumulate(acc, r)
  return acc
}

/** 月ごと(新しい月順)のベスト記録。 */
export function monthlyBest(records: AwardRecord[]): { month: string; best: BestSet }[] {
  const map = new Map<string, BestSet>()
  for (const r of records) {
    const month = r.date.substring(0, 7) // YYYY-MM
    let acc = map.get(month)
    if (!acc) { acc = emptyBest(); map.set(month, acc) }
    accumulate(acc, r)
  }
  return [...map.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([month, best]) => ({ month, best }))
}
