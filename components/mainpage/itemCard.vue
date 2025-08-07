<template>
  <v-list-item
    :class="['border rounded mb-2 mx-4']"
  >
    <template v-slot:prepend>
      <v-avatar size="40" rounded="lg">
        <v-img :src="imageUrl" :alt="item.name"/>
      </v-avatar>
    </template>

    <v-list-item-title>{{ item.name }}</v-list-item-title>
    <v-list-item-subtitle>
      คงเหลือ: {{ item.stockqnt }} {{ item.unit }} (ขั้นต่ำ: {{ item.minqnt }})
    </v-list-item-subtitle>

    <template v-slot:append>
      <v-chip :color="chipColor" size="small">{{ chipText }}</v-chip>
      <v-menu location="right" offset-x>
        <template #activator="{ props: menuProps }">
          <v-btn v-bind="menuProps" icon="mdi-dots-vertical" variant="text" size="small"></v-btn>
        </template>
        <v-list>
          <v-list-item @click="showAddDialog = true">
            <v-list-item-title>เพิ่มจำนวนวัสดุ</v-list-item-title>
          </v-list-item>
          <v-list-item @click="navigateToEdit">
            <v-list-item-title>แก้ไขข้อมูลวัสดุ</v-list-item-title>
          </v-list-item>
          <v-list-item @click="showDeleteDialog = true">
            <v-list-item-title class="text-error">ลบรายการ</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </template>
  </v-list-item>

  <!-- Add Stock Dialog -->
  <v-dialog v-model="showAddDialog" max-width="500">
    <v-card>
      <v-card-title class="text-h5 pa-4 text-primary">
        <v-icon class="mr-2">mdi-plus-circle</v-icon>
        เพิ่มจำนวนวัสดุ
      </v-card-title>
      <v-card-text>
        <v-divider class="mb-3"/>
        <v-row align="center">
          <v-col cols="3">
            <v-img :src="imageUrl" aspect-ratio="1" contain class="rounded border"/>
          </v-col>
          <v-col cols="9">
            <div class="text-h6 mb-2">{{ item.name }}</div>
            <div class="text-body-2 text-grey-darken-1">คงเหลือ {{ item.stockqnt }} {{ item.unit }}</div>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12">
            <v-number-input
              v-model="addAmount"
              :min="1"
              :label="`จำนวนที่เพิ่ม (${item.unit})`"
              density="comfortable"
              inset
            />
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-actions class="px-4 pb-4">
        <v-spacer />
        <v-btn variant="tonal" @click="showAddDialog = false">ยกเลิก</v-btn>
        <v-btn
          color="primary"
          variant="elevated"
          :loading="loadingAdd"
          :disabled="addAmount <= 0"
          @click="handleAddStock"
        >
          ยืนยัน
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Delete Item Dialog -->
  <v-dialog v-model="showDeleteDialog" max-width="500">
    <v-card>
      <v-card-title class="text-h5 pa-4 text-error">
        <v-icon class="mr-2">mdi-delete</v-icon>
        ลบรายการวัสดุ
      </v-card-title>
      <v-card-text>
        <v-divider class="mb-3"/>
        <v-row align="center" class="mb-3">
          <v-col cols="3">
            <v-img :src="imageUrl" aspect-ratio="1" contain class="rounded border"/>
          </v-col>
          <v-col cols="9">
            <div class="text-h6 mb-2">{{ item.name }}</div>
            <div class="text-body-2 text-grey-darken-1">จำนวนคงเหลือ: {{ item.stockqnt }} {{ item.unit }}</div>
          </v-col>
        </v-row>
        <p class="text-body-1">คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?</p>
      </v-card-text>
      <v-card-actions class="px-4 pb-4">
        <v-spacer />
        <v-btn variant="tonal" @click="showDeleteDialog = false">ยกเลิก</v-btn>
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
</template>

<script setup>
import { ref, computed } from 'vue'
import { navigateTo, useRuntimeConfig } from '#app'

const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['updated', 'deleted'])

const showAddDialog = ref(false)
const showDeleteDialog = ref(false)
const addAmount = ref(0)
const loadingAdd = ref(false)
const loadingDelete = ref(false)

const config = useRuntimeConfig()
const API_BASE_URL = config.public.apiUrl
const API_BEARER_TOKEN = config.public.apiToken

const isNearlyDepleted = computed(() => props.item.stockqnt <= props.item.minqnt && props.item.stockqnt > 0)
const isDepleted = computed(() => props.item.stockqnt === 0)

const chipColor = computed(() => {
  if (isDepleted.value) return 'error'
  if (isNearlyDepleted.value) return 'warning'
  return 'default'
})

const chipText = computed(() => {
  if (isDepleted.value) return 'หมด'
  if (isNearlyDepleted.value) return `${props.item.stockqnt} / ${props.item.minqnt}`
  return `${props.item.stockqnt}`
})

const navigateToEdit = () => {
  navigateTo(`/manage/edit?id=${props.item.documentId}`)
}

const handleAddStock = async () => {
  if (!addAmount.value || addAmount.value <= 0) return
  loadingAdd.value = true
  try {
    const newStock = Number(props.item.stockqnt) + Number(addAmount.value)
    const response = await fetch(`${API_BASE_URL}/api/items/${props.item.documentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_BEARER_TOKEN}`
      },
      body: JSON.stringify({ data: { stockqnt: newStock } })
    })
    if (!response.ok) throw new Error('Update failed')
    showAddDialog.value = false
    addAmount.value = 0
    emit('updated')
  } catch (e) {
    console.error('Error adding stock:', e)
    showAddDialog.value = false
  } finally {
    loadingAdd.value = false
  }
}

const handleDelete = async () => {
  loadingDelete.value = true
  try {
    const response = await fetch(`${API_BASE_URL}/api/items/${props.item.documentId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${API_BEARER_TOKEN}`
      }
    })
    if (!response.ok) throw new Error('Delete failed')
    showDeleteDialog.value = false
    emit('deleted')
  } catch (e) {
    console.error('Error deleting item:', e)
    showDeleteDialog.value = false
  } finally {
    loadingDelete.value = false
  }
}
</script>

<style scoped>
</style>
