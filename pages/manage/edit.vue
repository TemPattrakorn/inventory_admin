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
          <div v-if="imagePreview" class="mt-2 text-center">
            <img :src="imagePreview" alt="preview" style="max-width: 100%; max-height: 200px; border-radius: 8px;" />
          </div>
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
import { ref, onMounted, nextTick, watch, computed } from 'vue'
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
const originalData = ref({})
const originalImgId = ref(null)
const originalImgUrl = ref('')

// Form data that will be bound to v-model
const formData = ref({
  name: '',
  unit: '',
  category: '',
  minqnt: 0,
  stockqnt: 0,
  description: ''
})

const imagePreview = ref('')

const fetchItem = async () => {
  const documentId = route.query.id
  if (!documentId) {
    error.value = 'ไม่พบ Document ID ของวัสดุ'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const res = await fetch(`${API_BASE_URL}/api/items/${documentId}?populate=*`, {
      headers: {
        Authorization: `Bearer ${API_BEARER_TOKEN}`
      }
    })

    if (!res.ok) {
      throw new Error('ไม่สามารถดึงข้อมูลวัสดุได้')
    }

    const data = await res.json()
    console.log('Fetched item data:', data)
    const item = data.data
    if (!item) throw new Error('ไม่พบข้อมูลวัสดุ')

    // Store the complete item data
    itemData.value = item
    originalData.value = {
      name: item.name ?? '',
      unit: item.unit ?? '',
      category: item.category ?? '',
      minqnt: Number(item.minqnt) || 0,
      stockqnt: Number(item.stockqnt) || 0,
      description: item.description ?? ''
    }

    formData.value = { ...originalData.value }

    // Handle image preview
    if (item.imgpath && item.imgpath.length > 0) {
      const img = item.imgpath[0]
      originalImgId.value = img.id
      originalImgUrl.value = img.url ? (img.url.startsWith('http') ? img.url : `${API_BASE_URL}${img.url}`) : ''
      imagePreview.value = originalImgUrl.value
    } else {
      originalImgId.value = null
      originalImgUrl.value = ''
      imagePreview.value = ''
    }

    await nextTick()
    if (form.value) {
      form.value.resetValidation()
    }
  } catch (e) {
    error.value = e.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล'
  } finally {
    loading.value = false
  }
}

// Watch file input for preview
watch(file, (newFile) => {
  if (newFile && newFile instanceof File) {
    const reader = new FileReader()
    reader.onload = e => {
      imagePreview.value = e.target.result
    }
    reader.readAsDataURL(newFile)
  } else {
    imagePreview.value = originalImgUrl.value
  }
})

// Compute changed fields
const changedFields = computed(() => {
  const changed = {}
  for (const key in formData.value) {
    if (formData.value[key] !== originalData.value[key]) {
      changed[key] = formData.value[key]
    }
  }
  return changed
})

const onSubmit = async () => {
  if (!form.value.validate()) return
  submitting.value = true
  error.value = ''
  success.value = ''
  const documentId = route.query.id
  try {
    // 1. Update only changed fields (except image)
    if (Object.keys(changedFields.value).length > 0) {
      const bodyData = JSON.stringify({ data: changedFields.value })
      console.log('PUT body sent to backend:', bodyData)
      const res = await fetch(`${API_BASE_URL}/api/items/${documentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_BEARER_TOKEN}`
        },
        body: bodyData
      })
      const updateResData = await res.clone().json().catch(() => null)
      console.log('Update item response:', updateResData)
      if (!res.ok) throw new Error('ไม่สามารถอัปเดตข้อมูลได้')
    }

    // 2. Handle image update if changed
    if (file.value) {
      // Delete old image if exists
      if (originalImgId.value) {
        const delRes = await fetch(`${API_BASE_URL}/api/upload/files/${originalImgId.value}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${API_BEARER_TOKEN}` }
        })
        const delResData = await delRes.clone().json().catch(() => null)
        console.log('Delete old image response:', delResData)
        if (!delRes.ok) throw new Error('ลบรูปภาพเดิมไม่สำเร็จ')
      }
      // Upload new image
      const formDataImg = new FormData()
      formDataImg.append('files', file.value)
      formDataImg.append('ref', 'api::item.item')
      formDataImg.append('refId', itemData.value.id)
      formDataImg.append('field', 'imgpath')
      console.log('POST image sent to backend:', formDataImg)
      const uploadRes = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${API_BEARER_TOKEN}` 
        },
        body: formDataImg
      })
      const uploadResData = await uploadRes.clone().json().catch(() => null)
      console.log('Upload image response:', uploadResData)
      if (!uploadRes.ok) throw new Error('อัปโหลดไฟล์ไม่สำเร็จ')
      const uploadData = await uploadRes.json()
      const newImgId = uploadData[0]?.id
      // Update item with new image id
      if (newImgId) {
        const imgBodyData = JSON.stringify({ data: { imgpath: newImgId } })
        console.log('PUT body for image update:', imgBodyData)
        const imgUpdateRes = await fetch(`${API_BASE_URL}/api/items/${documentId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${API_BEARER_TOKEN}`
          },
          body: imgBodyData
        })
        const imgUpdateResData = await imgUpdateRes.clone().json().catch(() => null)
        console.log('Update item with new image response:', imgUpdateResData)
        if (!imgUpdateRes.ok) throw new Error('อัปเดตรูปภาพไม่สำเร็จ')
      }
    }
    success.value = 'อัปเดตข้อมูลสำเร็จ'
    setTimeout(() => router.push('/manage'), 1200)
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