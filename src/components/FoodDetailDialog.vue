<template>
  <el-dialog
    :model-value="visible"
    :title="food?.name || '菜品详情'"
    width="90%"
    style="max-width: 520px"
    @close="$emit('update:visible', false)"
  >
    <div v-if="food" class="detail-content">
      <div class="detail-image">
        <img v-if="food.image" :src="food.image" :alt="food.name" />
        <div v-else class="no-image">
          <el-icon :size="48"><Picture /></el-icon>
          <span>暂无图片</span>
        </div>
      </div>
      <div class="detail-info">
        <h3>{{ food.name }}</h3>
        <el-tag size="small">{{ mealLabel }}</el-tag>
        <el-tag size="small" :type="food.status === 1 ? 'success' : 'info'" style="margin-left: 8px">
          {{ food.status === 1 ? '已上架' : '已下架' }}
        </el-tag>
      </div>
      <div class="detail-section" v-if="food.material">
        <h4>食材清单</h4>
        <p>{{ food.material }}</p>
      </div>
      <div class="detail-section" v-if="food.remark">
        <h4>备注 / 做法</h4>
        <p class="remark-text">{{ food.remark }}</p>
      </div>
    </div>
    <template #footer>
      <el-button @click="$emit('update:visible', false)">关闭</el-button>
      <el-button
        v-if="showOrderBtn"
        type="primary"
        @click="handleAddToCart"
      >
        {{ quantity > 0 ? '再加一份' : '加入购物车' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { MEAL_LABELS } from '@/utils/constants'

const props = defineProps({
  visible: Boolean,
  food: Object,
  showOrderBtn: { type: Boolean, default: false },
  quantity: { type: Number, default: 0 }
})

const emit = defineEmits(['update:visible', 'add-to-cart'])

const mealLabel = computed(() => MEAL_LABELS[props.food?.type] || '')

function handleAddToCart() {
  emit('add-to-cart', props.food)
  emit('update:visible', false)
}
</script>

<style scoped>
.detail-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-image {
  width: 100%;
  height: 200px;
  border-radius: 8px;
  overflow: hidden;
  background: #f5f7fa;
}

.detail-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-image {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #c0c4cc;
  gap: 8px;
}

.detail-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.detail-info h3 {
  font-size: 20px;
  margin-right: 8px;
}

.detail-section h4 {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.detail-section p {
  font-size: 14px;
  line-height: 1.6;
  color: #606266;
  white-space: pre-wrap;
}

.remark-text {
  background: #fdf6ec;
  padding: 12px;
  border-radius: 6px;
  border-left: 3px solid #e6a23c;
}
</style>
