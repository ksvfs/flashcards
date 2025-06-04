<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useDecksStore } from '@/stores/decks'
import Deck from '@/components/Deck.vue'
import { onBeforeMount } from 'vue'
import type { CardCounts } from '../../../common/types'
import { localDb, cloudDb } from '@/db/db'
import IconShuffle from '@/icons/IconShuffle.vue'
import { useRouter } from 'vue-router'
const { decks } = storeToRefs(useDecksStore())

const cardCounts = ref<CardCounts | null>(null)

const cardsForToday = computed(() => {
  if (!cardCounts.value) return 0

  const deckIds = new Set(decks.value.map((deck) => deck._id))

  return Object.entries(cardCounts.value).reduce(
    (total, [deckId, { new: newValue, old: oldValue }]) => {
      if (deckIds.has(deckId)) {
        return total + newValue + oldValue
      }
      return total
    },
    0,
  )
})

const router = useRouter()

onBeforeMount(() => {
  localDb
    .getCardCounts()
    .then((localCardCounts) => (cardCounts.value = { ...cardCounts.value, ...localCardCounts }))
    .catch(() => {})

  cloudDb
    .getCardCounts()
    .then((cloudCardCounts) => (cardCounts.value = { ...cardCounts.value, ...cloudCardCounts }))
    .catch(() => {})
})
</script>

<template>
  <main>
    <h1>Колоды</h1>

    <ul v-if="decks.length">
      <Deck v-for="deck in decks" :key="deck._id" :deck :card-counts />
    </ul>

    <div v-else class="no-decks">
      <img src="/images/no-decks.svg" alt="Пока нет колод" class="no-decks-image" />
      <div class="no-decks-text">Пока нет колод</div>
      <RouterLink :to="{ name: 'new' }" class="no-decks-link">Создать</RouterLink>
    </div>

    <button v-if="cardsForToday" class="shuffle" @click="router.push({ name: 'study-all' })">
      <IconShuffle /> Повторить все
    </button>
  </main>
</template>

<style scoped>
main {
  position: relative;
}

h1 {
  padding-block: 1rem 0.5rem;
  font-size: 1.3rem;
  font-weight: bold;
  text-align: center;
}

ul {
  list-style-type: none;
}

.no-decks {
  width: 10rem;
  position: absolute;
  top: 55%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.no-decks-text {
  margin-top: 1.3rem;
}

.no-decks-link {
  margin-top: 0.7rem;
}

.shuffle {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  left: 50%;
  transform: translateX(-50%);
  bottom: 1rem;
  padding: 0.5rem 1rem;
  background-color: var(--color-foreground);
  color: var(--color-background);
  border-radius: 1rem;
}
</style>
