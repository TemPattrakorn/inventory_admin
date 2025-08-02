<template>
  <v-app-bar title="ประวัติการเบิกใช้">
    <!-- Clear Filters -->
    <v-btn
      v-if="hasActiveFilters"
      variant="tonal"
      color="grey"
      @click="clearFilters"
      class="mr-2"
    >
      ล้างตัวกรอง
    </v-btn>
    
    <!-- User Filter -->
    <v-select
      v-model="selectedUser"
      :items="userOptions"
      item-title="username"
      item-value="id"
      label="ผู้เบิก"
      density="compact"
      clearable
      style="max-width: 200px"
      class="mr-2 mt-6"
    />
    
    <!-- Category Filter -->
    <v-select
      v-model="selectedCategory"
      :items="categoryOptions"
      item-title="title"
      item-value="value"
      label="หมวดหมู่"
      density="compact"
      clearable
      style="max-width: 200px"
      class="mr-2 mt-6"
    />

    <!-- Item Filter -->
    <v-autocomplete
      v-model="selectedItem"
      :items="filteredItemOptions"
      item-title="name"
      item-value="id"
      label="รายการ"
      density="compact"
      clearable
      style="max-width: 250px"
      class="mr-2 mt-6"
      placeholder="พิมพ์เพื่อค้นหา"
      no-data-text="ไม่มีรายการในหมวดหมู่นี้"
    />

    <!-- Status Filter -->
    <v-select
      v-model="selectedStatus"
      :items="statusOptions"
      label="สถานะ"
      density="compact"
      clearable
      style="max-width: 200px"
      class="mr-4 mt-6"
    />
  </v-app-bar>

  <v-container fluid class="pa-4">
    <!-- Loading State -->
    <v-row v-if="loading">
      <v-col cols="12" class="text-center">
        <v-progress-circular indeterminate color="primary" size="64" />
        <div class="mt-4">กำลังโหลดข้อมูล...</div>
      </v-col>
    </v-row>

    <!-- Error State -->
    <v-row v-else-if="error">
      <v-col cols="12">
        <v-alert type="error" prominent>
          <v-alert-title>เกิดข้อผิดพลาด</v-alert-title>
          {{ error.message || error }}
        </v-alert>
      </v-col>
    </v-row>

    <!-- No Data State -->
    <v-row v-else-if="!filteredRequisitions.length">
      <v-col cols="12" class="text-center">
        <v-icon size="64" color="grey-lighten-1">mdi-history</v-icon>
        <div class="text-h6 mt-4 text-grey-darken-1">
          {{ hasActiveFilters ? 'ไม่มีข้อมูลตามเงื่อนไขที่กำหนด' : 'ไม่มีประวัติการเบิกใช้' }}
        </div>
      </v-col>
    </v-row>

    <!-- Data Table -->
    <v-row v-else>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-history</v-icon>
            ประวัติการเบิกใช้ ({{ filteredRequisitions.length }} รายการ)
          </v-card-title>
          
          <v-data-table
            :headers="headers"
            :items="filteredRequisitions"
            :items-per-page="10"
            :sort-by="[{ key: 'createdAt', order: 'desc' }]"
            class="elevation-1"
            item-key="id"
          >
            <!-- User Column -->
            <template v-slot:item.inventory_user="{ item }">
              <div>
                <div class="font-weight-medium">{{ item.inventory_user?.username }}</div>
                <div class="text-caption text-grey-darken-1">{{ item.inventory_user?.email }}</div>
              </div>
            </template>

            <!-- Created Date Column -->
            <template v-slot:item.createdAt="{ item }">
              <v-chip 
                size="small"
              >
                {{ formatDate(item.createdAt) }}
              </v-chip>
            </template>

            <!-- Pickup/Cancel Time Column -->
            <template v-slot:item.pickupCancelTime="{ item }">
              <v-chip 
                v-if="item.reqstatus === 'completed' && item.pickupTime" 
                size="small" 
                color="blue"
              >
                {{ formatDate(item.pickupTime) }}
              </v-chip>
              <v-chip 
                v-else-if="item.reqstatus === 'cancelled' && item.cancelTime" 
                size="small" 
                color="red"
              >
                {{ formatDate(item.cancelTime) }}
              </v-chip>
              <span v-else>-</span>
            </template>

            <!-- Items Column -->
            <template v-slot:item.requisition_items="{ item }">
              <div>
                <div v-for="reqItem in item.requisition_items" :key="reqItem.id" class="mb-1">
                  <span class="font-weight-medium">{{ reqItem.item?.name }}</span>
                  <span class="text-grey-darken-1"> × {{ reqItem.quantity }} {{ reqItem.item?.unit }}</span>
                </div>
              </div>
            </template>

            <!-- Status Column -->
            <template v-slot:item.reqstatus="{ item }">
              <v-chip
                :color="getStatusColor(item.reqstatus)"
                :text="getStatusText(item.reqstatus)"
              />
            </template>

            <!-- Actions Column -->
            <template v-slot:item.actions="{ item }">
              <v-btn
                icon="mdi-eye"
                variant="text"
                size="small"
                @click="showDetails(item)"
              />
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <!-- Details Dialog -->
    <v-dialog v-model="showDetailsDialog" max-width="800">
      <v-card v-if="selectedRequisition">
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-pencil-outline</v-icon>
          รายละเอียดการเบิกใช้
        </v-card-title>

        <v-card-text>
          <v-row>
            <v-col cols="6">
              <v-list-item>
                <v-list-item-title class="text-caption">สถานะ</v-list-item-title>
                <v-chip
                  :color="getStatusColor(selectedRequisition.reqstatus)"
                  :text="getStatusText(selectedRequisition.reqstatus)"
                  size="small"
                />
              </v-list-item>
            </v-col>
            <v-col cols="6">
              <v-list-item>
                <v-list-item-title class="text-caption">ผู้เบิก</v-list-item-title>
                <v-list-item-subtitle>{{ selectedRequisition.inventory_user?.username }}</v-list-item-subtitle>
                <v-list-item-subtitle>{{ selectedRequisition.inventory_user?.email }}</v-list-item-subtitle>
              </v-list-item>
            </v-col>
            <v-col cols="6">
              <v-list-item>
                <v-list-item-title class="text-caption">วันที่สร้าง</v-list-item-title>
                <v-list-item-subtitle>{{ formatDate(selectedRequisition.createdAt) }}</v-list-item-subtitle>
              </v-list-item>
            </v-col>
            <v-col cols="6" v-if="selectedRequisition.reqstatus !== 'awaitPickup'">
              <v-list-item>
                <v-list-item-title class="text-caption">
                  <span v-if="selectedRequisition.reqstatus === 'completed'">วันที่รับ</span>
                  <span v-else-if="selectedRequisition.reqstatus === 'cancelled'">วันที่ยกเลิก</span>
                </v-list-item-title>
                <v-list-item-subtitle>
                  <span v-if="selectedRequisition.reqstatus === 'completed' && selectedRequisition.pickupTime">
                    {{ formatDate(selectedRequisition.pickupTime) }}
                  </span>
                  <span v-else-if="selectedRequisition.reqstatus === 'cancelled' && selectedRequisition.cancelTime">
                    {{ formatDate(selectedRequisition.cancelTime) }}
                  </span>
                  <span v-else>-</span>
                </v-list-item-subtitle>
              </v-list-item>
            </v-col>
          </v-row>

          <v-divider class="my-4" />

          <div class="text-h6 mb-3">รายการที่เบิก</div>
          <v-list>
            <v-list-item
              v-for="reqItem in selectedRequisition.requisition_items"
              :key="reqItem.id"
              class="border rounded mb-2"
            >
              <template v-slot:prepend>
                <v-avatar size="40" rounded="lg">
                  <v-img
                    :src="getItemImage(reqItem.item)"
                    alt="Item image"
                  />
                </v-avatar>
              </template>

              <v-list-item-title>{{ reqItem.item?.name }}</v-list-item-title>
              <v-list-item-subtitle>
                จำนวน: {{ reqItem.quantity }} {{ reqItem.item?.unit }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>

          <div v-if="selectedRequisition.reqDescription" class="mt-4">
            <div class="text-h6 mb-2">หมายเหตุ</div>
            <div class="text-body-2 bg-grey-lighten-4 pa-3 rounded">
              {{ selectedRequisition.reqDescription }}
            </div>
          </div>
        </v-card-text>

        <v-card-actions>
          <div v-if="selectedRequisition.reqstatus === 'awaitPickup'" class="d-flex gap-2 mb-2">
            <v-btn
              prepend-icon="mdi-check"
              class="mr-2"
              color="blue"
              variant="elevated"
              @click="markAsReceived(selectedRequisition)"
              :loading="actionLoading"
            >
              รับวัสดุแล้ว
            </v-btn>
            <v-btn
              prepend-icon="mdi-cancel"
              class="mr-2"
              color="error"
              variant="tonal"
              @click="cancelRequisition(selectedRequisition)"
              :loading="actionLoading"
            >
              ยกเลิกการเบิก
            </v-btn>
            <v-btn
            color="primary"
            @click="showDetailsDialog = false"
            >
              ปิด
            </v-btn>
          </div>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
definePageMeta({ middleware: 'auth' })

// Imports
import { ref, onMounted, computed, watch } from 'vue'
import { useRuntimeConfig } from '#app'

// Configuration
const config = useRuntimeConfig()
const API_BASE_URL = config.public.apiUrl
const API_BEARER_TOKEN = config.public.apiToken

// Reactive data
const requisitions = ref([])
const users = ref([])
const items = ref([])
const loading = ref(true)
const error = ref(null)

// Filter & Dialog states
const selectedStatus = ref(null)
const selectedUser = ref(null)
const selectedCategory = ref(null)
const selectedItem = ref(null)
const showDetailsDialog = ref(false)
const selectedRequisition = ref(null)
const actionLoading = ref(false)

// Static data
const statusOptions = ref([
  { title: 'รอรับวัสดุ', value: 'awaitPickup' },
  { title: 'รับวัสดุแล้ว', value: 'completed' },
  { title: 'ยกเลิกการเบิก', value: 'cancelled' }
])

const headers = ref([
  { title: 'ผู้เบิก', key: 'inventory_user', width: '200px' },
  { title: 'วันที่ขอเบิก', key: 'createdAt', width: '150px' },
  { title: 'วันที่รับ/วันที่ยกเลิก', key: 'pickupCancelTime', width: '180px' },
  { title: 'รายการ', key: 'requisition_items', width: '300px' },
  { title: 'สถานะการเบิก', key: 'reqstatus', width: '140px' },
  { title: '', key: 'actions', width: '100px', sortable: false }
])

// Computed properties
const userOptions = computed(() => 
  users.value.map(user => ({
    id: user.id,
    username: user.username,
    email: user.email
  }))
)

const categoryOptions = computed(() => {
  // Extract unique categories from all items in requisitions
  const categories = new Set()
  
  requisitions.value.forEach(req => {
    req.requisition_items?.forEach(reqItem => {
      if (reqItem.item?.category) {
        categories.add(reqItem.item.category)
      }
    })
  })
  
  return Array.from(categories)
    .sort((a, b) => a.localeCompare(b, 'th'))
    .map(category => ({
      title: category || 'ไม่ระบุหมวดหมู่',
      value: category
    }))
})

const filteredItemOptions = computed(() => {
  let itemsToShow = items.value
  
  // If category is selected, filter items by category
  if (selectedCategory.value) {
    // Get all items from requisitions that match the selected category
    const categoryItems = new Set()
    requisitions.value.forEach(req => {
      req.requisition_items?.forEach(reqItem => {
        if (reqItem.item?.category === selectedCategory.value) {
          categoryItems.add(reqItem.item.id)
        }
      })
    })
    itemsToShow = items.value.filter(item => categoryItems.has(item.id))
  }
  
  return itemsToShow.map(item => ({
    id: item.id,
    name: item.name,
    category: item.category
  }))
})

const hasActiveFilters = computed(() => 
  selectedStatus.value || selectedUser.value || selectedCategory.value || selectedItem.value
)

const filteredRequisitions = computed(() => {
  let filtered = [...requisitions.value]

  // Status filter
  if (selectedStatus.value) {
    filtered = filtered.filter(req => req.reqstatus === selectedStatus.value)
  }

  // User filter
  if (selectedUser.value) {
    filtered = filtered.filter(req => req.inventory_user?.id === selectedUser.value)
  }

  // Category filter
  if (selectedCategory.value) {
    filtered = filtered.filter(req => 
      req.requisition_items?.some(ri => ri.item?.category === selectedCategory.value)
    )
  }

  // Item filter
  if (selectedItem.value) {
    filtered = filtered.filter(req => 
      req.requisition_items?.some(ri => ri.item?.id === selectedItem.value)
    )
  }

  return filtered
})

// API Functions
const fetchRequisitions = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/requisitions?populate[inventory_user]=*&populate[requisition_items][populate]=item`, {
      headers: {
        Authorization: `Bearer ${API_BEARER_TOKEN}`
      }
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error?.message || 'Failed to fetch requisitions')
    requisitions.value = data.data || []
  } catch (e) {
    console.error('Error fetching requisitions:', e)
    throw e
  }
}

const fetchUsers = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/inventory-users`, {
      headers: {
        Authorization: `Bearer ${API_BEARER_TOKEN}`
      }
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error?.message || 'Failed to fetch users')
    users.value = data.data || []
  } catch (e) {
    console.error('Error fetching users:', e)
    throw e
  }
}

