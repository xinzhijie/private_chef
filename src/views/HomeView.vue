<template>
  <div class="order-shop" :class="{ 'has-cart': auth.canOrder }">
    <div class="shop-header">
      <div class="shop-info">
        <h2 class="shop-title">家庭厨房</h2>
        <span class="shop-date">今日 {{ today }}</span>
      </div>
    </div>

    <div class="meal-tabs">
      <div
        v-for="meal in MEAL_TYPES"
        :key="meal.value"
        class="meal-tab"
        :class="{ active: currentMeal === meal.value }"
        @click="switchMeal(meal.value)"
      >
        {{ meal.label }}
        <span v-if="cart.getTotalCount(meal.value) > 0" class="meal-badge">
          {{ cart.getTotalCount(meal.value) }}
        </span>
      </div>
    </div>

    <div class="shop-body">
      <aside class="category-nav">
        <div
          class="category-item"
          :class="{ active: currentCategory === null }"
          @click="currentCategory = null"
        >
          <span class="category-label">全部</span>
        </div>
        <div
          v-for="cat in categories"
          :key="cat.id"
          class="category-item"
          :class="{ active: currentCategory === cat.id }"
          @click="currentCategory = cat.id"
        >
          <span class="category-label">{{ cat.name }}</span>
        </div>
      </aside>

      <main class="food-list">
        <div v-if="foods.length === 0" class="food-empty">
          <el-empty description="当前餐段暂无菜品" :image-size="80" />
        </div>
        <div
          v-for="food in foods"
          :key="food.id"
          class="food-row"
          @click="openDetail(food)"
        >
          <div class="food-thumb">
            <img v-if="food.image" :src="food.image" :alt="food.name" />
            <div v-else class="no-image">
              <el-icon :size="28"><Picture /></el-icon>
            </div>
          </div>
          <div class="food-info">
            <div class="food-name">
              {{ food.name }}
              <el-tag v-if="food.type === ALL_MEAL_TYPE" size="small" type="info" class="all-meal-tag">全餐段</el-tag>
            </div>
            <div v-if="food.material" class="food-desc">{{ food.material }}</div>
            <div v-if="food.remark" class="food-remark">{{ food.remark }}</div>
          </div>
          <div v-if="auth.canOrder" class="food-action" @click.stop>
            <div v-if="getQty(food.id) === 0" class="add-btn" @click="handleAdd(food)">
              <el-icon><Plus /></el-icon>
            </div>
            <div v-else class="qty-control">
              <button class="qty-btn minus" @click="handleRemove(food)">
                <el-icon><Minus /></el-icon>
              </button>
              <span class="qty-num">{{ getQty(food.id) }}</span>
              <button class="qty-btn plus" @click="handleAdd(food)">
                <el-icon><Plus /></el-icon>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>

    <OrderCartBar
      v-if="auth.canOrder"
      :meal-type="currentMeal"
      :submitting="submitting"
      @submit="handleSubmit"
    />

    <FoodDetailDialog
      v-model:visible="detailVisible"
      :food="selectedFood"
      :show-order-btn="auth.canOrder"
      :quantity="selectedFood ? getQty(selectedFood.id) : 0"
      @add-to-cart="handleAdd"
    />
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useFoodStore } from '@/stores/food'
import { useCategoryStore } from '@/stores/category'
import { useOrderStore } from '@/stores/order'
import { useCartStore } from '@/stores/cart'
import { MEAL_TYPES, ALL_MEAL_TYPE, getToday } from '@/utils/constants'
import FoodDetailDialog from '@/components/FoodDetailDialog.vue'
import OrderCartBar from '@/components/OrderCartBar.vue'
import { ElMessage } from 'element-plus'

const auth = useAuthStore()
const foodStore = useFoodStore()
const categoryStore = useCategoryStore()
const orderStore = useOrderStore()
const cart = useCartStore()

const currentMeal = ref('breakfast')
const currentCategory = ref(null)
const today = getToday()
const foods = ref([])
const categories = ref([])
const detailVisible = ref(false)
const selectedFood = ref(null)
const submitting = ref(false)

function getQty(foodId) {
  return cart.getQuantity(currentMeal.value, foodId)
}

