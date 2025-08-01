<template>
  <div style="background-color: #F5F5F5; min-height: 100vh;">
    <v-container class="mx-auto pa-4">
      <v-card>
        <v-card-title class="text-h5 pa-4 d-flex justify-space-between align-center">
          <span>คำขอเบิกวัสดุ</span>
          <span class="text-body-1 text-grey-darken-1">{{ tableItems.length }} คำขอเบิก</span>
        </v-card-title>
        
        <v-data-table
            :headers="headers"
            :items="tableItems"
            :loading="loading"
            class="elevation-1 bordered-table"
            item-key="id"
            :items-per-page="10"
          >
            <template v-slot:item.createdAt="{ item }">
              {{ formatDate(item.createdAt) }}
            </template>
            
            <template v-slot:item.items="{ item }">
              <div>
                <div v-for="reqItem in item.items" :key="reqItem.id" class="mb-1">
                  {{ reqItem.name }}
                </div>
              </div>
            </template>
            
            <template v-slot:item.quantity="{ item }">
              <div>
                <div v-for="reqItem in item.items" :key="reqItem.id" class="mb-1">
                  {{ reqItem.quantity }} {{ reqItem.unit }}
                </div>
              </div>
            </template>
            
            <template v-slot:item.actions="{ item }">
              <div class="d-flex gap-2 justify-center">
                <v-btn
                    prepend-icon="mdi-check"
                    class="mr-2"
                    color="blue"
                    size="small"
                    @click="markAsReceived(item)"
                >
                    รับวัสดุแล้ว
                </v-btn>
                <v-btn
                    prepend-icon="mdi-cancel"
                    class="ml-2"
                    color="error"
                    size="small"
                    variant="tonal"
                    @click="cancelRequisition(item)"
                >
                    ยกเลิกการเบิก
                </v-btn>
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
    </v-container>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRuntimeConfig } from '#app'

definePageMeta({ middleware: 'auth' })

const config = useRuntimeConfig()
const API_BASE_URL = config.public.apiUrl
const API_BEARER_TOKEN = config.public.apiToken

const loading = ref(false)
const tableItems = ref([])

const headers = ref([
  {
    title: 'วันที่ขอเบิก',
    key: 'createdAt',
    align: 'start',
    sortable: true,
  },
  {
    title: 'ชื่อผู้ขอเบิก',
    key: 'username',
    align: 'start',
    sortable: true,
  },
  {
    title: 'รายการ',
    key: 'items',
    align: 'start',
    sortable: false,
  },
  {
    title: 'จำนวน',
    key: 'quantity',
    align: 'start',
    sortable: false,
  },
  {
    title: 'เหตุผลในการเบิก',
    key: 'reqDescription',
    align: 'start',
    sortable: false,
    width: '400px',
  },
  {
    key: 'actions',
    align: 'center',
    sortable: false,
  },
])

