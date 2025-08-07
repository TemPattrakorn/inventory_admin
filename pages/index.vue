<template>
  <div class="split-layout">
    <div class="split-left">
      <v-card class="fill-height d-flex flex-column">
        <v-card-title class="text-h5 pa-4 d-flex justify-space-between align-center">
          <span>คำขอเบิกวัสดุ</span>
          <span class="text-body-1 text-grey-darken-1">{{ tableItems.length }} คำขอเบิก</span>
        </v-card-title>
        <v-data-table
          :headers="headers"
          :items="tableItems"
          :loading="loading"
          :items-per-page="-1"
          :sort-by="[{ key: 'createdAt', order: 'desc' }]"
          class="elevation-1 flex-grow-1"
          item-key="id"
          fixed-header
          height="calc(100% - 64px)"
        >
          <template v-slot:item.createdAt="{ item }">
            <v-chip size="small">{{ formatDate(item.createdAt) }}</v-chip>
          </template>
          <template v-slot:item.username="{ item }">
            <div>
              <div class="font-weight-medium">{{ item.username }}</div>
              <div class="text-caption text-grey-darken-1">{{ item.email }}</div>
            </div>
          </template>
          <template v-slot:item.items="{ item }">
            <div>
              <div v-for="reqItem in item.items" :key="reqItem.id" class="mb-1">
                <span class="font-weight-medium">{{ reqItem.name }}</span>
                <span class="text-grey-darken-1"> x {{ reqItem.quantity }} {{ reqItem.unit }}</span>
              </div>
            </div>
          </template>
          <template v-slot:item.actions="{ item }">
            <div class="d-flex gap-2 justify-end">
              <v-btn prepend-icon="mdi-check" class="mr-2" color="primary" size="small" @click="markAsReceived(item)">รับวัสดุแล้ว</v-btn>
              <v-btn prepend-icon="mdi-cancel" class="ml-2" color="error" size="small" variant="tonal" @click="openCancelDialog(item)">ยกเลิกการเบิก</v-btn>
            </div>
          </template>
          <template v-slot:no-data>
            <div class="text-center pa-4">
              <v-icon size="48" color="grey-lighten-1" class="mb-2">mdi-history</v-icon>
              <p class="text-medium-emphasis">ไม่มีคำขอเบิกวัสดุ</p>
            </div>
          </template>
        </v-data-table>
      </v-card>
    </div>

    <div class="split-right">
      <v-row class="fill-height" no-gutters>
        <v-col cols="12" class="d-flex flex-column pa-2" style="height: 50%;">
          <v-card class="flex-grow-1 d-flex flex-column">
            <v-card-title class="text-h6 pa-4 d-flex justify-space-between align-center">
              <span><v-icon color="warning" class="mr-2">mdi-alert-outline</v-icon>วัสดุใกล้หมด</span>
              <span class="text-body-1 text-grey-darken-1">{{ nearlyDepletedItems.length }} รายการ</span>
            </v-card-title>
            <v-list v-if="!itemsLoading" style="overflow-y: auto;">
              <ItemCard v-for="item in nearlyDepletedItems" :key="item.id" :item="item" :image-url="getItemImage(item)" @updated="fetchItems" @deleted="fetchItems" />
              <v-list-item v-if="nearlyDepletedItems.length === 0"><v-list-item-title class="text-center text-grey-darken-1">ไม่มีวัสดุที่ใกล้หมด</v-list-item-title></v-list-item>
            </v-list>
            <div v-else class="d-flex justify-center align-center flex-grow-1"><v-progress-circular indeterminate color="primary"></v-progress-circular></div>
          </v-card>
        </v-col>
        <v-col cols="12" class="d-flex flex-column pa-2" style="height: 50%;">
          <v-card class="flex-grow-1 d-flex flex-column">
            <v-card-title class="text-h6 pa-4 d-flex justify-space-between align-center">
              <span><v-icon color="error" class="mr-2">mdi-alert-circle-outline</v-icon>วัสดุหมด</span>
              <span class="text-body-1 text-grey-darken-1">{{ depletedItems.length }} รายการ</span>
            </v-card-title>
            <v-list v-if="!itemsLoading" style="overflow-y: auto;">
              <ItemCard v-for="item in depletedItems" :key="item.id" :item="item" :image-url="getItemImage(item)" @updated="fetchItems" @deleted="fetchItems" />
              <v-list-item v-if="depletedItems.length === 0"><v-list-item-title class="text-center text-grey-darken-1">ไม่มีวัสดุที่หมด</v-list-item-title></v-list-item>
            </v-list>
            <div v-else class="d-flex justify-center align-center flex-grow-1"><v-progress-circular indeterminate color="primary"></v-progress-circular></div>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <v-dialog v-model="showCancelDialog" max-width="600px">
      <v-card>
        <v-card-title class="text-h5 pa-4 text-error"><v-icon class="mr-2 text-error">mdi-delete</v-icon>ลบคำขอเบิกวัสดุ</v-card-title>
        <v-card-text>
          <div>
            <p class="text-body-2 mb-2">ผู้ขอเบิก: {{ selectedItemToCancel?.username }}</p>
            <p class="text-body-2 mb-2">อีเมล: {{ selectedItemToCancel?.email }}</p>
            <p class="text-body-2 mb-4">วันที่ขอเบิก: {{ selectedItemToCancel ? formatDate(selectedItemToCancel.createdAt) : '' }}</p>
          </div>
          <v-divider class="mb-3"/>
          <div>
            <h6 class="text-h6 mb-2">รายการวัสดุในคำขอเบิก:</h6>
            <v-list density="compact" class="bg-grey-lighten-4 rounded">
              <v-list-item v-for="(reqItem, index) in selectedItemToCancel?.items" :key="reqItem.id" :class="{ 'border-b': index < selectedItemToCancel.items.length - 1 }">
                <v-list-item-title class="text-body-2">{{ reqItem.name }}</v-list-item-title>
                <template v-slot:append><v-chip size="small">{{ reqItem.quantity }} {{ reqItem.unit }}</v-chip></template>
              </v-list-item>
            </v-list>
          </div>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="tonal" @click="closeCancelDialog">ยกเลิก</v-btn>
          <v-btn class="mr-2" color="error" variant="elevated" @click="confirmCancelRequisition" :loading="cancelLoading">ยืนยันการลบ</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRuntimeConfig } from '#app'
