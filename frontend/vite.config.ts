import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'images/no-decks.svg', 'fonts/Inter.woff2'],

      manifest: {
        id: '/',
        name: 'Flashcards',
        short_name: 'Flashcards',
        description:
          'Веб-приложение для эффективного запоминания информации с использованием методов интервального повторения и активного воспроизведения',
        lang: 'ru',
        theme_color: '#ffffff',
        start_url: '.',
        display: 'standalone',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
        screenshots: [
          {
            src: 'screenshot-1.png',
            sizes: '438x717',
            type: 'image/png',
            form_factor: 'narrow',
          },
          {
            src: 'screenshot-2.png',
            sizes: '361x573',
            type: 'image/png',
            form_factor: 'narrow',
          },
          {
            src: 'screenshot-3.png',
            sizes: '337x574',
            type: 'image/png',
            form_factor: 'narrow',
          },
          {
            src: 'screenshot-4.png',
            sizes: '370x715',
            type: 'image/png',
            form_factor: 'narrow',
          },
          {
            src: 'screenshot-5.png',
            sizes: '1517x906',
            type: 'image/png',
            form_factor: 'wide',
          },
        ],
      },
      workbox: {
        navigateFallbackDenylist: [/^\/docs/],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    allowedHosts: ['localhost', process.env.DOMAIN as string],
  },
  base: './',
})
