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
    <v-btn 
    variant="tonal"
    to="/manage/add" 
    tag="NuxtLink" 
    color="primary" 
    class="mt-n1 mr-4">
      เพิ่มวัสดุใหม่
    </v-btn>
  </v-app-bar>
  <v-row class="ma-auto manage-main-row">

    <!-- หมวดหมู่ -->
    <v-col cols="3" class="pa-4">
      <v-card class="pa-4 bg-blue-grey-lighten-5" style="position: sticky; top: 64px; z-index: 1;">
        หมวดหมู่
        <div class="mt-3 d-flex flex-column">
          <v-btn
            v-for="category in sortedCategoryKeys"
            :key="category"
            class="my-1"
            :color="selectedCategories.includes(category) ? 'primary' : 'default'"
            @click="toggleCategory(category)"
            :variant="selectedCategories.includes(category) ? 'elevated' : 'flat'"
            block
            toggle
            :style="!selectedCategories.includes(category) ? 'background-color: white;' : ''"
          >
            {{ category || 'ไม่ระบุหมวดหมู่' }}
          </v-btn>
        </div>
        <v-btn v-if="selectedCategories.length" class="mt-4" color="error" @click="clearSelection" block>ล้างการเลือก</v-btn>
      </v-card>
    </v-col>
    <v-col cols="9" class="pa-4 manage-scrollable-col">
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

      <!-- category card -->
      <v-row v-else>
        <v-col cols="12" v-for="([category, items]) in sortedCategoryEntries" :key="category">
          <v-card class="bg-blue-grey-lighten-5" outlined>
            <v-card-title class="mt-1">{{ category }}</v-card-title>

            <!-- item card -->
            <v-card-text>
              <v-row>
                <v-col cols="12" v-for="item in items" :key="item.id">
                  <itemCard :documentId="item.documentId" :name="item.name" :stockqnt="item.stockqnt" :minqnt="item.minqnt" :imageUrl="item.imageUrl" @deleted="fetchItems" @updated="fetchItems" />
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
import { useRuntimeConfig } from '#app'
import itemCard from '~/components/itemCard.vue'

const config = useRuntimeConfig()
const API_BASE_URL = config.public.apiUrl
const API_BEARER_TOKEN = config.public.apiToken
const itemsByCategory = ref({})
const loading = ref(true)
const error = ref(null)
const search = ref('')
const selectedCategories = ref([])
const showNearlyDepleted = ref(false)
const showDepleted = ref(false)

const toggleCategory = (category) => {
  const idx = selectedCategories.value.indexOf(category)
  if (idx > -1) {
    selectedCategories.value.splice(idx, 1)
  } else {
    selectedCategories.value.push(category)
  }
}

const clearSelection = () => {
  selectedCategories.value = []
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
    const res = await fetch(`${API_BASE_URL}/api/items?populate=*`, {
      headers: {
        Authorization: `Bearer ${API_BEARER_TOKEN}`
      }
    })
    const data = await res.json()
    console.log('Fetched items data:', data)
    // Categorize items
    const categorized = {}
    for (const item of data.data) {
      const key = item.category ? item.category.replace(/\s+/g, '') : ''
      if (!categorized[key]) categorized[key] = []
      // Extract image URL if present
      let imageUrl = null
      if (item.imgpath && Array.isArray(item.imgpath) && item.imgpath.length > 0) {
        // Use the first image, prefer thumbnail, then small, then original
        const img = item.imgpath[0]
        if (img.formats && img.formats.thumbnail && img.formats.thumbnail.url) {
          imageUrl = `${API_BASE_URL}` + img.formats.thumbnail.url
        } else if (img.formats && img.formats.small && img.formats.small.url) {
          imageUrl = `${API_BASE_URL}` + img.formats.small.url
        } else if (img.url) {
          imageUrl = `${API_BASE_URL}` + img.url
        }
      }
      categorized[key].push({ ...item, imageUrl })
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
  if (selectedCategories.value.length) {
    const filtered = {}
    for (const cat of selectedCategories.value) {
      if (base[cat]) filtered[cat] = base[cat]
    }
    base = filtered
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

const sortedCategoryEntries = computed(() => {
  return Object.entries(filteredAndSelectedItemsByCategory.value)
    .sort(([a], [b]) => a.localeCompare(b, 'th'))
})

const sortedCategoryKeys = computed(() => {
  return Object.keys(itemsByCategory.value).sort((a, b) => a.localeCompare(b, 'th'))
})

onMounted(fetchItems)
</script>

<style scoped>
.manage-main-row {
  height: calc(100vh - 64px); /* 64px is the app bar height */
}
.manage-scrollable-col {
  height: 100%;
  overflow-y: auto;
}
</style>