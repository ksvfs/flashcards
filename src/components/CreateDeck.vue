<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useDecksStore } from '@/stores/decks'
import db from '@/db'

const { decks } = storeToRefs(useDecksStore())

const newDeckName = ref('')

async function handleSubmit() {
  const newDeck = { id: crypto.randomUUID(), name: newDeckName.value }
  db.createDeck(newDeck)
  decks.value.push(newDeck)
  newDeckName.value = ''
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <input type="text" placeholder="Название колоды" v-model.trim="newDeckName" />
    <button type="submit" :disabled="!newDeckName">Создать</button>
  </form>
</template>

<style scoped>
form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

input,
button {
  border-radius: 0.5rem;
}

input {
  padding: 0.5rem;
  border: 0.05rem solid var(--foreground-color);
}

button {
  padding-block: 0.5rem;
  background-color: var(--foreground-color);
  color: rgb(255, 255, 255);
}
</style>
