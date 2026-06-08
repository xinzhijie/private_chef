<template>
  <div class="my-qty-control">
    <button class="qty-btn minus" :disabled="count <= 0" @click.stop="onRemove">
      <el-icon><Minus /></el-icon>
    </button>
    <span class="qty-num">{{ count }}</span>
    <button class="qty-btn plus" @click.stop="onAdd">
      <el-icon><Plus /></el-icon>
    </button>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'
import { useOrderStore } from '@/stores/order'

const props = defineProps({
  foodId: { type: Number, required: true },
  foodName: { type: String, required: true },
  type: { type: String, required: true },
  orderDate: { type: String, required: true },
  count: { type: Number, default: 0 }
})

const emit = defineEmits(['changed'])

const auth = useAuthStore()
const orderStore = useOrderStore()

function onAdd() {
  orderStore.addMyOrder(auth.user, props.foodId, props.foodName, props.type, props.orderDate)
  emit('changed')
}

function onRemove() {
  if (props.count <= 0) return
  orderStore.removeMyOrder(auth.user.id, props.foodId, props.type, props.orderDate)
  emit('changed')
}
</script>

<style scoped>
.my-qty-control {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.qty-btn {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: opacity 0.2s;
}

.qty-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
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
</style>
