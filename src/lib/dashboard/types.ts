export interface Profile {
  name: string
  screen_name: string
  has_x_linked: boolean
  is_developer: boolean
  avatar_url: string
  banner_url: string | null
  bio_html: string
  location: string | null
  website: { url?: string; display_url?: string } | null
  joined: string
  following: number
  followers: number
  tweets: number
  page_views: number
}

export interface Account {
  public_uuid: string
  is_public: number
  discord_id: string | null
  discord_username: string | null
  x_id: string | null
  api_key: string
  tour_completed: number
}

export interface Stats {
  total_records: number
  coverage_rate: number
  non_posted_days: number
  total_likes: number
  avg_likes: number
  total_reposts: number
  avg_reposts: number
  total_views: number
  avg_views: number
  total_replies: number
  avg_replies: number
  current_consecutive_streak: number
  max_streak: number
  first_post_date: string | null
  predicted_post_time: string | null
  has_metrics_error: boolean
}

export interface Badge {
  icon: string
  label: string
}

export interface NotificationItem {
  id: number
  title: string
  body: string
  created_at: string
  cta_buttons: { label: string; url: string }[]
}

export interface DashboardData {
  csrf_token: string
  profile: Profile
  account: Account
  share_url: string
  ohax_command: string
  stats: Stats
  badges: Badge[]
  last_update_time: string | null
  scheduled_update_time: string
  show_survey_popup: boolean
  notifications: NotificationItem[]
  onboarding?: { x: boolean; extension: boolean; record: boolean; notify: boolean }
  show_tour_auto: boolean
  flash: { message: string | null; error: string | null }
}

export interface RecordItem {
  uniqid: string
  id: string
  detail_id: string
  url: string
  text: string
  date: string
  likes: number
  reposts: number
  replies: number
  views: number
  image_url: string | null
  video_url: string | null
  metrics_error: boolean
}

export type SortKey = 'date' | 'likes' | 'reposts' | 'replies' | 'views'
