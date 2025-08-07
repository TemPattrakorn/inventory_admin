<template>
    <v-app>
        <v-navigation-drawer
        class="bg-blue-grey-darken-3"
        theme="dark"
        >
            <v-list-item class = "my-2"
              :prepend-avatar="userProfile?.photoURL || userProfile?.profilePicture || ''"
              :title="userProfile?.username || 'Guest'"
              :subtitle="userProfile?.email || ''"
            ></v-list-item>
            <v-divider></v-divider>
            <v-list nav>
              <v-list-item 
                prepend-icon="mdi-home" 
                link to="/" 
                title="หน้าหลัก"
              ></v-list-item>
              <v-list-item 
                prepend-icon="mdi-pencil" 
                link to="/manage" 
                title="จัดการวัสดุ"
              ></v-list-item>
              <v-list-item 
                prepend-icon="mdi-history" 
                link to="/history" 
                title="ประวัติการเบิกใช้"
              ></v-list-item>
              <v-list-item 
                prepend-icon="mdi-account" 
                link to="/user" 
                title="จัดการรายชื่อบุคลากร"
              ></v-list-item>
              <v-list-item 
                prepend-icon="mdi-file-chart" 
                link to="/report" 
                title="รายงานวัสดุคงเหลือ"
              ></v-list-item>
            </v-list>

        <template v-slot:append>
          <div class="pa-2">
            <v-btn variant="tonal" block @click="logout">
              <v-icon left class="mr-2">mdi-logout</v-icon>
              Logout
            </v-btn>
          </div>
        </template>
        </v-navigation-drawer>
        <v-main style="background-color: #F5F5F5;">
            <slot />
        </v-main>
    </v-app>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { useNuxtApp } from '#app'
import { onMounted, ref } from 'vue'
import { signOut, type Auth } from 'firebase/auth'

const router = useRouter()
const nuxtApp = useNuxtApp()
const auth = nuxtApp.$firebaseAuth as Auth
const userProfile = ref<any>(null)

onMounted(() => {
  if (process.client) {
    const profile = localStorage.getItem('userProfile')
    userProfile.value = profile ? JSON.parse(profile) : null
  }
})

const logout = async () => {
  if (process.client) {
    localStorage.removeItem('userProfile')
    try {
      await signOut(auth)
    } catch (e) {}
    router.push('/login')
  }
}
</script>

