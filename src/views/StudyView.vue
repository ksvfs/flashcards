<script setup lang="ts">
import { ref, computed, onBeforeMount } from 'vue'
import { useRoute } from 'vue-router'
import { fsrs } from 'ts-fsrs'
import db from '@/db'
import type { Card } from '@/types'

type Grade = 'Заново' | 'Легко' | 'Средне' | 'Сложно'

const route = useRoute()

const cardsToReview = ref<Card[]>([])

const currentCard = computed(() => {
  return cardsToReview.value[0]
})

const isCardFlipped = ref(false)

function getTimeUntil(date: Date): string {
  const diffMs = date.getTime() - new Date().getTime()

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays > 0) return `${diffDays}d`

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  if (diffHours > 0) return `${diffHours}h`

  const diffMinutes = Math.ceil(diffMs / (1000 * 60))
  return `${diffMinutes}m`
}

function getCurrentCardRepetitionOptions(): { grade: Grade; due: string }[] {
  const f = fsrs()
  const scheduling = f.repeat(currentCard.value, new Date())
  const potentialDates = Object.values(scheduling).map((item) => item.card.due)
  const timeUntil = potentialDates.map((date) => getTimeUntil(date))

  return [
    { grade: 'Заново', due: timeUntil[0] },
    { grade: 'Сложно', due: timeUntil[1] },
    { grade: 'Средне', due: timeUntil[2] },
    { grade: 'Легко', due: timeUntil[3] },
  ]
}

function repeatCurrentCard(grade: Grade): void {
  const f = fsrs()
  const scheduling = f.repeat(currentCard.value, new Date())

  const gradesToSchedulingIndexes: Record<Grade, 1 | 2 | 3 | 4> = {
    Заново: 1,
    Сложно: 2,
    Средне: 3,
    Легко: 4,
  }

  const schdulingIndex = gradesToSchedulingIndexes[grade]

  const reviewedCard = scheduling[schdulingIndex].card

  const updatedCard = { ...currentCard.value, ...reviewedCard }

  db.updateCard(updatedCard)
  cardsToReview.value[0] = updatedCard

  isCardFlipped.value = false

  if (grade === 'Заново') return

  if (updatedCard.due.toDateString() === new Date().toDateString()) {
    cardsToReview.value.push(cardsToReview.value[0])
  }

  cardsToReview.value.shift()
}

onBeforeMount(async () => {
  const deckId = route.params.deck as string
  const allCardsFromDeck = await db.getAllCardsFromDeck(deckId)

  const today = new Date().setHours(0, 0, 0, 0)

  cardsToReview.value = allCardsFromDeck.filter(
    (card) => new Date(card.due).setHours(0, 0, 0, 0) <= today,
  )
})
</script>

<template>
  <main>
    <header>
      <h1>Повторение</h1>
    </header>

    <div v-if="currentCard">
      <div>{{ currentCard.front }}</div>
      <div v-if="isCardFlipped">{{ currentCard.back }}</div>

      <button v-if="!isCardFlipped" @click="isCardFlipped = true">Перевернуть</button>
      <div v-else>
        <button
          v-for="option in getCurrentCardRepetitionOptions()"
          :key="option.grade"
          @click="repeatCurrentCard(option.grade)"
        >
          {{ option.grade }} ({{ option.due }})
        </button>
      </div>
    </div>

    <div v-else>Сегодня нечего повторять</div>
  </main>
</template>

<style scoped>
header {
  padding-block: 0.7rem;
  border-bottom: 0.05rem solid rgb(209, 209, 209);
}

h1 {
  font-size: 1.3rem;
  text-align: center;
}
</style>
