<template>
    <v-app-bar>
        <v-btn icon @click="onCancel">
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
        <v-app-bar-title>เพิ่มวัสดุใหม่</v-app-bar-title>
    </v-app-bar>
  <v-container class="d-flex justify-center align-center" style="min-height: 80vh;">
    <v-card width="500" outlined>
      <v-card-text>
        <v-form ref="form" v-model="valid" @submit.prevent="onSubmit">
          <v-text-field
            v-model="item.name"
            label="ชื่อวัสดุ"
            :rules="[v => !!v || 'กรุณากรอกชื่อวัสดุ']"
            required
          />
          <v-text-field
            v-model="item.unit"
            label="หน่วยนับ"
            :rules="[v => !!v || 'กรุณากรอกหน่วยนับ']"
            required
          />
          <v-text-field
            v-model="item.category"
            label="หมวดหมู่"
            :rules="[v => !!v || 'กรุณากรอกหมวดหมู่']"
            required
          />
          <v-number-input
            v-model="item.minqnt"
            :min="0"
            :reverse="false"
            control-variant="default"
            label="จำนวนขั้นต่ำ"
            :hide-input="false"
            :rules="[v => v !== null && v !== '' && !isNaN(v) || 'กรุณากรอกจำนวนขั้นต่ำ']"
            required
            inset
          />
          <v-number-input
            v-model="item.stockqnt"
            :min="0"
            :reverse="false"
            control-variant="default"
            label="จำนวนคงเหลือ"
            :hide-input="false"
            :rules="[v => v !== null && v !== '' && !isNaN(v) || 'กรุณากรอกจำนวนคงเหลือ']"
            required
            inset
          />
          <v-textarea
            v-model="item.description"
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
          <div v-if="imagePreview" class="mt-2 text-center">
            <img :src="imagePreview" alt="preview" style="max-width: 100%; max-height: 200px; border-radius: 8px;" />
          </div>
          <v-alert v-if="error" type="error" class="mt-2">{{ error }}</v-alert>
          <v-alert v-if="success" type="success" class="mt-2">{{ success }}</v-alert>
          <v-row class="mt-4">
            <v-col cols="6">
              <v-btn color="primary" type="submit" :loading="loading" block :disabled="!valid">บันทึก</v-btn>
            </v-col>
            <v-col cols="6">
              <v-btn variant="tonal" @click="onCancel" block>ยกเลิก</v-btn>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
definePageMeta({ middleware: 'auth' })
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useRuntimeConfig } from '#app'

const router = useRouter()
const config = useRuntimeConfig()
const API_BASE_URL = config.public.apiUrl
const API_BEARER_TOKEN = config.public.apiToken
const valid = ref(false)
const form = ref(null)
const loading = ref(false)
const error = ref('')
const success = ref('')
const item = ref({
  name: '',
  unit: '',
  stockqnt: null,
  minqnt: null,
  category: '',
  description: ''
})
const file = ref(null)
const imagePreview = ref('')

watch(file, (newFile) => {
  if (newFile && newFile instanceof File) {
    const reader = new FileReader()
    reader.onload = e => {
      imagePreview.value = e.target.result
    }
    reader.readAsDataURL(newFile)
  } else {
    imagePreview.value = ''
  }
})

const onSubmit = async () => {
  error.value = ''
  success.value = ''
  if (!form.value.validate()) return
  loading.value = true
  try {
    const res = await fetch(`${API_BASE_URL}/api/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_BEARER_TOKEN}`
      },
      body: JSON.stringify({
        data: {
          name: item.value.name,
          unit: item.value.unit,
          stockqnt: item.value.stockqnt,
          minqnt: item.value.minqnt,
          category: item.value.category,
          description: item.value.description
        }
      })
    })
    const resData = await res.clone().json().catch(() => null)
    if (!res.ok) throw new Error('ไม่สามารถเพิ่มวัสดุใหม่ได้')
    const data = await res.json()
    const newItemId = data.data?.documentId
    
    if (!newItemId) {
      throw new Error('Failed to get item ID from server response')
    }

    if (file.value) {
      const formData = new FormData()
      formData.append('files', file.value)
      formData.append('ref', 'api::item.item')
      formData.append('refId', newItemId)
      formData.append('field', 'imgpath')

      const uploadRes = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${API_BEARER_TOKEN}`
        },
        body: formData
      })
      const uploadResData = await uploadRes.clone().json().catch(() => null)
      if (!uploadRes.ok) throw new Error('อัปโหลดไฟล์ไม่สำเร็จ')
    }

    // Log the add stock history for new item creation (only if stockqnt > 0)
    if (item.value.stockqnt > 0) {
      try {
        if (!newItemId) {
          throw new Error('Cannot log inventory: item ID is missing')
        }
        
        const logData = {
          data: {
            type: "add",
            quantityChanged: item.value.stockqnt,
            item: newItemId
          }
        }
        const logRes = await fetch(`${API_BASE_URL}/api/inventory-logs/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${API_BEARER_TOKEN}`
          },
          body: JSON.stringify(logData)
        })
        const logResData = await logRes.clone().json().catch(() => null)
        if (!logRes.ok) {
          // Silently handle logging failure
        }
      } catch (logError) {
        // Silently handle logging failure
      }
    }

    success.value = 'เพิ่มวัสดุใหม่สำเร็จ!'
    setTimeout(() => router.push('/manage'), 1000)
  } catch (e) {
    error.value = e.message || 'เกิดข้อผิดพลาด'
  } finally {
    loading.value = false
  }
}

const onCancel = () => {
  router.push('/manage')
}
</script>