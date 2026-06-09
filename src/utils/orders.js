import { MEAL_TYPES } from '@/utils/constants'

const MEAL_TYPE_ORDER = Object.fromEntries(MEAL_TYPES.map((meal, index) => [meal.value, index]))

/** 按日期（年月日）、餐段、菜品名称、用户名排序 */
export function compareOrdersByDateMealName(a, b) {
  const dateCmp = String(a.orderDate).localeCompare(String(b.orderDate))
  if (dateCmp !== 0) return dateCmp
  const mealCmp = (MEAL_TYPE_ORDER[a.type] ?? 99) - (MEAL_TYPE_ORDER[b.type] ?? 99)
  if (mealCmp !== 0) return mealCmp
  const nameCmp = String(a.foodName).localeCompare(String(b.foodName), 'zh-CN')
  if (nameCmp !== 0) return nameCmp
  return String(a.username).localeCompare(String(b.username), 'zh-CN')
}

/** 按用户 + 菜品聚合点餐记录，不同用户相同菜品各占一行 */
export function groupOrdersByFood(orders) {
  const map = new Map()

  for (const order of orders) {
    const foodId = Number(order.food_id)
    const userId = Number(order.user_id)
    if (!Number.isFinite(foodId) || !Number.isFinite(userId)) continue

    const remark = order.remark?.trim() || ''
    const key = `${order.order_date}|${order.type}|${foodId}|${remark}|${userId}`

    if (!map.has(key)) {
      map.set(key, {
        groupKey: key,
        foodId,
        foodName: order.food_name,
        type: order.type,
        orderDate: order.order_date,
        remark,
        userId,
        username: order.username,
        total: 0
      })
    }
    map.get(key).total++
  }

  return Array.from(map.values()).sort(compareOrdersByDateMealName)
}

export function getOrderGroupKey(row) {
  return row.groupKey || `${row.orderDate}|${row.type}|${row.foodId}|${row.remark || ''}|${row.userId}`
}
