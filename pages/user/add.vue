<template>
  <v-app-bar>
    <v-btn icon @click="onCancel">
      <v-icon>mdi-arrow-left</v-icon>
    </v-btn>
    <v-app-bar-title>เพิ่มบุคลากร</v-app-bar-title>
  </v-app-bar>
  <v-container class="d-flex justify-center align-center" style="min-height: 80vh;">
    <v-card width="500" outlined>
      <v-card-text>
        <v-form ref="form" v-model="valid" @submit.prevent="onSubmit">
          <v-text-field
            v-model="user.username"
            label="ชื่อ"
            :rules="[v => !!v || 'กรุณากรอกชื่อผู้ใช้']"
            required
          />
          <v-text-field
            v-model="user.email"
            label="อีเมล"
            :rules="[
              v => !!v || 'กรุณากรอกอีเมล',
              v => /.+@.+\..+/.test(v) || 'รูปแบบอีเมลไม่ถูกต้อง'
            ]"
            required
          />
          <v-select
            v-model="user.role"
            :items="roles"
            label="สิทธิ์ผู้ใช้"
            required
          />
          <v-alert v-if="error" type="error" class="mt-2">{{ error }}</v-alert>
          <v-alert v-if="success" type="success" class="mt-2">{{ success }}</v-alert>
          <v-row class="mt-4">
            <v-col cols="6">
              <v-btn color="primary" type="submit" :loading="loading" block :disabled="!valid">บันทึก</v-btn>
            </v-col>
            <v-col cols="6">
              <v-btn color="secondary" @click="onCancel" block>ยกเลิก</v-btn>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
definePageMeta({ middleware: 'auth' })
import { ref } from 'vue'
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
const roles = [
  { title: 'Admin', value: 'admin' },
  { title: 'User', value: 'user' }
]
const user = ref({
  username: '',
  email: '',
  role: 'user'
})

const onSubmit = async () => {
  error.value = ''
  success.value = ''
  if (!form.value.validate()) return
  loading.value = true
  try {
    const res = await fetch(`${API_BASE_URL}/api/inventory-users/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_BEARER_TOKEN}`
      },
      body: JSON.stringify({
        data: {
          username: user.value.username,
          email: user.value.email,
          role: user.value.role
        }
      })
    })
    const resData = await res.clone().json().catch(() => null)
    if (!res.ok) throw new Error(resData?.error?.message || 'ไม่สามารถเพิ่มผู้ใช้ใหม่ได้')
    success.value = 'เพิ่มผู้ใช้ใหม่สำเร็จ!'
    setTimeout(() => router.push('/user'), 1000)
  } catch (e) {
    error.value = e.message || 'เกิดข้อผิดพลาด'
  } finally {
    loading.value = false
  }
}

const onCancel = () => {
  router.push('/user')
}
</script>