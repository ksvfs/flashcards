<script setup lang="ts">
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useDecksStore } from '@/stores/decks'

const router = useRouter()

const { decks } = storeToRefs(useDecksStore())
</script>

<template>
  <main>
    <h1>Колоды</h1>

    <ul v-if="decks.length">
      <li
        v-for="deck in decks"
        :key="deck.id"
        @click="router.push({ name: 'study', params: { deckId: deck.id } })"
      >
        {{ deck.name }}
      </li>
    </ul>

    <div v-else>Пока нет колод</div>
  </main>
</template>

<style scoped>
h1 {
  padding-block: 1rem 0.5rem;
  font-size: 1.3rem;
  font-weight: bold;
  text-align: center;
}

ul {
  list-style-type: none;
}

li {
  margin: 0.5rem;
  padding: 1rem;
  border-radius: 0.5rem;
  background-color: rgb(243, 243, 243);

  &:hover {
    cursor: pointer;
  }
}
</style>
