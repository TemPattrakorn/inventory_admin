<template>
  <v-app-bar title="ประวัติการเบิกใช้">
    <v-btn
      @click="showAdvancedFilters = !showAdvancedFilters"
      :prepend-icon="showAdvancedFilters ? 'mdi-filter-settings' : 'mdi-filter-plus'"
      variant="tonal"
      class="mr-4"
    >
      ตัวกรอง
      <v-chip
        v-if="activeFilterCount > 0"
        :text="activeFilterCount.toString()"
        size="small"
        color="primary"
        class="ml-2"
      />
    </v-btn>
  </v-app-bar>
  
  <!-- All Filters - Collapsible -->
  <v-expand-transition>
    <v-card 
      v-show="showAdvancedFilters" 
      class="mx-4 mt-4"
      elevation="2"
    >
      <v-card-text class="pt-4">
        <!-- Basic Filters -->
        <div>
          <h6 class="text-subtitle-2 text-grey-darken-2 mb-2">
            <v-icon size="small" class="mr-1">mdi-filter</v-icon>
            ผู้เบิก/สถานะการเบิก
          </h6>
          <v-row>
            <v-col cols="12" md="6">
              <v-select
                v-model="selectedUser"
                :items="userOptions"
                item-title="username"
                item-value="id"
                label="ผู้เบิก"
                density="compact"
                clearable
                prepend-inner-icon="mdi-account"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                v-model="selectedStatus"
                :items="statusOptions"
                label="สถานะ"
                density="compact"
                clearable
                prepend-inner-icon="mdi-information"
                variant="outlined"
              />
            </v-col>
            
          </v-row>
        </div>

        <!-- Items & Categories -->
        <div>
          <h6 class="text-subtitle-2 text-grey-darken-2 mb-2">
            <v-icon size="small" class="mr-1">mdi-package-variant</v-icon>
            รายการและหมวดหมู่
          </h6>
          <v-row>
            
            <v-col cols="12" md="6">
              <v-text-field
                v-model="itemSearchText"
                label="ค้นหารายการ"
                density="compact"
                clearable
                placeholder="พิมพ์เพื่อค้นหาในรายการ"
                prepend-inner-icon="mdi-package"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-select
                v-model="selectedCategory"
                :items="categoryOptions"
                item-title="title"
                item-value="value"
                label="หมวดหมู่"
                density="compact"
                clearable
                prepend-inner-icon="mdi-tag"
                variant="outlined"
              />
            </v-col>

          </v-row>
        </div>

        <!-- Date Filters -->
        <div>
          <v-row no-gutters>
            <v-col class="d-flex align-center">
              <div class="d-flex align-center">
                <v-icon size="small" color="grey-darken-1" class="mr-2">mdi-calendar-range</v-icon>
                <span class="text-subtitle-2 text-grey-darken-2">วันที่ขอเบิก</span>
              </div>
              <v-spacer />
              <v-switch
                v-model="isDateRangeMode"
                label="ค้นหาแบบช่วงวันที่"
                density="compact"
                color="primary"
                hide-details
              />
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12" md="6">
              <v-menu
                v-model="startDateMenu"
                :close-on-content-click="false"
                transition="scale-transition"
                offset-y
                min-width="auto"
              >
                <template v-slot:activator="{ props }">
                  <v-text-field
                    v-model="formattedStartDate"
                    :label="isDateRangeMode ? 'วันที่เริ่มต้น' : 'เลือกวันที่'"
                    prepend-inner-icon="mdi-calendar"
                    readonly
                    v-bind="props"
                    density="compact"
                    clearable
                    variant="outlined"
                    @click:clear="startDate = null"
                  />
                </template>
                <v-date-picker
                  v-model="startDate"
                  @update:model-value="startDateMenu = false"
                  no-title
                  scrollable
                />
              </v-menu>
            </v-col>
            
            <v-col v-if="isDateRangeMode" cols="12" md="6">
              <v-menu
                v-model="endDateMenu"
                :close-on-content-click="false"
                transition="scale-transition"
                offset-y
                min-width="auto"
              >
                <template v-slot:activator="{ props }">
                  <v-text-field
                    v-model="formattedEndDate"
                    label="วันที่สิ้นสุด"
                    prepend-inner-icon="mdi-calendar"
                    readonly
                    v-bind="props"
                    density="compact"
                    clearable
                    variant="outlined"
                    @click:clear="endDate = null"
                  />
                </template>
                <v-date-picker
                  v-model="endDate"
                  @update:model-value="endDateMenu = false"
                  no-title
                  scrollable
                />
              </v-menu>
            </v-col>
          </v-row>
        </div>



        <!-- Filter Actions -->
        <div class="d-flex justify-end">
          <v-btn
            v-if="hasActiveFilters"
            @click="clearFilters"
            prepend-icon="mdi-filter-remove"
            variant="tonal"
            class="mr-2"
          >
            ล้างตัวกรองทั้งหมด
          </v-btn>
          <v-btn
            @click="showAdvancedFilters = false"
            prepend-icon="mdi-chevron-up"
            color="primary"
            variant="tonal"
          >
            ย่อตัวกรอง
          </v-btn>
        </div>
      </v-card-text>
    </v-card>
  </v-expand-transition>

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
                
              >
                {{ formatDate(item.createdAt) }}
              </v-chip>
            </template>

            <!-- Pickup/Cancel Time Column -->
            <template v-slot:item.pickupCancelTime="{ item }">
              <v-chip 
                v-if="item.reqstatus === 'completed' && item.pickupTime" 
                
                color="blue"
              >
                {{ formatDate(item.pickupTime) }}
              </v-chip>
              <v-chip 
                v-else-if="item.reqstatus === 'cancelled' && item.cancelTime" 
                
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
                <v-list-item-title class="text-caption">ผู้ขอเบิก</v-list-item-title>
                <v-list-item-subtitle>{{ selectedRequisition.inventory_user?.username }}</v-list-item-subtitle>
                <v-list-item-subtitle>{{ selectedRequisition.inventory_user?.email }}</v-list-item-subtitle>
              </v-list-item>
            </v-col>
            <v-col cols="6">
              <v-list-item>
                <v-list-item-title class="text-caption">วันที่ขอเบิก</v-list-item-title>
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
            <div class="text-h6 mb-2">เพื่อใช้ในงาน</div>
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
              color="primary"
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
            class="mr-4"
            variant="tonal"
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
import { formatDateTimeThai, formatDateThai } from '~/utils/date'

