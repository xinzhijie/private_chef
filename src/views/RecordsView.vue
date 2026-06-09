<template>
  <div class="records-page">
    <div class="filter-bar">
      <el-date-picker
        v-model="filterDate"
        type="date"
        placeholder="选择日期"
        format="YYYY-MM-DD"
        value-format="YYYY-MM-DD"
        :clearable="false"
        style="width: 160px"
      />
      <el-select v-model="filterMeal" placeholder="餐段" clearable style="width: 120px">
        <el-option v-for="meal in MEAL_TYPES" :key="meal.value" :label="meal.label" :value="meal.value" />
      </el-select>
      <el-button type="primary" @click="loadRecords">查询</el-button>
      <el-button @click="resetFilter">重置</el-button>
    </div>

    <el-table
      :data="groupedRecords"
      row-key="groupKey"
      stripe
      style="width: 100%"
      v-loading="loading"
    >
      <el-table-column label="菜品" min-width="120">
        <template #default="{ row }">
          <button type="button" class="food-link" @click="openDetail(row)">
            {{ row.foodName }}
          </button>
        </template>
      </el-table-column>
      <el-table-column label="数量" width="80" align="center">
        <template #default="{ row }">
          <span class="qty-text">×{{ row.total }}</span>
        </template>
      </el-table-column>
      <el-table-column label="点餐人" min-width="120">
        <template #default="{ row }">
          <span :class="{ 'mine-user': isMine(row.userId) }">
            {{ row.username }}
            <el-tag v-if="isMine(row.userId)" size="small" type="warning">我</el-tag>
          </span>
        </template>
      </el-table-column>
      <el-table-column label="备注" min-width="120">
        <template #default="{ row }">
          <span v-if="row.remark" class="order-remark">{{ row.remark }}</span>
          <span v-else class="no-remark">—</span>
        </template>
      </el-table-column>
      <el-table-column prop="orderDate" label="日期" width="120" />
      <el-table-column label="餐段" width="80">
        <template #default="{ row }">{{ MEAL_LABELS[row.type] }}</template>
      </el-table-column>
      <el-table-column v-if="auth.canOrder" label="我的份数" width="130" align="center">
        <template #default="{ row }">
          <template v-if="isMine(row.userId)">
            <RecordQtyControl
              v-if="isTodayRecord(row)"
              :key="row.groupKey"
              :food-id="row.foodId"
              :food-name="row.foodName"
              :type="row.type"
              :order-date="row.orderDate"
              :remark="row.remark"
              :count="row.total"
              @changed="loadRecords"
            />
            <span v-else class="readonly-qty">{{ row.total || '—' }}</span>
          </template>
          <span v-else class="readonly-qty">—</span>
        </template>
      </el-table-column>
    </el-table>

    <el-empty v-if="!loading && groupedRecords.length === 0" description="暂无点餐记录" />

    <FoodDetailDialog
      v-model:visible="detailVisible"
      :food="selectedFood"
      :order-note="selectedOrderNote"
      :show-order-btn="false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useOrderStore } from '@/stores/order'
import { useFoodStore } from '@/stores/food'
import { MEAL_TYPES, MEAL_LABELS, getToday } from '@/utils/constants'
import { groupOrdersByFood } from '@/utils/orders'
import RecordQtyControl from '@/components/RecordQtyControl.vue'
import FoodDetailDialog from '@/components/FoodDetailDialog.vue'
import { ElMessage } from 'element-plus'

const auth = useAuthStore()
const orderStore = useOrderStore()
const foodStore = useFoodStore()

const filterDate = ref(getToday())
const filterMeal = ref('')
const records = ref([])
const loading = ref(false)
const detailVisible = ref(false)
const selectedFood = ref(null)
const selectedOrderNote = ref(null)

const groupedRecords = computed(() => groupOrdersByFood(records.value))

function isMine(userId) {
  return Number(userId) === Number(auth.user?.id)
}

function isTodayRecord(row) {
  return row.orderDate === getToday()
}

async function openDetail(row) {
  try {
    const food = await foodStore.getFoodById(row.foodId)
    if (!food) {
      ElMessage.warning('菜品不存在或已删除')
      return
    }
    selectedFood.value = food
    selectedOrderNote.value = row.remark
      ? { username: row.username, remark: row.remark }
      : null
    detailVisible.value = true
  } catch {
    ElMessage.error('加载菜品详情失败')
  }
}

async function loadRecords() {
  loading.value = true
  try {
    const filters = { orderDate: filterDate.value }
    if (filterMeal.value) filters.type = filterMeal.value
    records.value = await orderStore.getOrders(filters)
  } finally {
    loading.value = false
  }
}

function resetFilter() {
  filterDate.value = getToday()
  filterMeal.value = ''
  loadRecords()
}

onMounted(loadRecords)
</script>

<style scoped>
.records-page {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.qty-text {
  font-weight: 600;
  color: #0085ff;
}

.food-link {
  border: none;
  background: none;
  padding: 0;
  color: #0085ff;
  font-size: inherit;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
}

.food-link:hover {
  text-decoration: underline;
}

.mine-user {
  font-weight: 500;
}

.readonly-qty {
  color: #909399;
}

.order-remark {
  color: #606266;
  font-size: 13px;
}

.no-remark {
  color: #c0c4cc;
}
</style>
