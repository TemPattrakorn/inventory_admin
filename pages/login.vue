<template>
  <v-app class="bg-blue-grey-darken-3">
    <v-container class="fill-height d-flex flex-column justify-center align-center">
      <v-card class="pa-8" max-width="600">
        <v-card-title class="text-h5 mb-2" style="white-space: normal; word-break: break-word;">
          Welcome to Inventory Management System
        </v-card-title>
        <div class="text-subtitle-1 mb-6 text-center">
          Department of Mathematics and Computer Science
        </div>
        <v-btn
          color="primary"
          block
          :loading="loading"
          @click="signInWithGoogle"
        >
          <v-icon left class="mr-2">mdi-google</v-icon>
          Sign in with Google
        </v-btn>
        <v-alert v-if="error" type="error" class="mt-4">{{ error }}</v-alert>
      </v-card>
    </v-container>
  </v-app>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useNuxtApp } from '#app'
import { useRuntimeConfig } from '#app'
import { GoogleAuthProvider, signInWithPopup, type Auth } from 'firebase/auth'

definePageMeta({ layout: false })

const loading = ref(false)
const error = ref('')
const router = useRouter()
const nuxtApp = useNuxtApp()
const auth = nuxtApp.$firebaseAuth as Auth

const config = useRuntimeConfig()
const apiToken = config.public.apiToken
const apiUrlBase = config.public.apiUrl

const fetchUserProfile = async (email: string) => {
  const apiUrl = `${apiUrlBase}/api/inventory-users?filters[email][$eq]=${encodeURIComponent(email)}`
  const res = await fetch(apiUrl, {
    headers: {
      Authorization: `Bearer ${apiToken}`
    }
  })
  if (!res.ok) throw new Error('Failed to fetch user profile from Strapi.')
  const data = await res.json()
  if (!data.data || !data.data.length) throw new Error('User not found in Inventory system.')
  return data.data[0]
}

const signInWithGoogle = async () => {
  loading.value = true
  error.value = ''
  try {
    const provider = new GoogleAuthProvider()
    const result = await signInWithPopup(auth, provider)
    console.log('Google sign-in result:', result)
    const user = result.user
    if (!user.email) throw new Error('No email found in Google account.')
    // Fetch user profile from Strapi using static API token
    const profile = await fetchUserProfile(user.email)
    if (profile.role !== 'admin') {
      throw new Error('You are not authorized to use this system.')
    }
    // Store profile in localStorage (or Pinia/Vuex if you prefer)
    localStorage.setItem('userProfile', JSON.stringify(profile))
    // On success, redirect to home page
    router.push('/')
  } catch (e: any) {
    error.value = e.message || 'Sign-in failed.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.fill-height {
  min-height: 100vh;
}
</style>