async function loadData() {
  categories.value = await categoryStore.getCategories(currentMeal.value)
  foods.value = await foodStore.getFoods(currentMeal.value, true, currentCategory.value)
}

function switchMeal(meal) {
  currentMeal.value = meal
  currentCategory.value = null
}

function openDetail(food) {
  selectedFood.value = food
  detailVisible.value = true
}

function handleAdd(food) {
  cart.addItem(currentMeal.value, food)
}

function handleRemove(food) {
  cart.removeItem(currentMeal.value, food.id)
}

async function handleSubmit(items) {
  submitting.value = true
  try {
    const count = await orderStore.placeOrders(auth.user, items, currentMeal.value, today)
    cart.clearCart(currentMeal.value)
    ElMessage.success(`已成功提交 ${count} 道菜`)
    await loadData()
  } finally {
    submitting.value = false
  }
}

watch(currentMeal, loadData)
watch(currentCategory, async () => {
  foods.value = await foodStore.getFoods(currentMeal.value, true, currentCategory.value)
})
onMounted(loadData)
</script>

<style scoped>
.order-shop {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: calc(100vh - 120px);
}

.order-shop.has-cart {
  padding-bottom: 80px;
}

.shop-header {
  background: linear-gradient(135deg, #0085ff 0%, #0066cc 100%);
  border-radius: 12px;
  padding: 16px 20px;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}

.shop-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.shop-date {
  font-size: 13px;
  opacity: 0.85;
  margin-left: 10px;
}

.meal-tabs {
  display: flex;
  background: #fff;
  border-radius: 12px;
  padding: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  gap: 4px;
}

.meal-tab {
  flex: 1;
  text-align: center;
  padding: 12px 8px;
  font-size: 15px;
  color: #606266;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.2s, color 0.2s;
  position: relative;
  user-select: none;
}

.meal-tab.active {
  background: #0085ff;
  color: #fff;
  font-weight: 600;
}

.meal-badge {
  position: absolute;
  top: 4px;
  right: calc(50% - 28px);
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  background: #ff4d4f;
  color: #fff;
  font-size: 10px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.meal-tab.active .meal-badge {
  background: #fff;
  color: #ff4d4f;
}

.shop-body {
  display: flex;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  min-height: 400px;
  flex: 1;
}

.category-nav {
  width: 88px;
  flex-shrink: 0;
  background: #f7f8fa;
  overflow-y: auto;
}

.category-item {
  position: relative;
  padding: 18px 8px;
  text-align: center;
  cursor: pointer;
  font-size: 14px;
  color: #606266;
  transition: background 0.2s, color 0.2s;
  border-left: 3px solid transparent;
}

.category-item.active {
  background: #fff;
  color: #0085ff;
  font-weight: 600;
  border-left-color: #0085ff;
}

.category-label {
  display: block;
  line-height: 1.3;
}

.food-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.food-empty {
  padding: 40px 0;
}

.food-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  cursor: pointer;
  transition: background 0.15s;
  border-bottom: 1px solid #f5f5f5;
}

.food-row:last-child {
  border-bottom: none;
}

.food-row:active {
  background: #fafafa;
}

.food-thumb {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  background: #f5f7fa;
  flex-shrink: 0;
}

.food-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-image {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c0c4cc;
}

.food-info {
  flex: 1;
  min-width: 0;
  padding-top: 2px;
}

.food-name {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.all-meal-tag {
  flex-shrink: 0;
}

.food-desc {
  font-size: 12px;
  color: #909399;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 2px;
}

.food-remark {
  font-size: 12px;
  color: #c0c4cc;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.food-action {
  flex-shrink: 0;
  align-self: center;
}

.add-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #0085ff;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: opacity 0.2s;
}

.add-btn:active {
  opacity: 0.8;
}

.qty-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.qty-btn {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.qty-btn.minus {
  background: #f5f5f5;
  color: #606266;
}

.qty-btn.plus {
  background: #0085ff;
  color: #fff;
}

.qty-num {
  min-width: 20px;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

@media (max-width: 480px) {
  .category-nav {
    width: 72px;
  }

  .category-item {
    padding: 16px 4px;
    font-size: 13px;
  }

  .food-thumb {
    width: 64px;
    height: 64px;
  }
}
</style>