// Configuration
const config = useRuntimeConfig()
const API_BASE_URL = config.public.apiUrl
const API_BEARER_TOKEN = config.public.apiToken

// Reactive data
const requisitions = ref([])
const users = ref([])

const loading = ref(true)
const error = ref(null)

// Filter & Dialog states
const selectedStatus = ref(null)
const selectedUser = ref(null)
const selectedCategory = ref(null)
const itemSearchText = ref("")
const startDate = ref(null)
const endDate = ref(null)
const startDateMenu = ref(false)
const endDateMenu = ref(false)
const isDateRangeMode = ref(false)

const showAdvancedFilters = ref(false)
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
  { title: 'วันที่ขอเบิก', key: 'createdAt', width: '150px' },
  { title: 'วันที่รับ/วันที่ยกเลิก', key: 'pickupCancelTime', width: '180px' },
  { title: 'ชื่อผู้ขอเบิก', key: 'inventory_user', width: '200px' },
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



const hasActiveFilters = computed(() => 
  selectedStatus.value || selectedUser.value || selectedCategory.value || itemSearchText.value || startDate.value || endDate.value
)

const activeFilterCount = computed(() => {
  let count = 0
  if (selectedStatus.value) count++
  if (selectedUser.value) count++
  if (selectedCategory.value) count++
  if (itemSearchText.value) count++
  if (startDate.value) count++
  if (endDate.value) count++
  return count
})

// Computed properties for formatted dates
const formattedStartDate = computed(() => formatDateThai(startDate.value, 'short'))

const formattedEndDate = computed(() => formatDateThai(endDate.value, 'short'))



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

  // Item search filter
  if (itemSearchText.value) {
    const searchText = itemSearchText.value.toLowerCase()
    filtered = filtered.filter(req => 
      req.requisition_items?.some(ri => 
        ri.item?.name?.toLowerCase().includes(searchText)
      )
    )
  }

  // Date filter (single day or range)
  if (startDate.value) {
    filtered = filtered.filter(req => {
      if (!req.createdAt) return false
      
      const reqDate = new Date(req.createdAt)
      const reqDateOnly = new Date(reqDate.getFullYear(), reqDate.getMonth(), reqDate.getDate())
      const start = new Date(startDate.value)
      const startDateOnly = new Date(start.getFullYear(), start.getMonth(), start.getDate())
      
      if (!isDateRangeMode.value) {
        // Single day mode - exact match
        return reqDateOnly.getTime() === startDateOnly.getTime()
      } else {
        // Range mode
        if (reqDateOnly < startDateOnly) return false
        
        // Check end date if in range mode and end date is set
        if (endDate.value) {
          const end = new Date(endDate.value)
          const endDateOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate())
          if (reqDateOnly > endDateOnly) return false
        }
        
        return true
      }
    })
  }



  return filtered
})

// API Functions
const fetchRequisitions = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/requisitions?populate[inventory_user]=*&populate[requisition_items][populate][item][populate]=imgpath`, {
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



const fetchAllData = async () => {
  loading.value = true
  error.value = null
  
  try {
    await Promise.all([
      fetchRequisitions(),
      fetchUsers()
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

const formatDate = (dateString) => formatDateTimeThai(dateString)

const getItemImage = (item) => {
  const thumbnailUrl = item?.imgpath?.[0]?.formats?.thumbnail?.url
  if (thumbnailUrl) return `${API_BASE_URL}${thumbnailUrl}`

  const originalUrl = item?.imgpath?.[0]?.url
  if (originalUrl) return `${API_BASE_URL}${originalUrl}`

  return '/No_image_available.png'
}

// Helper functions for chip display names
const getCategoryDisplayName = (categoryValue) => {
  const category = categoryOptions.value.find(cat => cat.value === categoryValue)
  return category ? category.title : categoryValue
}



const getStatusDisplayName = (statusValue) => {
  const status = statusOptions.value.find(status => status.value === statusValue)
  return status ? status.title : statusValue
}

const getUserDisplayName = (userId) => {
  const user = userOptions.value.find(user => user.id === userId)
  return user ? user.username : 'Unknown User'
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
  itemSearchText.value = ""
  startDate.value = null
  endDate.value = null
  startDateMenu.value = false
  endDateMenu.value = false
  isDateRangeMode.value = false

  showAdvancedFilters.value = false
}



const showDetails = (requisition) => {
  selectedRequisition.value = requisition
  showDetailsDialog.value = true
}

// Lifecycle Hooks
onMounted(fetchAllData)
</script>