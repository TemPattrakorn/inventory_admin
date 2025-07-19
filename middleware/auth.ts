import { defineNuxtRouteMiddleware, navigateTo } from 'nuxt/app'

export default defineNuxtRouteMiddleware((to) => {
  // Allow access to login page
  if (to.path === '/login') return

  // Only run on client
  if (process.client) {
    const userProfile = localStorage.getItem('userProfile')
    if (!userProfile) {
      return navigateTo('/login')
    }
  }
})
