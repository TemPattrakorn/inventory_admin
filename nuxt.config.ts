import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'
export default defineNuxtConfig({
  devtools: { enabled: false },
  build: {
    transpile: ['vuetify'],
  },
  modules: [
    (_options, nuxt) => {
      nuxt.hooks.hook('vite:extendConfig', (config) => {
        // @ts-expect-error
        config.plugins.push(vuetify({ autoImport: true }))
      })
    },
    //...
  ],
  plugins: [
    '~/plugins/firebase.ts',
  ],
  vite: {
    vue: {
      template: {
        transformAssetUrls,
      },
    },
  },
  runtimeConfig: {
    public: {
      apiUrl: process.env.NUXT_PUBLIC_API_URL,
      apiToken: process.env.NUXT_PUBLIC_API_TOKEN,
      firebaseApiKey: process.env.NUXT_PUBLIC_FIREBASE_API_KEY
    }
  },
  app: {
    head: {
      title: 'Inventory management system - CMS',
    }
  }
})
