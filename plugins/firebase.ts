import { defineNuxtPlugin } from '#app'
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyDMTYSi_SYraRCF7iHwlOY044RBCSuX_cs",
  authDomain: "inventoryproject-f22fb.firebaseapp.com",
  projectId: "inventoryproject-f22fb",
  storageBucket: "inventoryproject-f22fb.firebasestorage.app",
  messagingSenderId: "302970338801",
  appId: "1:302970338801:web:6756e252409eff4e44d850",
  measurementId: "G-Q1X3CN8RZ8"
}

export default defineNuxtPlugin((nuxtApp) => {
  const app = initializeApp(firebaseConfig)
  const auth = getAuth(app)
  nuxtApp.provide('firebase', app)
  nuxtApp.provide('firebaseAuth', auth)
})
