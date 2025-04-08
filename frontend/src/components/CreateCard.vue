<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { createEmptyCard } from 'ts-fsrs'
import { useDecksStore } from '@/stores/decks'
import { localDb, cloudDb } from '@/db/db'

const { decks } = storeToRefs(useDecksStore())

const currentDeck = ref(decks.value[0])
const newCardFront = ref('')
const newCardBack = ref('')

function handleSubmit() {
  const newCard = {
    ...createEmptyCard(new Date()),
    _id: crypto.randomUUID(),
    deckId: currentDeck.value._id,
    front: newCardFront.value,
    back: newCardBack.value,
  }

  if (currentDeck.value.type === 'local') {
    localDb.createCard(newCard)
  } else if (currentDeck.value.type === 'cloud') {
    cloudDb.createCard(newCard)
  }

  newCardFront.value = ''
  newCardBack.value = ''
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <select v-model="currentDeck">
      <option v-for="deck in decks" :key="deck._id" :value="deck">
        {{ deck.name }}
      </option>
    </select>

    <textarea placeholder="Передняя сторона" v-model.trim="newCardFront"></textarea>
    <textarea placeholder="Задняя сторона" v-model.trim="newCardBack"></textarea>

    <button type="submit" :disabled="!newCardFront">Создать</button>
  </form>
</template>

<style scoped>
form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

select,
textarea,
button {
  border-radius: 0.5rem;
}

select {
  padding: 0.5rem;
}

textarea {
  height: 5rem;
  resize: none;
  padding: 0.5rem;
}

button {
  padding-block: 0.7rem;
  background-color: var(--foreground-color);
  color: rgb(255, 255, 255);
}
</style>
