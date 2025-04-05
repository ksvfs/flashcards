<script setup lang="ts">
import { ref, computed, onBeforeMount } from 'vue'
import { useRoute } from 'vue-router'
import { fsrs } from 'ts-fsrs'
import StudyHeader from '@/components/StudyHeader.vue'
import IconCheck from '@/icons/IconCheck.vue'
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
    <StudyHeader :current-card @current-card-deleted="cardsToReview.shift()" />

    <div class="study">
      <div v-if="currentCard" class="card">
        <div v-if="isCardFlipped && currentCard.back">{{ currentCard.back }}</div>
        <div v-else>{{ currentCard.front }}</div>
      </div>

      <div v-else class="done">
        <IconCheck class="done-icon" />
        <div>Сегодня нечего повторять</div>
      </div>

      <div v-if="currentCard" class="actions">
        <div v-if="isCardFlipped" class="repeat-buttons">
          <button
            v-for="option in getCurrentCardRepetitionOptions()"
            :key="option.grade"
            class="repeat-button"
            :class="`repeat-button-${option.grade.toLowerCase()}`"
            @click="repeatCurrentCard(option.grade)"
          >
            <div>{{ option.due }}</div>
            <div>{{ option.grade }}</div>
          </button>
        </div>

        <button v-else class="flip-button" @click="isCardFlipped = true">Перевернуть</button>
      </div>
    </div>
  </main>
</template>

<style scoped>
.study {
  height: calc(100% - 3.5rem);
  display: flex;
  flex-direction: column;
}

.card {
  margin: 1rem;
  padding: 1rem;
  flex: 1;
  text-align: center;
  align-content: center;
  white-space: pre;
  overflow-y: auto;
  border-radius: 0.5rem;
  box-shadow: rgba(100, 100, 111, 0.2) 0 0.45rem 1.8rem 0;
}

.done {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 1rem;
}

.done-icon {
  width: 3rem;
  height: 3rem;
}

.actions {
  padding: 0 1rem 1rem;
}

.repeat-buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  border-radius: 0.5rem;
  overflow: hidden;
}

.repeat-button {
  padding-block: 0.4rem;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  font-size: 0.9rem;
}
.repeat-button-заново {
  background-color: rgb(255, 204, 211);
}
.repeat-button-сложно {
  background-color: rgb(255, 240, 133);
}
.repeat-button-средне {
  background-color: rgb(185, 248, 207);
}
.repeat-button-легко {
  background-color: rgb(162, 244, 253);
}

.flip-button {
  width: 100%;
  padding: 0.9rem;
  border-radius: 0.5rem;
  background-color: var(--foreground-color);
  color: rgb(255, 255, 255);
}
</style>
