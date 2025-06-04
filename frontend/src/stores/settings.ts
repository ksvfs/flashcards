import { ref, watch } from 'vue'
import { defineStore } from 'pinia'

export const useSettingsStore = defineStore('settings', () => {
  const defaulSettings = { showStore: true, darkMode: false, brushWidth: 4, cardLimit: 10 }

  const savedSettings = localStorage.getItem('settings')

  const initialSettings = savedSettings ? JSON.parse(savedSettings) : defaulSettings

  const settings = ref(initialSettings)

  watch(
    settings,
    () => {
      localStorage.setItem('settings', JSON.stringify(settings.value))
    },
    { deep: true },
  )

  watch(() => settings.value.darkMode, applyTheme, { immediate: true })

  function applyTheme() {
    if (settings.value.darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      if (document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark')
      }
    }
  }

  return { settings, applyTheme }
})
