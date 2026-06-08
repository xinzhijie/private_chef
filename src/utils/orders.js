/** 按菜品聚合点餐记录，统计总量及各用户份数 */
export function groupOrdersByFood(orders) {
  const map = new Map()

  for (const order of orders) {
    const foodId = Number(order.food_id)
    const userId = Number(order.user_id)
    if (!Number.isFinite(foodId) || !Number.isFinite(userId)) continue

    const key = `${order.order_date}|${order.type}|${foodId}`

    if (!map.has(key)) {
      map.set(key, {
        groupKey: key,
        foodId,
        foodName: order.food_name,
        type: order.type,
        orderDate: order.order_date,
        total: 0,
        users: new Map()
      })
    }
    const group = map.get(key)
    group.total++
    const existing = group.users.get(userId)
    if (existing) {
      existing.count++
    } else {
      group.users.set(userId, {
        userId,
        username: order.username,
        count: 1
      })
    }
  }

  return Array.from(map.values())
    .map((g) => ({
      ...g,
      users: Array.from(g.users.values()).sort((a, b) => b.count - a.count || a.username.localeCompare(b.username))
    }))
    .sort((a, b) => b.total - a.total || a.foodName.localeCompare(b.foodName))
}

export function formatUserPortions(users) {
  return users.map((u) => `${u.username} ${u.count}份`).join(' · ')
}

export function getOrderGroupKey(row) {
  return row.groupKey || `${row.orderDate}|${row.type}|${row.foodId}`
}
