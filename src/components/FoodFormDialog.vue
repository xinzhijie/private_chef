<template>
  <el-dialog
    :model-value="visible"
    :title="isEdit ? '编辑菜品' : '新增菜品'"
    width="90%"
    style="max-width: 560px"
    @close="handleClose"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item label="菜名" prop="name">
        <el-input v-model="form.name" placeholder="请输入菜名" />
      </el-form-item>
      <el-form-item label="餐段" prop="type">
        <el-select v-model="form.type" placeholder="选择餐段" style="width: 100%" @change="handleTypeChange">
          <el-option label="全部" :value="ALL_MEAL_TYPE" />
          <el-option v-for="meal in MEAL_TYPES" :key="meal.value" :label="meal.label" :value="meal.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="类别" prop="category_id">
        <div class="category-field">
          <el-select
            v-model="form.category_id"
            placeholder="选择类别"
            clearable
            filterable
            style="flex: 1"
          >
            <el-option
              v-for="cat in categories"
              :key="cat.id"
              :label="categoryOptionLabel(cat)"
              :value="cat.id"
            />
          </el-select>
          <el-button @click="handleNewCategory">新建</el-button>
        </div>
      </el-form-item>
      <el-form-item label="状态">
        <el-switch v-model="form.status" :active-value="1" :inactive-value="0" active-text="上架" inactive-text="下架" />
      </el-form-item>
      <el-form-item label="图片">
        <div class="image-upload">
          <div v-if="form.image" class="preview">
            <img :src="form.image" alt="预览" />
            <el-button type="danger" size="small" circle class="remove-btn" @click="form.image = ''">
              <el-icon><Close /></el-icon>
            </el-button>
          </div>
          <el-upload
            v-else
            :auto-upload="false"
            :show-file-list="false"
            accept="image/*"
            @change="handleImageChange"
          >
            <el-button type="primary" plain>
              <el-icon><Upload /></el-icon>
              上传图片
            </el-button>
          </el-upload>
        </div>
      </el-form-item>
      <el-form-item label="食材">
        <el-input v-model="form.material" type="textarea" :rows="3" placeholder="食材清单，如：鸡蛋2个、番茄1个" />
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="form.remark" type="textarea" :rows="4" placeholder="做法、口味要求、小贴士等" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="saving" @click="handleSubmit">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { MEAL_TYPES, MEAL_LABELS, ALL_MEAL_TYPE } from '@/utils/constants'
import { useCategoryStore } from '@/stores/category'
import { ElMessage, ElMessageBox } from 'element-plus'

const props = defineProps({
  visible: Boolean,
  food: Object
})

const emit = defineEmits(['update:visible', 'save'])

const categoryStore = useCategoryStore()
const formRef = ref()
const saving = ref(false)
const isEdit = ref(false)
const categories = ref([])

const defaultForm = () => ({
  name: '',
  type: ALL_MEAL_TYPE,
  category_id: null,
  status: 1,
  image: '',
  material: '',
  remark: ''
})

const form = reactive(defaultForm())

const rules = {
  name: [{ required: true, message: '请输入菜名', trigger: 'blur' }]
}

function categoryOptionLabel(cat) {
  if (form.type === ALL_MEAL_TYPE) {
    return `${cat.name}（${MEAL_LABELS[cat.type] || cat.type}）`
  }
  return cat.name
}

async function loadCategories() {
  const mealType = form.type === ALL_MEAL_TYPE ? null : form.type
  categories.value = await categoryStore.getCategories(mealType)
  if (form.category_id && !categories.value.some((c) => c.id === form.category_id)) {
    form.category_id = null
  }
}

function handleTypeChange() {
  if (form.type === ALL_MEAL_TYPE) {
    loadCategories()
    return
  }
  form.category_id = null
  loadCategories()
}

async function handleNewCategory() {
  if (form.type === ALL_MEAL_TYPE) {
    ElMessage.warning('请先选择具体餐段（早餐/午餐/晚餐）再新建类别')
    return
  }
  try {
    const { value } = await ElMessageBox.prompt('请输入类别名称', '新建类别', {
      confirmButtonText: '创建',
      cancelButtonText: '取消',
      inputPattern: /\S+/,
      inputErrorMessage: '类别名称不能为空'
    })
    const name = value.trim()
    const result = await categoryStore.addCategory(name, form.type)
    if (!result.success && result.id) {
      form.category_id = result.id
      ElMessage.warning(result.message)
    } else if (!result.success) {
      ElMessage.warning(result.message)
      return
    } else {
      form.category_id = result.id
      ElMessage.success('类别已创建')
    }
    await loadCategories()
  } catch {
    // cancelled
  }
}

watch(() => props.visible, async (val) => {
  if (val) {
    if (props.food) {
      isEdit.value = true
      Object.assign(form, {
        name: props.food.name,
        type: props.food.type,
        category_id: props.food.category_id || null,
        status: props.food.status,
        image: props.food.image || '',
        material: props.food.material || '',
        remark: props.food.remark || ''
      })
    } else {
      isEdit.value = false
      Object.assign(form, defaultForm())
    }
    await loadCategories()
  }
})

function handleImageChange(uploadFile) {
  const file = uploadFile.raw
  if (!file) return
  if (file.size > 2 * 1024 * 1024) {
    ElMessage.warning('图片大小不能超过 2MB')
    return
  }
  const reader = new FileReader()
  reader.onload = (e) => {
    form.image = e.target.result
  }
  reader.readAsDataURL(file)
}

function handleClose() {
  emit('update:visible', false)
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  emit('save', { ...form }, props.food?.id)
  saving.value = false
  handleClose()
}
</script>

<style scoped>
.category-field {
  display: flex;
  gap: 8px;
  width: 100%;
}

.image-upload {
  display: flex;
  align-items: flex-start;
}

.preview {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
}

.preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-btn {
  position: absolute;
  top: 4px;
  right: 4px;
}
</style>
