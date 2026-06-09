<template>
  <div class="admin-page">
    <div class="page-header">
      <h2>菜品管理</h2>
      <el-button type="primary" @click="openForm()">
        <el-icon><Plus /></el-icon>
        新增菜品
      </el-button>
    </div>

    <div class="filter-bar">
      <el-select v-model="filterMeal" placeholder="全部餐段" style="width: 120px" @change="onFilterMealChange">
        <el-option label="全部" value="" />
        <el-option v-for="meal in MEAL_TYPES" :key="meal.value" :label="meal.label" :value="meal.value" />
      </el-select>
      <el-select v-model="filterCategory" placeholder="全部类别" clearable style="width: 120px" @change="loadFoods">
        <el-option v-for="cat in categoryOptions" :key="cat.id" :label="cat.name" :value="cat.id" />
      </el-select>
      <el-select v-model="filterStatus" placeholder="全部状态" clearable style="width: 120px" @change="loadFoods">
        <el-option label="已上架" :value="1" />
        <el-option label="已下架" :value="0" />
      </el-select>
    </div>

    <el-table :data="foods" stripe style="width: 100%">
      <el-table-column label="图片" width="80">
        <template #default="{ row }">
          <el-image
            v-if="row.image"
            :src="row.image"
            :preview-src-list="[row.image]"
            fit="cover"
            style="width: 50px; height: 50px; border-radius: 6px"
          />
          <el-icon v-else :size="24" color="#c0c4cc"><Picture /></el-icon>
        </template>
      </el-table-column>
      <el-table-column prop="name" label="菜名" />
      <el-table-column label="餐段" width="80">
        <template #default="{ row }">{{ MEAL_LABELS[row.type] || row.type }}</template>
      </el-table-column>
      <el-table-column label="类别" width="100">
        <template #default="{ row }">{{ row.category_name || '未分类' }}</template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
            {{ row.status === 1 ? '上架' : '下架' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="create_time" label="创建时间" width="180" />
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="openForm(row)">编辑</el-button>
          <el-button :type="row.status === 1 ? 'warning' : 'success'" link @click="toggleStatus(row)">
            {{ row.status === 1 ? '下架' : '上架' }}
          </el-button>
          <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-empty v-if="foods.length === 0" description="暂无菜品，点击上方按钮新增" />

    <FoodFormDialog v-model:visible="formVisible" :food="editingFood" @save="handleSave" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useFoodStore } from '@/stores/food'
import { useCategoryStore } from '@/stores/category'
import { MEAL_TYPES, MEAL_LABELS } from '@/utils/constants'
import FoodFormDialog from '@/components/FoodFormDialog.vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const foodStore = useFoodStore()
const categoryStore = useCategoryStore()

const foods = ref([])
const filterMeal = ref('')
const filterCategory = ref('')
const filterStatus = ref('')
const categoryOptions = ref([])
const formVisible = ref(false)
const editingFood = ref(null)

async function loadCategoryOptions() {
  categoryOptions.value = await categoryStore.getCategories(filterMeal.value || null)
  if (filterCategory.value && !categoryOptions.value.some((c) => c.id === filterCategory.value)) {
    filterCategory.value = ''
  }
}

function onFilterMealChange() {
  filterCategory.value = ''
  loadCategoryOptions()
  loadFoods()
}

async function loadFoods() {
  let list = await foodStore.getFoods(filterMeal.value || null, false, filterCategory.value || null)
  if (filterStatus.value !== '' && filterStatus.value !== null && filterStatus.value !== undefined) {
    list = list.filter(f => f.status === filterStatus.value)
  }
  foods.value = list
}

function openForm(food = null) {
  editingFood.value = food
  formVisible.value = true
}

async function handleSave(data, id) {
  if (id) {
    await foodStore.updateFood(id, data)
    ElMessage.success('菜品已更新')
  } else {
    await foodStore.addFood(data)
    ElMessage.success('菜品已添加')
  }
  await loadFoods()
}

async function toggleStatus(row) {
  const newStatus = await foodStore.toggleStatus(row.id)
  ElMessage.success(newStatus === 1 ? '已上架' : '已下架')
  await loadFoods()
}

async function handleDelete(row) {
  await ElMessageBox.confirm(`确定删除「${row.name}」吗？此操作不可恢复。`, '删除确认', { type: 'warning' })
  await foodStore.deleteFood(row.id)
  ElMessage.success('已删除')
  await loadFoods()
}

onMounted(() => {
  loadCategoryOptions()
  loadFoods()
})
</script>

<style scoped>
.admin-page {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  font-size: 18px;
}

.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
</style>
