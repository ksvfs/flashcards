<script setup lang="ts">
import { ref, onBeforeMount, toRaw } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useDecksStore } from '@/stores/decks'
import { localDb, cloudDb } from '@/db/db'
import type { Card } from '@/../../common/types'

const router = useRouter()

const deckId = useRoute().params.deckId as string

const { decks } = storeToRefs(useDecksStore())

const currentDeck = decks.value.find((deck) => deck._id === deckId)!

const initialDeckName = currentDeck.name

const deckName = ref(initialDeckName)

async function handleSubmit(): Promise<void> {
  if (deckName.value === initialDeckName) {
    router.back()
    return
  }

  if (currentDeck.type === 'local') {
    localDb.updateDeck({ ...currentDeck, name: deckName.value })
  } else if (currentDeck.type === 'cloud') {
    cloudDb.updateDeck({ ...currentDeck, name: deckName.value })
  }

  currentDeck.name = deckName.value

  router.back()
}
</script>

<template>
  <main>
    <h1>Редактирование</h1>

    <form @submit.prevent="handleSubmit">
      <input type="text" v-model.trim="deckName" />
      <button type="submit" :disabled="!deckName">Готово</button>
    </form>
  </main>
</template>

<style scoped>
h1 {
  padding-block: 1.2rem 0.3rem;
  font-size: 1.3rem;
  text-align: center;
}

form {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

input {
  padding: 0.65rem;
  border: 0.05rem solid var(--color-foreground);
  border-radius: 0.5rem;
  background-color: var(--color-background);
}

button {
  padding-block: 0.7rem;
  border-radius: 0.5rem;
  background-color: var(--color-foreground);
  color: var(--color-background);
}
</style>
