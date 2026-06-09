export const MEAL_TYPES = [
  { value: 'breakfast', label: '早餐' },
  { value: 'lunch', label: '午餐' },
  { value: 'dinner', label: '晚餐' }
]

/** 全餐段菜品类型，在早/中/晚均展示 */
export const ALL_MEAL_TYPE = 'all'

export const MEAL_LABELS = {
  all: '全部',
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐'
}

export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  VIEWER: 'viewer'
}

export const ROLE_LABELS = {
  admin: '管理员',
  user: '普通用户',
  viewer: '只读用户'
}

export function getToday() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function formatDate(date) {
  const d = new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