import ItemCard from '~/components/mainpage/itemCard.vue'

definePageMeta({ middleware: 'auth' })

const config = useRuntimeConfig()
const API_BASE_URL = config.public.apiUrl
const API_BEARER_TOKEN = config.public.apiToken

const loading = ref(false)
const tableItems = ref([])
const allItems = ref([])
const itemsLoading = ref(false)

const showCancelDialog = ref(false)
const selectedItemToCancel = ref(null)
const cancelLoading = ref(false)

const headers = ref([
  { title: 'วันที่ขอเบิก', key: 'createdAt', align: 'start', sortable: true },
  { title: 'ชื่อผู้ขอเบิก', key: 'username', align: 'start', sortable: true },
  { title: 'รายการ', key: 'items', align: 'start', sortable: false, maxWidth: '420px' },
  { title: 'เพื่อใช้ในงาน', key: 'reqDescription', align: 'start', sortable: false, maxWidth: '420px' },
  { key: 'actions', align: 'center', sortable: false },
])

const fetchRequisitions = async () => {
  loading.value = true
  try {
    const response = await fetch(`${API_BASE_URL}/api/requisitions?populate=*`, { headers: { Authorization: `Bearer ${API_BEARER_TOKEN}` } })
    const data = await response.json()
    const awaitPickupRequisitions = data.data.filter(req => req.reqstatus === 'awaitPickup')
    const processedItems = await Promise.all(
      awaitPickupRequisitions.map(async (requisition) => {
        const itemsWithDetails = await Promise.all(
          requisition.requisition_items.map(async (reqItem) => {
            try {
              const itemResponse = await fetch(`${API_BASE_URL}/api/requisition-items/${reqItem.documentId}?populate[item][fields]=name,unit`, { headers: { Authorization: `Bearer ${API_BEARER_TOKEN}` } })
              const itemData = await itemResponse.json()
              return { id: reqItem.id, documentId: reqItem.documentId, quantity: reqItem.quantity, name: itemData.data.item.name, unit: itemData.data.item.unit }
            } catch (error) {
              console.error('Error fetching item details:', error)
              return { id: reqItem.id, documentId: reqItem.documentId, quantity: reqItem.quantity, name: 'ไม่สามารถโหลดข้อมูลได้', unit: '' }
            }
          })
        )
        return { id: requisition.id, documentId: requisition.documentId, username: requisition.inventory_user.username, email: requisition.inventory_user.email, reqDescription: requisition.reqDescription?.trim() || '-', items: itemsWithDetails, createdAt: requisition.createdAt, originalData: requisition }
      })
    )
    tableItems.value = processedItems
  } catch (error) {
    console.error('Error fetching requisitions:', error)
  } finally {
    loading.value = false
  }
}

