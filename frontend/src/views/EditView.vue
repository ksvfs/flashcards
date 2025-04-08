<script setup lang="ts">
import { ref, onBeforeMount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useDecksStore } from '@/stores/decks'
import { localDb, cloudDb } from '@/db/db'
import type { Card } from '@/types'

const router = useRouter()

const deckId = useRoute().params.deckId as string
const cardId = useRoute().params.cardId as string

const card = ref<Card | null>(null)

const { decks } = storeToRefs(useDecksStore())

const deckType = decks.value.find((deck) => deck._id === deckId)!.type

async function handleSubmit(): Promise<void> {
  if (!card.value) return

  if (deckType === 'local') {
    await localDb.updateCard({ ...card.value })
  } else if (deckType === 'cloud') {
    await cloudDb.updateCard({ ...card.value })
  }

  router.back()
}

onBeforeMount(async () => {
  if (deckType === 'local') {
    card.value = await localDb.getCard(cardId)
  } else if (deckType === 'cloud') {
    card.value = await cloudDb.getCard(cardId)
  }
})
</script>

<template>
  <main>
    <h1>Редактирование</h1>

    <form v-if="card" @submit.prevent="handleSubmit">
      <textarea v-model="card.front"></textarea>
      <textarea v-model="card.back"></textarea>

      <button type="submit">Готово</button>
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

textarea {
  height: 5rem;
  resize: none;
  padding: 0.5rem;
  border-radius: 0.5rem;
}

button {
  padding-block: 0.7rem;
  border-radius: 0.5rem;
  background-color: var(--foreground-color);
  color: rgb(255, 255, 255);
}
</style>