const fetchRequisitions = async () => {
  try {
    loading.value = true
    
    // Fetch all requisitions
    const response = await fetch(`${API_BASE_URL}/api/requisitions?populate=*`, {
      headers: {
        Authorization: `Bearer ${API_BEARER_TOKEN}`
      }
    })
    const data = await response.json()
    
    // Filter only awaitPickup status
    const awaitPickupRequisitions = data.data.filter(req => req.reqstatus === 'awaitPickup')
    
    // Process each requisition
    const processedItems = await Promise.all(
      awaitPickupRequisitions.map(async (requisition) => {
        // Fetch item details for each requisition_item
        const itemsWithDetails = await Promise.all(
          requisition.requisition_items.map(async (reqItem) => {
            try {
              const itemResponse = await fetch(
                `${API_BASE_URL}/api/requisition-items/${reqItem.documentId}?populate[item][fields]=name,unit`,
                {
                  headers: {
                    Authorization: `Bearer ${API_BEARER_TOKEN}`
                  }
                }
              )
              const itemData = await itemResponse.json()
              
              return {
                id: reqItem.id,
                documentId: reqItem.documentId,
                quantity: reqItem.quantity,
                name: itemData.data.item.name,
                unit: itemData.data.item.unit,
              }
            } catch (error) {
              console.error('Error fetching item details:', error)
              return {
                id: reqItem.id,
                documentId: reqItem.documentId,
                quantity: reqItem.quantity,
                name: 'ไม่สามารถโหลดข้อมูลได้',
                unit: '',
              }
            }
          })
        )
        
        return {
          id: requisition.id,
          documentId: requisition.documentId,
          username: requisition.inventory_user.username,
          reqDescription: requisition.reqDescription || 'ไม่ระบุ',
          items: itemsWithDetails,
          createdAt: requisition.createdAt,
          originalData: requisition, // Keep original data for actions
        }
      })
    )
    
    tableItems.value = processedItems
  } catch (error) {
    console.error('Error fetching requisitions:', error)
    // You might want to show a snackbar or toast message here
  } finally {
    loading.value = false
  }
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  
  return `${day}/${month}/${year} ${hours}:${minutes}`
}

const markAsReceived = async (item) => {
  try {
    const currentTime = new Date().toISOString()
    
    const response = await fetch(`${API_BASE_URL}/api/requisitions/${item.documentId}`, {
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
      // Refresh the data to update the table
      await fetchRequisitions()
    } else {
      console.error('Failed to mark requisition as completed')
    }
  } catch (error) {
    console.error('Error marking requisition as completed:', error)
  }
}

const cancelRequisition = async (item) => {
  try {
    // Step 1-3: Process each requisition item to restore stock quantities
    for (const reqItem of item.items) {
      try {
        // Step 1: Get requisition-item details with current stock quantity
        const reqItemResponse = await fetch(
          `${API_BASE_URL}/api/requisition-items/${reqItem.documentId}?populate[item][fields]=stockqnt`,
          {
            headers: {
              Authorization: `Bearer ${API_BEARER_TOKEN}`
            }
          }
        )
        const reqItemData = await reqItemResponse.json()
        
        if (reqItemResponse.ok && reqItemData.data) {
          // Step 2: Calculate new stock (current stock + requisition quantity)
          const currentStock = reqItemData.data.item.stockqnt
          const requisitionQuantity = reqItemData.data.quantity
          const newStock = currentStock + requisitionQuantity
          
          // Step 3: Update item's stock quantity
          const itemDocumentId = reqItemData.data.item.documentId
          const updateStockResponse = await fetch(
            `${API_BASE_URL}/api/items/${itemDocumentId}`,
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
            console.log(`Stock updated for item ${itemDocumentId}: ${currentStock} + ${requisitionQuantity} = ${newStock}`)
          } else {
            console.error(`Failed to update stock for item ${itemDocumentId}`)
          }
        }
      } catch (error) {
        console.error(`Error processing requisition item ${reqItem.documentId}:`, error)
      }
    }
    
    // Step 4: Update requisition status to cancelled
    const response = await fetch(`${API_BASE_URL}/api/requisitions/${item.documentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_BEARER_TOKEN}`
      },
      body: JSON.stringify({
        data: {
          reqstatus: "cancelled",
        }
      })
    })
    
    if (response.ok) {
      console.log('Requisition cancelled successfully')
      // Refresh the data to update the table
      await fetchRequisitions()
    } else {
      console.error('Failed to cancel requisition')
    }
  } catch (error) {
    console.error('Error cancelling requisition:', error)
  }
}

onMounted(() => {
  fetchRequisitions()
})
</script>

<style scoped>
.bordered-table :deep(.v-data-table__th),
.bordered-table :deep(.v-data-table__td) {
  border-right: 1px solid rgba(0, 0, 0, 0.12) !important;
}

.bordered-table :deep(.v-data-table__th:last-child),
.bordered-table :deep(.v-data-table__td:last-child) {
  border-right: none !important;
}
</style>