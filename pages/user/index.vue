<template>
  <v-app-bar title="รายชื่อบุคลากร">
    <v-text-field
      v-model="search"
      prepend-inner-icon="mdi-magnify"
      label="ค้นหาบุคลากร"
      clearable
      density="compact"
      hide-details
      style="max-width: 300px"
      class="mr-4"
    ></v-text-field>
    
    <v-btn 
      prepend-icon="mdi-plus"
      variant="tonal"
      to="/user/add"
      tag="NuxtLink" 
      color="primary" 
      class="mt-n1 mr-4">
      เพิ่มผู้ใช้ใหม่
    </v-btn>
  </v-app-bar>

  <v-container class="mx-auto pa-4" style="max-width: 1280px;">
    <v-data-table
      :headers="headers"
      :items="users"
      :loading="loading"
      :search="search"
      class="elevation-1"
      item-value="id"
      
    >
      <template #item.role="{ item }">
        <v-chip :color="item.role === 'admin' ? 'red' : item.role === 'user' ? 'blue' : 'grey'" dark>
          {{ item.role }}
        </v-chip>
      </template>
      <template #item.actions="{ item }">
        <div class="d-flex justify-end">
          <v-menu location="right" offset-x>
            <template #activator="{ props }">
              <v-btn v-bind="props" icon variant="text">
                <v-icon>mdi-dots-vertical</v-icon>
              </v-btn>
            </template>
            <v-list>
              <v-list-item>
                <v-btn variant="text" block @click="onEdit(item)">แก้ไขข้อมูลผู้ใช้</v-btn>
              </v-list-item>
              <v-list-item>
                <v-btn variant="text" block color="error" @click="onDelete(item)">ลบผู้ใช้</v-btn>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>
      </template>
    </v-data-table>
    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h5 pa-4 text-error">
          <v-icon class="mr-2 text-error">mdi-account-remove</v-icon>
          ลบผู้ใช้
        </v-card-title>
        
        <v-card-text v-if="selectedUser">
          
          <v-divider class="mb-3"/>
          
          <div class="mb-3">
            <v-list density="compact" class="bg-grey-lighten-4 rounded">
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon color="primary">mdi-account</v-icon>
                </template>
                <v-list-item-title class="text-body-2">
                  <strong>Username:</strong> {{ selectedUser.username }}
                </v-list-item-title>
              </v-list-item>
              
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon color="primary">mdi-email</v-icon>
                </template>
                <v-list-item-title class="text-body-2">
                  <strong>Email:</strong> {{ selectedUser.email }}
                </v-list-item-title>
              </v-list-item>
              
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon color="primary">mdi-shield-account</v-icon>
                </template>
                <v-list-item-title class="text-body-2">
                  <strong>Role:</strong> 
                  <v-chip 
                    size="small" 
                    :color="selectedUser.role === 'admin' ? 'red' : selectedUser.role === 'user' ? 'blue' : 'grey'" 
                    class="ml-2"
                  >
                    {{ selectedUser.role }}
                  </v-chip>
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </div>
        </v-card-text>
        
        <v-card-actions class="px-6 pb-6">
          <v-spacer></v-spacer>
          <v-btn 
            color="grey" 
            variant="outlined" 
            :disabled="deleting" 
            @click="deleteDialog = false"
          >
            ยกเลิก
          </v-btn>
          <v-btn 
            color="error" 
            variant="elevated" 
            :loading="deleting" 
            :disabled="deleting" 
            @click="onDelete(selectedUser, true)"
          >
            ยืนยัน
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
definePageMeta({ middleware: 'auth' })
import { ref, onMounted } from 'vue'
import { useRuntimeConfig } from '#app'
import { navigateTo } from 'nuxt/app'

const config = useRuntimeConfig()
const API_BASE_URL = config.public.apiUrl
const API_BEARER_TOKEN = config.public.apiToken

const headers = [
  { title: 'Username', value: 'username', sortable: true },
  { title: 'Email', value: 'email', sortable: true },
  { title: 'Role', value: 'role', sortable: true },
  { title: '', value: 'actions', sortable: false, align: 'end' },
]

const users = ref([])
const loading = ref(false)

// Search state
const search = ref('')

// Dialog and selected user state
const deleteDialog = ref(false)
const selectedUser = ref(null)
const deleting = ref(false)

const fetchUsers = async () => {
  loading.value = true
  try {
    const res = await fetch(`${API_BASE_URL}/api/inventory-users/`, {
      headers: {
        Authorization: `Bearer ${API_BEARER_TOKEN}`
      }
    })
    const data = await res.json()
    users.value = data.data || []
  } catch (e) {
    users.value = []
  } finally {
    loading.value = false
  }
}

onMounted(fetchUsers)

const onEdit = (item) => {
    navigateTo(`/user/edit?id=${item.documentId}`)
}

const onDelete = async (item, confirm = false) => {
  if (!confirm) {
    selectedUser.value = item
    deleteDialog.value = true
    return
  }
  if (!selectedUser.value) return
  deleting.value = true
  try {
    const res = await fetch(`${API_BASE_URL}/api/inventory-users/${selectedUser.value.documentId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${API_BEARER_TOKEN}`
      }
    })
    console.log('DELETE response:', res)
    const resData = await res.json().catch(() => null)
    console.log('DELETE response data:', resData)
    await fetchUsers()
  } catch (e) {
    console.error('DELETE error:', e)
  } finally {
    deleting.value = false
    deleteDialog.value = false
    selectedUser.value = null
  }
}

</script>