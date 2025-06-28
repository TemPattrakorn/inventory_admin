<template>
    <v-app-bar>
        <v-btn icon @click="onCancel">
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
        <v-app-bar-title>แก้ไขวัสดุ</v-app-bar-title>
    </v-app-bar>
  <v-container class="d-flex justify-center align-center" style="min-height: 80vh;">
    <v-card width="500" outlined>
      <v-card-text>
        <div v-if="loading" class="text-center">
          <v-progress-circular indeterminate color="primary" />
          <div class="mt-2">กำลังโหลดข้อมูล...</div>
        </div>
        <v-form v-else-if="itemData" ref="form" v-model="valid" @submit.prevent="onSubmit">
          <v-text-field
            v-model="formData.name"
            label="ชื่อวัสดุ"
            :rules="[v => !!v || 'กรุณากรอกชื่อวัสดุ']"
            required
          />
          <v-text-field
            v-model="formData.unit"
            label="หน่วยนับ"
            :rules="[v => !!v || 'กรุณากรอกหน่วยนับ']"
            required
          />
          <v-text-field
            v-model="formData.category"
            label="หมวดหมู่"
            :rules="[v => !!v || 'กรุณากรอกหมวดหมู่']"
            required
          />
          <v-number-input
            v-model="formData.minqnt"
            :min="0"
            :reverse="false"
            control-variant="default"
            label="จำนวนขั้นต่ำ"
            :hide-input="false"
            :inset="false"
            :rules="[v => v !== null && v !== '' && !isNaN(v) || 'กรุณากรอกจำนวนขั้นต่ำ']"
            required
          />
          <v-number-input
            v-model="formData.stockqnt"
            :min="0"
            :reverse="false"
            control-variant="default"
            label="จำนวนคงเหลือ"
            :hide-input="false"
            :inset="false"
            :rules="[v => v !== null && v !== '' && !isNaN(v) || 'กรุณากรอกจำนวนคงเหลือ']"
            required
          />
          <v-textarea
            v-model="formData.description"
            label="คำอธิบาย"
            maxlength="255"
            counter
            single-line
          />
          <v-file-input
            v-model="file"
            label="อัปโหลดรูปภาพ"
            accept="image/*"
            prepend-icon="mdi-paperclip"
            show-size
            clearable
          />
          <v-alert v-if="error" type="error" class="mt-2">{{ error }}</v-alert>
          <v-alert v-if="success" type="success" class="mt-2">{{ success }}</v-alert>
          <v-row class="mt-4">
            <v-col cols="6">
              <v-btn color="primary" type="submit" :loading="submitting" block :disabled="!valid">บันทึก</v-btn>
            </v-col>
            <v-col cols="6">
              <v-btn color="secondary" @click="onCancel" block>ยกเลิก</v-btn>
            </v-col>
          </v-row>
        </v-form>
        <div v-else-if="error" class="text-center">
          <v-alert type="error">{{ error }}</v-alert>
        </div>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRuntimeConfig } from '#app'

const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()
const API_BASE_URL = config.public.apiUrl
const API_BEARER_TOKEN = config.public.apiToken

const form = ref(null)
const valid = ref(false)
const loading = ref(false)
const submitting = ref(false)
const error = ref('')
const success = ref('')
const file = ref(null)

// Store the original item data
const itemData = ref(null)

// Form data that will be bound to v-model
const formData = ref({
  name: '',
  unit: '',
  category: '',
  minqnt: 0,
  stockqnt: 0,
  description: ''
})

const fetchItem = async () => {
  const itemId = route.query.id
  if (!itemId) {
    error.value = 'ไม่พบ ID ของวัสดุ'
    return
  }

  loading.value = true
  error.value = ''
  
  try {
    const res = await fetch(`${API_BASE_URL}/api/items/${itemId}?populate=*`, {
      headers: {
        Authorization: `Bearer ${API_BEARER_TOKEN}`
      }
    })
    
    if (!res.ok) {
      throw new Error('ไม่สามารถดึงข้อมูลวัสดุได้')
    }
    
    const data = await res.json()
    console.log('API Response:', data)
    
    const attributes = data.data?.attributes || {}
    console.log('Item Attributes:', attributes)
    
    // Store the complete item data
    itemData.value = data.data
    
    // Populate form data with safe fallbacks for null values
    formData.value = {
      name: attributes.name ?? '',
      unit: attributes.unit ?? '',
      category: attributes.category ?? '',
      minqnt: Number(attributes.minqnt) || 0,
      stockqnt: Number(attributes.stockqnt) || 0,
      description: attributes.description ?? ''
    }
    
    console.log('Form Data Populated:', formData.value)
    
    // Wait for DOM to update and reset form validation
    await nextTick()
    if (form.value) {
      form.value.resetValidation()
    }
  } catch (e) {
    console.error('Error fetching item:', e)
    error.value = e.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล'
  } finally {
    loading.value = false
  }
}

const onSubmit = async () => {
  if (!form.value.validate()) return
  
  submitting.value = true
  error.value = ''
  success.value = ''
  
  try {
    const itemId = route.query.id
    const payload = {
      data: {
        name: formData.value.name,
        unit: formData.value.unit,
        category: formData.value.category,
        minqnt: Number(formData.value.minqnt),
        stockqnt: Number(formData.value.stockqnt),
        description: formData.value.description
      }
    }
    
    console.log('Submitting payload:', payload)
    
    const res = await fetch(`${API_BASE_URL}/api/items/${itemId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_BEARER_TOKEN}`
      },
      body: JSON.stringify(payload)
    })
    
    if (!res.ok) {
      throw new Error('ไม่สามารถอัปเดตข้อมูลได้')
    }
    
    success.value = 'อัปเดตข้อมูลสำเร็จ'
    setTimeout(() => {
      router.push('/manage')
    }, 1500)
  } catch (e) {
    error.value = e.message || 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล'
  } finally {
    submitting.value = false
  }
}

const onCancel = () => {
  router.push('/manage')
}

onMounted(fetchItem)
</script>