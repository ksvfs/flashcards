<script setup lang="ts">
import { onBeforeMount, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useDecksStore } from '@/stores/decks'
import { createEmptyCard } from 'ts-fsrs'
import type { PublicDeck, Card, Deck, PublicCard } from '../../../common/types'
import { localDb, cloudDb } from '@/db/db'
import IconCards from '@/icons/IconCards.vue'
import IconDownloads from '@/icons/IconDownloads.vue'

const publicDecks = ref<PublicDeck[]>([])
const isAddingDeck = ref<Record<string, boolean>>({})
const { decks } = storeToRefs(useDecksStore())

onBeforeMount(async () => {
  publicDecks.value = await cloudDb.getPublicDecks()
})

async function addDeck(publicDeck: PublicDeck) {
  if (isAddingDeck.value[publicDeck._id]) return
  isAddingDeck.value[publicDeck._id] = true

  try {
    const newDeck: Deck = {
      _id: crypto.randomUUID(),
      name: publicDeck.name,
      created: new Date(),
      updated: new Date(),
      type: 'local',
    }

    await localDb.createDeck(newDeck)

    decks.value.push(newDeck)

    const publicCards: PublicCard[] = await cloudDb.getPublicCards(publicDeck._id)

    for (const publicCard of publicCards) {
      const newCard: Card = {
        ...createEmptyCard(new Date()),
        _id: crypto.randomUUID(),
        deck_id: newDeck._id,
        created: new Date(),
        updated: new Date(),
        front: publicCard.front,
        back: publicCard.back,
        images: publicCard.images || {},
      }

      await localDb.createCard(newCard)
    }

    publicDecks.value = await cloudDb.getPublicDecks()
  } catch (error) {
    console.error('Ошибка при добавлении колоды:', error)
  } finally {
    isAddingDeck.value[publicDeck._id] = false
  }
}
</script>

<template>
  <main>
    <h1>Магазин</h1>

    <div class="decks">
      <div v-for="deck in publicDecks" :key="deck._id" class="deck">
        <div class="deck-info">
          <div class="deck-name">{{ deck.name }}</div>
          <div class="deck-stats">
            <div class="deck-stats-item"><IconCards class="icon" /> {{ deck.cards }}</div>
            <div class="deck-stats-item"><IconDownloads /> {{ deck.downloads }}</div>
          </div>
        </div>

        <button @click="addDeck(deck)" :disabled="isAddingDeck[deck._id]">
          {{ isAddingDeck[deck._id] ? 'Добавление...' : 'Добавить' }}
        </button>
      </div>
    </div>
  </main>
</template>

<style scoped>
h1 {
  font-size: 1.3rem;
  text-align: center;
  padding: 1rem;
}

.decks {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-top: 0.3rem;
}

.deck {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 0.5rem;
  background-color: var(--color-foreground-secondary);
  padding: 0.8rem 1rem;
}

.deck-stats {
  padding-top: 0.3rem;
  font-size: 0.9rem;
  display: flex;
  gap: 1rem;
}

.deck-stats-item {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.icon {
  height: 0.9rem;
  width: 0.9rem;
}

button {
  padding: 0.5rem 1rem;
  background-color: var(--color-foreground);
  color: var(--color-background);
  border-radius: 0.5rem;
}
</style>
