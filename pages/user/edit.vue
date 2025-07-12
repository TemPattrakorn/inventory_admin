<template>
  <v-app-bar>
    <v-btn icon @click="onCancel">
      <v-icon>mdi-arrow-left</v-icon>
    </v-btn>
    <v-app-bar-title>แก้ไขข้อมูลบุคลากร</v-app-bar-title>
  </v-app-bar>
  
  <v-container class="d-flex justify-center align-center" style="min-height: 80vh;">
    <v-card width="500">
      <v-card-text>
        <div v-if="loading" class="text-center">
          <v-progress-circular indeterminate color="primary" />
          <div class="mt-2">กำลังโหลดข้อมูล...</div>
        </div>
        
        <v-form v-else-if="userData" ref="form" v-model="valid" @submit.prevent="onSubmit">
          <v-text-field
            v-model="formData.username"
            label="ชื่อจริง"
            :rules="[v => !!v || 'กรุณากรอกชื่อจริง']"
            required
          />
          
          <v-text-field
            v-model="formData.email"
            label="อีเมล"
            type="email"
            :rules="[
              v => !!v || 'กรุณากรอกอีเมล',
              v => /.+@.+\..+/.test(v) || 'กรุณากรอกอีเมลให้ถูกต้อง'
            ]"
            required
          />
          
          <v-select
            v-model="formData.role"
            label="สิทธิ์ผู้ใช้"
            :items="roleOptions"
            :rules="[v => !!v || 'กรุณาเลือก Role']"
            required
          />
          
          <v-alert v-if="error" type="error" class="mt-2">{{ error }}</v-alert>
          <v-alert v-if="success" type="success" class="mt-2">{{ success }}</v-alert>
          
          <v-row class="mt-4">
            <v-col cols="6">
              <v-btn color="primary" type="submit" :loading="submitting" block :disabled="!valid">
                บันทึก
              </v-btn>
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
import { ref, onMounted, nextTick, computed } from 'vue'
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

// Store the original user data
const userData = ref(null)
const originalData = ref({})

// Form data that will be bound to v-model
const formData = ref({
  username: '',
  email: '',
  role: ''
})

// Role options for the select field
const roleOptions = [
  { title: 'Admin', value: 'admin' },
  { title: 'User', value: 'user' }
]

const fetchUser = async () => {
  const documentId = route.query.id
  if (!documentId) {
    error.value = 'ไม่พบ Document ID ของผู้ใช้'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const res = await fetch(`${API_BASE_URL}/api/inventory-users/${documentId}`, {
      headers: {
        Authorization: `Bearer ${API_BEARER_TOKEN}`
      }
    })

    if (!res.ok) {
      throw new Error('ไม่สามารถดึงข้อมูลผู้ใช้ได้')
    }

    const data = await res.json()
    console.log('Fetched user data:', data)
    const user = data.data
    if (!user) throw new Error('ไม่พบข้อมูลผู้ใช้')

    // Store the complete user data
    userData.value = user
    originalData.value = {
      username: user.username ?? '',
      email: user.email ?? '',
      role: user.role ?? ''
    }

    formData.value = { ...originalData.value }

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
    // Update only changed fields
    if (Object.keys(changedFields.value).length > 0) {
        console.log('changedFields:', changedFields.value)
        const bodyData = JSON.stringify({ data: changedFields.value })
        console.log('PUT body sent to backend:', bodyData)
      
        const res = await fetch(`${API_BASE_URL}/api/inventory-users/${documentId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            Authorization: `Bearer ${API_BEARER_TOKEN}`
        },
        body: bodyData
      })
      
      const updateResData = await res.clone().json().catch(() => null)
      console.log('Update user response:', updateResData)
      
      if (!res.ok) throw new Error('ไม่สามารถอัปเดตข้อมูลได้')
    }
    
    success.value = 'อัปเดตข้อมูลสำเร็จ'
    setTimeout(() => router.push('/user'), 1200)
  } catch (e) {
    error.value = e.message || 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล'
  } finally {
    submitting.value = false
  }
}

const onCancel = () => {
  router.push('/user')
}

onMounted(fetchUser)
</script>