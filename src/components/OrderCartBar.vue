<template>
  <Teleport to="body">
    <Transition name="cart-mask">
      <div v-if="drawerVisible" class="cart-mask" @click="closeDrawer" />
    </Transition>

    <Transition name="cart-panel">
      <div v-if="drawerVisible && totalCount > 0" class="cart-panel">
        <div class="panel-header">
          <span class="panel-title">已选菜品</span>
          <button class="clear-btn" @click="handleClear">清空购物车</button>
        </div>
        <div class="panel-list">
          <div v-for="item in items" :key="item.food.id" class="panel-item">
            <div class="item-thumb">
              <img v-if="item.food.image" :src="item.food.image" :alt="item.food.name" />
              <div v-else class="item-no-image">
                <el-icon :size="22"><Picture /></el-icon>
              </div>
            </div>
            <div class="item-info">
              <div class="item-name">{{ item.food.name }}</div>
              <div v-if="item.food.material" class="item-desc">{{ item.food.material }}</div>
            </div>
            <div class="qty-control">
              <button class="qty-btn minus" @click.stop="cart.removeItem(mealType, item.food.id)">
                <el-icon><Minus /></el-icon>
              </button>
              <span class="qty-num">{{ item.quantity }}</span>
              <button class="qty-btn plus" @click.stop="cart.addItem(mealType, item.food)">
                <el-icon><Plus /></el-icon>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <div class="cart-bar-fixed">
    <div class="cart-bar" :class="{ active: totalCount > 0, expanded: drawerVisible }">
      <div class="cart-left">
        <div class="cart-icon-wrap" @click="toggleDrawer">
          <el-icon :size="26"><ShoppingCart /></el-icon>
          <span v-if="totalCount > 0" class="cart-badge">{{ totalCount > 99 ? '99+' : totalCount }}</span>
        </div>
        <div class="cart-summary" @click="toggleDrawer">
          <template v-if="totalCount > 0">
            <span class="cart-count">已选 {{ totalCount }} 道菜</span>
            <span class="cart-hint">{{ drawerVisible ? '点击收起' : '点击查看明细' }}</span>
          </template>
          <span v-else class="cart-empty">购物车是空的，快去选菜吧</span>
        </div>
      </div>
      <button
        class="submit-btn"
        :class="{ disabled: totalCount === 0 || submitting }"
        :disabled="totalCount === 0 || submitting"
        @click="handleSubmit"
      >
        {{ submitting ? '提交中...' : '提交订单' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useCartStore } from '@/stores/cart'
import { ElMessageBox } from 'element-plus'

const props = defineProps({
  mealType: { type: String, required: true },
  submitting: { type: Boolean, default: false }
})

const emit = defineEmits(['submit'])

const cart = useCartStore()
const drawerVisible = ref(false)

const items = computed(() => cart.getItems(props.mealType))
const totalCount = computed(() => cart.getTotalCount(props.mealType))

function toggleDrawer() {
  if (totalCount.value === 0) return
  drawerVisible.value = !drawerVisible.value
}

function closeDrawer() {
  drawerVisible.value = false
}

function handleClear() {
  cart.clearCart(props.mealType)
  drawerVisible.value = false
}

async function handleSubmit() {
  if (totalCount.value === 0) return
  drawerVisible.value = false
  try {
    await ElMessageBox.confirm(
      `确认提交 ${totalCount.value} 道菜？提交后全员可见。`,
      '提交订单',
      { type: 'info', confirmButtonText: '确认提交', cancelButtonText: '再看看' }
    )
    emit('submit', items.value)
  } catch {
    // cancelled
  }
}

watch(() => props.mealType, closeDrawer)
watch(totalCount, (count) => {
  if (count === 0) drawerVisible.value = false
})

defineExpose({ closeDrawer })
</script>

<style scoped>
.cart-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 900;
}

