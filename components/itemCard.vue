<template>
  <v-card>

    <!-- image name minqnt stockqnt kebab -->
    <v-row align="center" no-gutters>
      <v-col cols="1">
        <v-img :src="imageUrl || '/No_image_available.png'" aspect-ratio="1" height="90" contain class="ma-1" />
      </v-col>
      <v-col cols="6">
        <v-card-title>{{ name }}</v-card-title>
      </v-col>
      <v-col cols="2">
        <div>จำนวนขั้นต่ำ: {{ minqnt }}</div>
      </v-col>
      <v-col cols="2">
        <div>จำนวนคงเหลือ: {{ stockqnt }} {{ unit }}</div>
      </v-col>
      <v-col cols="1" class="d-flex justify-end">

        <!-- kebab menu -->
        <v-menu location="right" offset-x>
          <template #activator="{ props }">
            <v-btn v-bind="props" icon variant="text">
              <v-icon>mdi-dots-vertical</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item>
              <v-btn variant="text" block @click="showAddDialog = true">เพิ่มจำนวนวัสดุ</v-btn>
            </v-list-item>
            <v-list-item>
              <v-btn variant="text" block @click="navigateToEdit">แก้ไขข้อมูลวัสดุ</v-btn>
            </v-list-item>
            <v-list-item>
              <v-btn variant="text" block color="error" @click="showDeleteDialog = true">ลบรายการ</v-btn>
            </v-list-item>
          </v-list>
        </v-menu>

      </v-col>
    </v-row>

    <!-- delete item -->
    <v-dialog v-model="showDeleteDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h5 pa-4 text-error">
          <v-icon class="mr-2 text-error">mdi-delete</v-icon>
          ลบรายการวัสดุ
        </v-card-title>
        
        <v-card-text>

          <v-divider class="mb-3"/>
          
          <v-row align="center" class="mb-3">
            <v-col cols="3">
              <v-img 
                :src="imageUrl || '/No_image_available.png'" 
                aspect-ratio="1" 
                contain 
                class="rounded border"
              />
            </v-col>
            <v-col cols="9">
              <div class="text-h6 mb-2">{{ name }}</div>
              <div class="text-body-2 text-grey-darken-1">จำนวนคงเหลือ: {{ stockqnt }} {{ unit }}</div>
            </v-col>
          </v-row>
        </v-card-text>
        
        <v-card-actions class="px-6 pb-6">
          <v-spacer />
          <v-btn 
            color="grey" 
            variant="outlined" 
            @click="showDeleteDialog = false"
          >
            ยกเลิก
          </v-btn>
          <v-btn 
            color="error" 
            variant="elevated"
            :loading="loadingDelete" 
            @click="handleDelete"
          >
            ยืนยัน
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- add stock dialog -->
    <v-dialog v-model="showAddDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h5 pa-4 text-primary">
          <v-icon class="mr-2 text-primary">mdi-plus-circle</v-icon>
          เพิ่มจำนวนวัสดุ
        </v-card-title>
        
        <v-card-text>
          
          <v-divider class="mb-3"/>
          
          <v-row align="center">
            <v-col cols="3">
              <v-img 
                :src="imageUrl || '/No_image_available.png'" 
                aspect-ratio="1" 
                contain 
                class="rounded border"
              />
            </v-col>
            <v-col cols="9">
              <div class="text-h6 mb-2">{{ name }}</div>
              <div class="text-body-2 text-grey-darken-1">คงเหลือ {{ stockqnt }} {{ unit }}</div>
            </v-col>
          </v-row>
          
          <v-row>
            <v-col cols="12">
              <v-number-input 
                v-model="addAmount" 
                :min="1" 
                :label="`จำนวนที่เพิ่ม (${unit})`" 
                density="comfortable"
                inset
              />
            </v-col>
          </v-row>
        </v-card-text>
        
        <v-card-actions class="px-6 pb-6">
          <v-spacer />
          <v-btn 
            color="grey" 
            variant="outlined" 
            @click="showAddDialog = false"
          >
            ยกเลิก
          </v-btn>
          <v-btn 
            color="primary" 
            variant="elevated"
            :loading="loadingAdd" 
            @click="handleAddStock" 
            :disabled="addAmount <= 0"
          >
            ยืนยัน
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup>
import { ref } from 'vue'
import { navigateTo } from 'nuxt/app'
const props = defineProps({
  documentId: [String, Number],
  name: String,
  stockqnt: Number,
  minqnt: Number,
  imageUrl: String,
  unit: String
})
const emit = defineEmits(['deleted', 'updated'])
const showDeleteDialog = ref(false)
const loadingDelete = ref(false)
const showAddDialog = ref(false)
const addAmount = ref(0)
const loadingAdd = ref(false)
const config = useRuntimeConfig ? useRuntimeConfig() : null
const API_BASE_URL = config?.public?.apiUrl || ''
const API_BEARER_TOKEN = config?.public?.apiToken || ''

const handleDelete = async () => {
  loadingDelete.value = true
  try {
    const res = await fetch(`${API_BASE_URL}/api/items/${props.documentId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${API_BEARER_TOKEN}`
      }
    })
    const resData = await res.clone().json().catch(() => null)
    console.log('Delete item response:', resData)
    if (!res.ok) throw new Error('Delete failed')
    showDeleteDialog.value = false
    emit('deleted', props.documentId)
  } catch (e) {
    // Optionally show error
    showDeleteDialog.value = false
  } finally {
    loadingDelete.value = false
  }
}

const handleAddStock = async () => {
  loadingAdd.value = true
  try {
    // First, fetch the current item data to get imgpath ID
    const getRes = await fetch(`${API_BASE_URL}/api/items/${props.documentId}`, {
      headers: {
        Authorization: `Bearer ${API_BEARER_TOKEN}`
      }
    })
    const getResData = await getRes.clone().json().catch(() => null)
    console.log('Fetch item for add stock response:', getResData)
    if (!getRes.ok) throw new Error('Failed to fetch item data')
    const itemData = await getRes.json()
    const imgpathId = itemData.data?.imgpath?.[0]?.id || null
    const newStock = Number(props.stockqnt) + Number(addAmount.value)
    // Prepare update data with imgpath ID
    const updateData = {
      data: {
        stockqnt: newStock
      }
    }
    // Add imgpath ID if it exists
    if (imgpathId) {
      updateData.data.imgpath = imgpathId
    }
    const res = await fetch(`${API_BASE_URL}/api/items/${props.documentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_BEARER_TOKEN}`
      },
      body: JSON.stringify(updateData)
    })
    const updateResData = await res.clone().json().catch(() => null)
    console.log('Update item (add stock) response:', updateResData)
    if (!res.ok) throw new Error('Update failed')
    showAddDialog.value = false
    emit('updated', props.documentId)
    addAmount.value = 0
  } catch (e) {
    showAddDialog.value = false
  } finally {
    loadingAdd.value = false
  }
}

const navigateToEdit = () => {
  navigateTo(`/manage/edit?id=${props.documentId}`)
}
</script>
