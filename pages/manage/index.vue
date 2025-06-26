<template>
  <v-app-bar title="จัดการวัสดุ">
    <v-text-field
      v-model="search"
      placeholder="ค้นหาชื่อวัสดุ..."
      hide-details
      clearable
      density="compact"
      prepend-inner-icon="mdi-magnify"
      style="max-width: 300px"
      class="mr-4"
    />
    <v-btn
      class="mt-n1 mr-2"
      :color="showNearlyDepleted ? 'warning' : 'default'"
      :variant="showNearlyDepleted ? 'elevated' : 'flat'"
      toggle
      @click="toggleNearlyDepleted"
    >
      ใกล้หมด {{ nearlyDepletedCount }} รายการ
    </v-btn>
    <v-btn
      class="mt-n1 mr-2"
      :color="showDepleted ? 'error' : 'default'"
      :variant="showDepleted ? 'elevated' : 'flat'"
      toggle
      @click="toggleDepleted"
    >
      หมดแล้ว {{ depletedCount }} รายการ
    </v-btn>
    <v-btn to="/manage/add" tag="NuxtLink" color="primary" class="mt-n1">
      เพิ่มวัสดุใหม่
    </v-btn>
  </v-app-bar>
  <v-row class="ma-auto">
    <v-col cols="3" class="pa-4">
      <v-card class="pa-4" style="position: sticky;top: 10%">
        หมวดหมู่
        <div class="mb-2 d-flex flex-column">
          <v-btn
            v-for="(items, category) in itemsByCategory"
            :key="category"
            class="mb-2"
            :color="selectedCategory === category ? 'primary' : 'default'"
            @click="toggleCategory(category)"
            :variant="selectedCategory === category ? 'elevated' : 'outlined'"
            block
            toggle
          >
            {{ category || 'ไม่ระบุหมวดหมู่' }}
          </v-btn>
        </div>
        <v-btn v-if="selectedCategory" class="mt-4" color="secondary" @click="clearSelection" block>แสดงทั้งหมด</v-btn>
      </v-card>
    </v-col>
    <v-col cols="9" class="pa-4">
      <v-row v-if="loading">
        <v-col cols="12" class="text-center">
          <v-progress-circular indeterminate color="primary" />
        </v-col>
      </v-row>
      <v-row v-else-if="error">
        <v-col cols="12" class="text-center">
          <v-alert type="error">{{ error.message || error }}</v-alert>
        </v-col>
      </v-row>
      <v-row v-else>
        <v-col cols="12" v-for="(items, category) in filteredAndSelectedItemsByCategory" :key="category">
          <v-card class="mb-6" outlined>
            <v-card-title>{{ category }}</v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="12" v-for="item in items" :key="item.id">
                  <itemCard :name="item.name" :stockqnt="item.stockqnt" :minqnt="item.minqnt" />
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-col>
  </v-row>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import itemCard from '~/components/itemCard.vue'

const itemsByCategory = ref({})
const loading = ref(true)
const error = ref(null)
const search = ref('')
const selectedCategory = ref(null)
const showNearlyDepleted = ref(false)
const showDepleted = ref(false)

const toggleCategory = (category) => {
  if (selectedCategory.value === category) {
    selectedCategory.value = null
  } else {
    selectedCategory.value = category
  }
}

const clearSelection = () => {
  selectedCategory.value = null
}

const toggleNearlyDepleted = () => {
  showNearlyDepleted.value = !showNearlyDepleted.value
  if (showNearlyDepleted.value) showDepleted.value = false
}

const toggleDepleted = () => {
  showDepleted.value = !showDepleted.value
  if (showDepleted.value) showNearlyDepleted.value = false
}

const fetchItems = async () => {
  loading.value = true
  try {
    const res = await fetch('http://localhost:1337/api/items', {
      headers: {
        Authorization: 'Bearer 47e548113e5c35750c07c03b94b65e5064bd766eb8d81fec7aa84398b469b6ed4d922c112ad5986420c6730cf0468facf4c07c520327982aa07524b80e88bd85b04bfdbc8d98f34086a31d0f4b8aae00b494c0f2d07017193bb2c6824a4cdda2f5c03bbb7da4bd0017778154f68fc526e483adab7da7c0e25e9553773a540e46'
      }
    })
    const data = await res.json()
    // Categorize items
    const categorized = {}
    for (const item of data.data) {
      const key = item.category ? item.category.replace(/\s+/g, '') : ''
      if (!categorized[key]) categorized[key] = []
      categorized[key].push(item)
    }
    itemsByCategory.value = categorized
  } catch (e) {
    error.value = e
  } finally {
    loading.value = false
  }
}

const filteredItemsByCategory = computed(() => {
  if (!search.value) return itemsByCategory.value
  const result = {}
  for (const [category, items] of Object.entries(itemsByCategory.value)) {
    const filtered = items.filter(item =>
      item.name && item.name.toLowerCase().includes(search.value.toLowerCase())
    )
    if (filtered.length) result[category] = filtered
  }
  return result
})

const nearlyDepletedCount = computed(() => {
  let count = 0
  for (const items of Object.values(filteredItemsByCategory.value)) {
    count += items.filter(item => item.stockqnt <= item.minqnt && item.stockqnt > 0).length
  }
  return count
})

const depletedCount = computed(() => {
  let count = 0
  for (const items of Object.values(filteredItemsByCategory.value)) {
    count += items.filter(item => item.stockqnt === 0).length
  }
  return count
})

const filteredAndSelectedItemsByCategory = computed(() => {
  let base = filteredItemsByCategory.value
  if (selectedCategory.value) {
    base = { [selectedCategory.value]: base[selectedCategory.value] || [] }
  }
  // Filter for nearly depleted or depleted
  if (showNearlyDepleted.value) {
    const filtered = {}
    for (const [category, items] of Object.entries(base)) {
      const filteredItems = items.filter(item => item.stockqnt <= item.minqnt && item.stockqnt > 0)
      if (filteredItems.length) filtered[category] = filteredItems
    }
    base = filtered
  } else if (showDepleted.value) {
    const filtered = {}
    for (const [category, items] of Object.entries(base)) {
      const filteredItems = items.filter(item => item.stockqnt === 0)
      if (filteredItems.length) filtered[category] = filteredItems
    }
    base = filtered
  }
  return base
})

onMounted(fetchItems)
</script>