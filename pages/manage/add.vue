<template>
    <v-app-bar>
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
            v-model.number="item.stockqnt"
            label="จำนวนคงเหลือ"
            type="number"
            :rules="[v => v !== null && v !== '' && !isNaN(v) || 'กรุณากรอกจำนวนคงเหลือ']"
            required
          />
          <v-text-field
            v-model.number="item.minqnt"
            label="จำนวนขั้นต่ำ"
            type="number"
            :rules="[v => v !== null && v !== '' && !isNaN(v) || 'กรุณากรอกจำนวนขั้นต่ำ']"
            required
          />
          <v-text-field
            v-model="item.category"
            label="หมวดหมู่"
            :rules="[v => !!v || 'กรุณากรอกหมวดหมู่']"
            required
          />
          <v-textarea
            v-model="item.description"
            label="คำอธิบาย"
            maxlength="255"
            counter
            single-line
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
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

const onSubmit = async () => {
  error.value = ''
  success.value = ''
  if (!form.value.validate()) return
  loading.value = true
  try {
    const res = await fetch('http://localhost:1337/api/items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer 47e548113e5c35750c07c03b94b65e5064bd766eb8d81fec7aa84398b469b6ed4d922c112ad5986420c6730cf0468facf4c07c520327982aa07524b80e88bd85b04bfdbc8d98f34086a31d0f4b8aae00b494c0f2d07017193bb2c6824a4cdda2f5c03bbb7da4bd0017778154f68fc526e483adab7da7c0e25e9553773a540e46'
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
    if (!res.ok) throw new Error('ไม่สามารถเพิ่มวัสดุใหม่ได้')
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