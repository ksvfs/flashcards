<script setup lang="ts">
import IconJson from '@/icons/IconJson.vue'
import { useDecksStore } from '@/stores/decks'
import { useLoginStore } from '@/stores/login'
import { useSettingsStore } from '@/stores/settings'
import { storeToRefs } from 'pinia'
import { localDb, cloudDb } from '@/db/db'
import { ref } from 'vue'
import type { Deck, Card } from '../../../common/types'

const { isLoggedIn } = storeToRefs(useLoginStore())
const { decks } = storeToRefs(useDecksStore())
const { settings } = storeToRefs(useSettingsStore())

const fileInput = ref<HTMLInputElement | null>(null)
const isExporting = ref(false)
const isImporting = ref(false)

async function logout() {
  const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/logout`, { method: 'POST' })

  if (response.ok) isLoggedIn.value = false

  decks.value = decks.value.filter((deck) => deck.type !== 'cloud')
}

function reviveDates(obj: any): any {
  if (!obj) return obj

  if (typeof obj === 'object') {
    for (const key in obj) {
      if (key === 'due' || key === 'created' || key === 'updated' || key === 'last_review') {
        if (typeof obj[key] === 'string') {
          obj[key] = new Date(obj[key])
        }
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        obj[key] = reviveDates(obj[key])
      }
    }
  }

  return obj
}

async function exportToJson() {
  if (isExporting.value) return
  isExporting.value = true

  try {
    const exportData: { decks: Deck[]; cards: Record<string, Card[]> } = {
      decks: [],
      cards: {},
    }

    exportData.decks = [...decks.value].map((deck) => {
      const cleanDeck = { ...deck }
      return cleanDeck
    })

    for (const deck of exportData.decks) {
      let cards: Card[] = []

      if (deck.type === 'local') {
        cards = await localDb.getAllCardsFromDeck(deck._id)
      } else if (deck.type === 'cloud') {
        cards = await cloudDb.getAllCardsFromDeck(deck._id)
      }

      exportData.cards[deck._id] = cards.map((card) => ({ ...card }))
    }

    const jsonData = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    const filename = `flashcards_export_${new Date().toISOString().split('T')[0]}.json`
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Ошибка экспорта:', error)
  } finally {
    isExporting.value = false
  }
}

function triggerFileInput() {
  fileInput.value?.click()
}

async function handleFileSelect(event: Event) {
  if (isImporting.value) return
  isImporting.value = true

  try {
    const input = event.target as HTMLInputElement
    if (!input.files || input.files.length === 0) {
      isImporting.value = false
      return
    }

    const file = input.files[0]
    const reader = new FileReader()

    reader.onload = async (e) => {
      try {
        const result = e.target?.result as string
        const parsedData = JSON.parse(result)
        const importData = reviveDates(parsedData)

        if (!importData.decks || !importData.cards) {
          throw new Error('Некорректный формат импорта')
        }

        for (const deck of importData.decks) {
          deck.type = 'local'

          const existingDeckIndex = decks.value.findIndex((d) => d._id === deck._id)

          if (existingDeckIndex >= 0) {
            try {
              await localDb.deleteDeck(deck._id)
            } catch (error) {
              console.log('Ошибка при удалении колоды', error)
            }
          }

          await localDb.createDeck(deck)

          if (existingDeckIndex >= 0) {
            decks.value[existingDeckIndex] = deck
          } else {
            decks.value.push(deck)
          }

          const deckCards = importData.cards[deck._id] || []
          for (const card of deckCards) {
            card.deck_id = deck._id

            try {
              await localDb.deleteCard(card._id).catch(() => {})
              await localDb.createCard(card)
            } catch (error) {
              console.error('Ошибка импорта:', error)
            }
          }
        }
      } catch (error) {
        console.error('Ошибка импорта:', error)
      } finally {
        input.value = ''
        isImporting.value = false
      }
    }

    reader.onerror = () => {
      console.error('Ошибка чтения файла')
      isImporting.value = false
    }

    reader.readAsText(file)
  } catch (error) {
    console.error('Ошибка импорта:', error)
    isImporting.value = false
  }
}
</script>

<template>
  <main>
    <h1>Настройки</h1>

    <div class="settings">
      <label class="setting">
        Тёмная тема
        <input type="checkbox" v-model="settings.darkMode" />
      </label>
      <label class="setting">
        Показывать магазин колод
        <input type="checkbox" v-model="settings.showStore" />
      </label>
      <label class="setting">
        Лимит новых карточек в день
        <select v-model="settings.cardLimit">
          <option v-for="i in 10" :value="i * 5">{{ i * 5 }}</option>
        </select>
      </label>
    </div>

    <div class="export-import">
      <button @click="triggerFileInput" :disabled="isImporting">
        <IconJson /> {{ isImporting ? 'Импорт...' : 'Импорт' }}
      </button>
      <button @click="exportToJson" :disabled="isExporting">
        <IconJson /> {{ isExporting ? 'Экспорт...' : 'Экспорт' }}
      </button>
      <input
        type="file"
        ref="fileInput"
        accept=".json"
        style="display: none"
        @change="handleFileSelect"
      />
    </div>

    <div v-if="!isLoggedIn" class="login">
      <RouterLink :to="{ name: 'login' }">Войти в аккаунт</RouterLink>
    </div>
    <div v-else class="logout-container">
      <button class="logout" @click="logout">Выйти из аккаунта</button>
    </div>

    <div class="docs"><a href="/docs">Документация</a></div>
  </main>
</template>

<style scoped>
h1 {
  font-size: 1.3rem;
  text-align: center;
  padding: 1rem;
}

.settings {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.setting {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

select {
  padding: 0.1rem 0.3rem;
  border-radius: 0.5rem;
}

input[type='checkbox'] {
  height: 0.9rem;
  width: 0.9rem;
}

.export-import {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  padding-inline: 1rem;

  button {
    border: 0.05rem solid rgb(221, 221, 221);
    border-radius: 0.5rem;
    padding: 0.5rem;
    display: flex;
    justify-content: center;
    gap: 0.5rem;
  }
}

.login {
  margin-top: 1.3rem;
  color: var(--color-foreground);
  text-align: center;
}

.logout-container {
  margin-top: 1.3rem;
  display: flex;
  justify-content: center;
}

.logout {
  color: rgb(255, 84, 84);
}

.docs {
  margin-top: 0.7rem;
  text-align: center;
}
</style>