.cart-panel {
  position: fixed;
  left: 50%;
  bottom: 72px;
  transform: translateX(-50%);
  width: min(calc(100% - 40px), 1160px);
  max-height: min(55vh, 420px);
  background: #fff;
  border-radius: 16px 16px 0 0;
  z-index: 901;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.12);
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 12px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.panel-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.clear-btn {
  border: none;
  background: none;
  color: #909399;
  font-size: 13px;
  cursor: pointer;
  padding: 4px 0;
}

.clear-btn:hover {
  color: #f56c6c;
}

.panel-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 20px 16px;
}

.panel-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
}

.panel-item:last-child {
  border-bottom: none;
}

.item-thumb {
  width: 52px;
  height: 52px;
  border-radius: 8px;
  overflow: hidden;
  background: #f5f7fa;
  flex-shrink: 0;
}

.item-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-no-image {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c0c4cc;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-size: 15px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 2px;
}

.item-desc {
  font-size: 12px;
  color: #909399;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.qty-control {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.qty-btn {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.15s;
}

.qty-btn:active {
  transform: scale(0.92);
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
  min-width: 22px;
  text-align: center;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.cart-bar-fixed {
  position: fixed;
  left: 50%;
  bottom: 16px;
  transform: translateX(-50%);
  width: min(calc(100% - 40px), 1160px);
  z-index: 902;
}

.cart-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #2b2b2b;
  border-radius: 40px;
  padding: 8px 8px 8px 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.18);
  transition: box-shadow 0.3s;
}

.cart-bar.expanded {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.cart-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.cart-icon-wrap {
  position: relative;
  width: 48px;
  height: 48px;
  background: #3a3a3a;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #888;
  flex-shrink: 0;
  cursor: pointer;
  transition: background 0.25s, color 0.25s, transform 0.2s;
}

.cart-icon-wrap:active {
  transform: scale(0.95);
}

.cart-bar.active .cart-icon-wrap {
  background: #0085ff;
  color: #fff;
}

.cart-bar.expanded .cart-icon-wrap {
  background: #006dd1;
}

.cart-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: #ff4d4f;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  border: 2px solid #2b2b2b;
}

.cart-summary {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  cursor: pointer;
}

.cart-count {
  font-size: 15px;
  font-weight: 600;
  color: #fff;
}

.cart-hint {
  font-size: 11px;
  color: #999;
}

.cart-empty {
  font-size: 13px;
  color: #888;
  cursor: default;
}

.submit-btn {
  flex-shrink: 0;
  height: 44px;
  padding: 0 24px;
  border: none;
  border-radius: 22px;
  background: #0085ff;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, opacity 0.2s;
}

.submit-btn:active:not(.disabled) {
  opacity: 0.85;
}

.submit-btn.disabled {
  background: #555;
  color: #999;
  cursor: not-allowed;
}

/* 遮罩淡入 */
.cart-mask-enter-active,
.cart-mask-leave-active {
  transition: opacity 0.3s ease;
}

.cart-mask-enter-from,
.cart-mask-leave-to {
  opacity: 0;
}

/* 面板上滑展开 */
.cart-panel-enter-active {
  transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.25s ease;
}

.cart-panel-leave-active {
  transition: transform 0.28s cubic-bezier(0.4, 0, 0.6, 1), opacity 0.2s ease;
}

.cart-panel-enter-from,
.cart-panel-leave-to {
  transform: translateX(-50%) translateY(calc(100% + 72px));
  opacity: 0;
}

.cart-panel-enter-to,
.cart-panel-leave-from {
  transform: translateX(-50%) translateY(0);
  opacity: 1;
}

@media (max-width: 480px) {
  .cart-panel {
    width: 100%;
    left: 0;
    transform: none;
    bottom: 68px;
    border-radius: 16px 16px 0 0;
  }

  .cart-panel-enter-from,
  .cart-panel-leave-to {
    transform: translateY(calc(100% + 68px));
  }

  .cart-panel-enter-to,
  .cart-panel-leave-from {
    transform: translateY(0);
  }

  .cart-bar-fixed {
    width: calc(100% - 24px);
    bottom: 12px;
  }
}
</style>