const fetchItems = async () => {
  itemsLoading.value = true
  try {
    const res = await fetch(`${API_BASE_URL}/api/items?populate=imgpath`, { headers: { Authorization: `Bearer ${API_BEARER_TOKEN}` } })
    const data = await res.json()
    allItems.value = data.data
  } catch (e) {
    console.error('Error fetching items:', e)
  } finally {
    itemsLoading.value = false
  }
}

const getItemImage = (item) => {
  if (item?.imgpath?.[0]?.formats?.thumbnail?.url) return `${API_BASE_URL}${item.imgpath[0].formats.thumbnail.url}`
  if (item?.imgpath?.[0]?.url) return `${API_BASE_URL}${item.imgpath[0].url}`
  return '/No_image_available.png'
}

const nearlyDepletedItems = computed(() => allItems.value.filter(item => item.stockqnt <= item.minqnt && item.stockqnt > 0).sort((a, b) => a.name.localeCompare(b.name, 'th')))
const depletedItems = computed(() => allItems.value.filter(item => item.stockqnt === 0).sort((a, b) => a.name.localeCompare(b.name, 'th')))

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

const markAsReceived = async (item) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/requisitions/${item.documentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_BEARER_TOKEN}` },
      body: JSON.stringify({ data: { reqstatus: "completed", pickupTime: new Date().toISOString() } })
    })
    if (response.ok) await fetchRequisitions()
    else console.error('Failed to mark requisition as completed')
  } catch (error) {
    console.error('Error marking requisition as completed:', error)
  }
}

const cancelRequisition = async (item) => {
  try {
    for (const reqItem of item.items) {
      try {
        const reqItemResponse = await fetch(`${API_BASE_URL}/api/requisition-items/${reqItem.documentId}?populate[item][fields]=stockqnt`, { headers: { Authorization: `Bearer ${API_BEARER_TOKEN}` } })
        const reqItemData = await reqItemResponse.json()
        if (reqItemResponse.ok && reqItemData.data) {
          const newStock = reqItemData.data.item.stockqnt + reqItemData.data.quantity
          await fetch(`${API_BASE_URL}/api/items/${reqItemData.data.item.documentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_BEARER_TOKEN}` },
            body: JSON.stringify({ data: { stockqnt: newStock } })
          })
        }
      } catch (error) {
        console.error(`Error processing requisition item ${reqItem.documentId}:`, error)
      }
    }
    const response = await fetch(`${API_BASE_URL}/api/requisitions/${item.documentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_BEARER_TOKEN}` },
      body: JSON.stringify({ data: { reqstatus: "cancelled" } })
    })
    if (response.ok) await fetchRequisitions()
    else console.error('Failed to cancel requisition')
  } catch (error) {
    console.error('Error cancelling requisition:', error)
  }
}

const openCancelDialog = (item) => {
  selectedItemToCancel.value = item
  showCancelDialog.value = true
}

const closeCancelDialog = () => {
  showCancelDialog.value = false
  selectedItemToCancel.value = null
  cancelLoading.value = false
}

const confirmCancelRequisition = async () => {
  if (!selectedItemToCancel.value) return
  cancelLoading.value = true
  try {
    await cancelRequisition(selectedItemToCancel.value)
    await fetchItems()
    closeCancelDialog()
  } catch (error) {
    console.error('Error in confirm cancel:', error)
    cancelLoading.value = false
  }
}

onMounted(async () => {
  await Promise.all([fetchRequisitions(), fetchItems()])
})
</script>

<style scoped>
.split-layout {
  display: flex;
  height: 100vh;
  width: 100%;
}
.split-left {
  width: 60%;
  padding: 8px;
  height: 100%;
}
.split-right {
  width: 40%;
  height: 100%;
}
</style>
