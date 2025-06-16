<script setup lang="ts">
import { ref, computed, onBeforeMount } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { fsrs } from 'ts-fsrs'
import { marked } from 'marked'
import createDOMPurify from 'dompurify'
import StudyHeader from '@/components/StudyHeader.vue'
import IconCheck from '@/icons/IconCheck.vue'
import { useDecksStore } from '@/stores/decks'
import { useSettingsStore } from '@/stores/settings'
import DrawingMode from '@/components/DrawingMode.vue'
import { localDb, cloudDb } from '@/db/db'
import type { Card } from '@/../../common/types'

type Grade = 'Заново' | 'Легко' | 'Средне' | 'Сложно'

const route = useRoute()

const { decks } = storeToRefs(useDecksStore())
const { settings } = storeToRefs(useSettingsStore())

const hasDeckId = computed(() => !!route.params.deckId)
const deckType = computed(() => {
  if (!hasDeckId.value) return null
  return decks.value.find((deck) => deck._id === route.params.deckId)?.type
})

const cardsToReview = ref<Card[]>([])
const isLoading = ref(true)

const currentCard = computed(() => {
  return cardsToReview.value[0]
})

const DOMPurify = createDOMPurify(window)

const drawingMode = ref(false)

DOMPurify.setConfig({
  ALLOWED_URI_REGEXP: /^(?:(?:https?|blob):|data:image\/)/,
})

function replaceIdsWithDataUris(content: string, images: Record<string, string>): string {
  return content.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (full, alt, id) => {
    const dataUri = images[id]
    return dataUri ? `![${alt}](${dataUri})` : full
  })
}

const currentCardContent = computed(() => ({
  front: DOMPurify.sanitize(
    marked.parse(
      replaceIdsWithDataUris(currentCard.value.front, currentCard.value.images || {}),
    ) as string,
  ),
  back: DOMPurify.sanitize(
    marked.parse(
      replaceIdsWithDataUris(currentCard.value.back, currentCard.value.images || {}),
    ) as string,
  ),
}))
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

  const schedulingIndex = gradesToSchedulingIndexes[grade]

  const reviewedCard = scheduling[schedulingIndex].card

  const updatedCard = { ...currentCard.value, ...reviewedCard }

  if (currentCard.value.images) {
    updatedCard.images = { ...currentCard.value.images }
  }

  const cardDeckType = hasDeckId.value
    ? deckType.value
    : decks.value.find((deck) => deck._id === currentCard.value.deck_id)?.type

  if (cardDeckType === 'local') {
    localDb.updateCard(updatedCard)
  } else if (cardDeckType === 'cloud') {
    cloudDb.updateCard(updatedCard)
  }

  cardsToReview.value[0] = updatedCard

  isCardFlipped.value = false

  if (grade === 'Заново') return

  if (updatedCard.due.toDateString() === new Date().toDateString()) {
    cardsToReview.value.push(cardsToReview.value[0])
  }

  cardsToReview.value.shift()
}

onBeforeMount(async () => {
  const today = new Date().setHours(0, 0, 0, 0)

  if (hasDeckId.value) {
    const deckId = route.params.deckId as string
    let allCardsFromDeck: Card[] = []

    if (deckType.value === 'local') {
      allCardsFromDeck = await localDb.getAllCardsFromDeck(deckId)
    } else if (deckType.value === 'cloud') {
      allCardsFromDeck = await cloudDb.getAllCardsFromDeck(deckId)
    }

    const dueCards = allCardsFromDeck.filter((card) => {
      const dueDate = card.due instanceof Date ? card.due : new Date(card.due)
      return dueDate.setHours(0, 0, 0, 0) <= today
    })

    const newCards = dueCards.filter((card) => card.reps === 0)
    const reviewCards = dueCards.filter((card) => card.reps > 0)

    const limitedNewCards = newCards.slice(0, settings.value.cardLimit)

    cardsToReview.value = [...reviewCards, ...limitedNewCards].sort(() => Math.random() - 0.5)
  } else {
    const localCards = await localDb.getAllCards()

    let cloudCards: Card[] = []
    try {
      cloudCards = await cloudDb.getAllCards()
    } catch (error) {}

    const allCards = [...localCards, ...cloudCards]
    const dueCards = allCards.filter((card) => {
      const dueDate = card.due instanceof Date ? card.due : new Date(card.due)
      return dueDate.setHours(0, 0, 0, 0) <= today
    })

    const newCards = dueCards.filter((card) => card.reps === 0)
    const reviewCards = dueCards.filter((card) => card.reps > 0)

    const limitedNewCards = newCards.slice(0, settings.value.cardLimit)

    cardsToReview.value = [...reviewCards, ...limitedNewCards].sort(() => Math.random() - 0.5)
  }

  isLoading.value = false
})
</script>

<template>
  <main>
    <StudyHeader
      :current-card
      :drawing-mode
      @draw-mode-toggled="drawingMode = !drawingMode"
      @current-card-deleted="cardsToReview.shift()"
    />

    <div class="study">
      <DrawingMode v-if="drawingMode" class="draw" />

      <div v-if="currentCard" class="card">
        <div v-if="isCardFlipped && currentCard.back" v-html="currentCardContent.back"></div>
        <div v-else v-html="currentCardContent.front"></div>
      </div>

      <div v-else-if="!isLoading" class="done">
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
  position: relative;
  height: calc(100% - 3.5rem);
  display: flex;
  flex-direction: column;
}

.draw {
  position: absolute;
}

.card {
  margin: 1rem;
  padding: 1rem;
  flex: 1;
  text-align: center;
  align-content: center;
  overflow-y: auto;
  line-height: 1.6;
  border-radius: 0.5rem;
  box-shadow: rgba(100, 100, 111, 0.2) 0 0.45rem 1.8rem 0;
}

:deep(.card img) {
  border-radius: 0.5rem;
  margin-top: 0.5rem;
  margin-bottom: -1rem;
}

:deep(.card ul),
:deep(.card li) {
  list-style-position: inside;
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
  align-items: center;
  gap: 0.1rem;
  font-size: 0.9rem;
  color: rgb(85, 85, 85);
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
  background-color: var(--color-foreground);
  color: var(--color-background);
}
</style>
