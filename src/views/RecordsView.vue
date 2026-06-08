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
      <el-table-column prop="foodName" label="菜品" min-width="120" />
      <el-table-column label="数量" width="80" align="center">
        <template #default="{ row }">
          <span class="qty-text">×{{ row.total }}</span>
        </template>
      </el-table-column>
      <el-table-column label="点餐明细" min-width="200">
        <template #default="{ row }">
          <span class="user-list">
            <template v-for="(u, idx) in row.users" :key="u.userId">
              <span :class="{ 'mine-user': isMine(u.userId) }">
                {{ u.username }} {{ u.count }}份
                <el-tag v-if="isMine(u.userId)" size="small" type="warning">我</el-tag>
              </span>
              <span v-if="idx < row.users.length - 1" class="sep"> · </span>
            </template>
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="orderDate" label="日期" width="120" />
      <el-table-column label="餐段" width="80">
        <template #default="{ row }">{{ MEAL_LABELS[row.type] }}</template>
      </el-table-column>
      <el-table-column v-if="auth.canOrder" label="我的份数" width="130" align="center">
        <template #default="{ row }">
          <RecordQtyControl
            :key="row.groupKey"
            :food-id="row.foodId"
            :food-name="row.foodName"
            :type="row.type"
            :order-date="row.orderDate"
            :count="myCount(row)"
            @changed="loadRecords"
          />
        </template>
      </el-table-column>
    </el-table>

    <el-empty v-if="!loading && groupedRecords.length === 0" description="暂无点餐记录" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useOrderStore } from '@/stores/order'
import { MEAL_TYPES, MEAL_LABELS, getToday } from '@/utils/constants'
import { groupOrdersByFood } from '@/utils/orders'
import RecordQtyControl from '@/components/RecordQtyControl.vue'

const auth = useAuthStore()
const orderStore = useOrderStore()

const filterDate = ref(getToday())
const filterMeal = ref('')
const records = ref([])
const loading = ref(false)

const groupedRecords = computed(() => groupOrdersByFood(records.value))

function isMine(userId) {
  return Number(userId) === Number(auth.user?.id)
}

function myCount(row) {
  const mine = row.users.find((u) => isMine(u.userId))
  return mine?.count || 0
}

function loadRecords() {
  loading.value = true
  const filters = { orderDate: filterDate.value }
  if (filterMeal.value) filters.type = filterMeal.value
  records.value = orderStore.getOrders(filters)
  loading.value = false
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

.mine-user {
  font-weight: 500;
}
</style>
