/** 按菜品聚合点餐记录，统计总量及各用户份数 */
export function groupOrdersByFood(orders) {
  const map = new Map()

  for (const order of orders) {
    const key = order.food_id
    if (!map.has(key)) {
      map.set(key, {
        foodId: order.food_id,
        foodName: order.food_name,
        type: order.type,
        orderDate: order.order_date,
        total: 0,
        users: new Map()
      })
    }
    const group = map.get(key)
    group.total++
    const existing = group.users.get(order.user_id)
    if (existing) {
      existing.count++
    } else {
      group.users.set(order.user_id, {
        userId: order.user_id,
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