const fetchItems = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/items?populate=*`, {
      headers: {
        Authorization: `Bearer ${API_BEARER_TOKEN}`
      }
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error?.message || 'Failed to fetch items')
    
    // Process items to extract image URLs (same pattern as manage/index.vue)
    const processedItems = data.data?.map(item => {
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
      return { ...item, imageUrl }
    }) || []
    
    items.value = processedItems
  } catch (e) {
    console.error('Error fetching items:', e)
    throw e
  }
}

const fetchAllData = async () => {
  loading.value = true
  error.value = null
  
  try {
    await Promise.all([
      fetchRequisitions(),
      fetchUsers(),
      fetchItems()
    ])
  } catch (e) {
    error.value = e
  } finally {
    loading.value = false
  }
}

// Utility Functions
const getStatusColor = (status) => {
  switch (status) {
    case 'awaitPickup': return 'orange'
    case 'cancelled': return 'red'
    case 'completed': return 'blue'
    default: return 'grey'
  }
}

const getStatusText = (status) => {
  switch (status) {
    case 'completed': return 'รับวัสดุแล้ว'
    case 'awaitPickup': return 'รอรับวัสดุ'
    case 'cancelled': return 'ยกเลิกการเบิก'
    default: return status
  }
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  
  return `${day}/${month}/${year} ${hours}:${minutes}`
}

const getItemImage = (item) => {
  // Check if item has imageUrl from processed items data
  if (item?.id) {
    const foundItem = items.value.find(i => i.id === item.id)
    if (foundItem?.imageUrl) {
      return foundItem.imageUrl
    }
  }
  
  // Fallback to placeholder image
  return '/No_image_available.png'
}

// Action Functions
const markAsReceived = async (requisition) => {
  try {
    actionLoading.value = true
    const currentTime = new Date().toISOString()
    
    const response = await fetch(`${API_BASE_URL}/api/requisitions/${requisition.documentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_BEARER_TOKEN}`
      },
      body: JSON.stringify({
        data: {
          reqstatus: "completed",
          pickupTime: currentTime
        }
      })
    })
    
    if (response.ok) {
      console.log('Requisition marked as completed successfully')
      showDetailsDialog.value = false
      await fetchAllData()
    } else {
      console.error('Failed to mark requisition as completed')
    }
  } catch (error) {
    console.error('Error marking requisition as completed:', error)
  } finally {
    actionLoading.value = false
  }
}

const cancelRequisition = async (requisition) => {
  try {
    actionLoading.value = true
    
    // Process each requisition item to restore stock quantities
    for (const reqItem of requisition.requisition_items) {
      try {
        // Get current stock quantity for the item
        const itemResponse = await fetch(
          `${API_BASE_URL}/api/items/${reqItem.item.documentId}?fields=stockqnt`,
          {
            headers: {
              Authorization: `Bearer ${API_BEARER_TOKEN}`
            }
          }
        )
        const itemData = await itemResponse.json()
        
        if (itemResponse.ok && itemData.data) {
          // Calculate new stock (current stock + requisition quantity)
          const currentStock = itemData.data.stockqnt
          const requisitionQuantity = reqItem.quantity
          const newStock = currentStock + requisitionQuantity
          
          // Update item's stock quantity
          const updateStockResponse = await fetch(
            `${API_BASE_URL}/api/items/${reqItem.item.documentId}`,
            {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${API_BEARER_TOKEN}`
              },
              body: JSON.stringify({
                data: {
                  stockqnt: newStock
                }
              })
            }
          )
          
          if (updateStockResponse.ok) {
            console.log(`Stock updated for item ${reqItem.item.documentId}: ${currentStock} + ${requisitionQuantity} = ${newStock}`)
          } else {
            console.error(`Failed to update stock for item ${reqItem.item.documentId}`)
          }
        }
      } catch (error) {
        console.error(`Error processing requisition item ${reqItem.id}:`, error)
      }
    }
    
    // Update requisition status to cancelled
    const response = await fetch(`${API_BASE_URL}/api/requisitions/${requisition.documentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_BEARER_TOKEN}`
      },
      body: JSON.stringify({
        data: {
          reqstatus: "cancelled",
          cancelTime: new Date().toISOString()
        }
      })
    })
    
    if (response.ok) {
      console.log('Requisition cancelled successfully')
      showDetailsDialog.value = false
      await fetchAllData()
    } else {
      console.error('Failed to cancel requisition')
    }
  } catch (error) {
    console.error('Error cancelling requisition:', error)
  } finally {
    actionLoading.value = false
  }
}

// Event Handlers
const clearFilters = () => {
  selectedStatus.value = null
  selectedUser.value = null
  selectedCategory.value = null
  selectedItem.value = null
}

// Clear item selection when category changes to avoid invalid combinations
watch(selectedCategory, (newCategory, oldCategory) => {
  if (newCategory !== oldCategory && selectedItem.value) {
    // Check if the currently selected item is still valid in the new category
    const isItemValidInCategory = filteredItemOptions.value.some(item => item.id === selectedItem.value)
    if (!isItemValidInCategory) {
      selectedItem.value = null
    }
  }
})

const showDetails = (requisition) => {
  selectedRequisition.value = requisition
  showDetailsDialog.value = true
}

// Lifecycle Hooks
onMounted(fetchAllData)
</script>