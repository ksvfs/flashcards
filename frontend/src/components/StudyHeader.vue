<script setup lang="ts">
import { ref, watch, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useDecksStore } from '@/stores/decks'
import { localDb, cloudDb } from '@/db/db'
import IconBrush from '@/icons/IconBrush.vue'
import IconBrushFill from '@/icons/IconBrushFill.vue'
import IconThreeDots from '@/icons/IconThreeDots.vue'
import IconEdit from '@/icons/IconEdit.vue'
import IconDelete from '@/icons/IconDelete.vue'
import type { Card } from '@/../../common/types'

const props = defineProps<{
  currentCard: Card | undefined
  drawingMode: boolean
}>()

const emit = defineEmits(['currentCardDeleted', 'drawModeToggled'])

const router = useRouter()

const showMenu = ref(false)

const menuElement = useTemplateRef('menu')

watch(showMenu, (newShowMenu) => {
  if (newShowMenu) {
    document.addEventListener('click', closeMenuOnClickOutside)
  } else {
    document.removeEventListener('click', closeMenuOnClickOutside)
  }
})

function closeMenuOnClickOutside(e: Event): void {
  if (!menuElement.value) return

  if (!menuElement.value.contains(e.target as Node)) {
    showMenu.value = false
  }
}

function deleteCurrentCard(): void {
  const currentCard = props.currentCard

  if (!currentCard) return

  const { decks } = storeToRefs(useDecksStore())

  const currentDeck = decks.value.find((deck) => deck._id === currentCard.deck_id)!

  if (currentDeck.type === 'local') {
    localDb.deleteCard(props.currentCard._id)
  } else if (currentDeck.type === 'cloud') {
    cloudDb.deleteCard(props.currentCard._id)
  }

  emit('currentCardDeleted')

  showMenu.value = false
}
</script>

<template>
  <header>
    <button v-if="currentCard" @click="emit('drawModeToggled')" class="draw">
      <IconBrushFill v-if="drawingMode" />
      <IconBrush v-else />
    </button>

    <h1>Повторение</h1>

    <button v-if="currentCard" class="menu-button" @click.stop="showMenu = true">
      <IconThreeDots class="menu-button-icon" />
    </button>

    <div v-if="currentCard && showMenu" class="menu" ref="menu">
      <button
        class="menu-item"
        @click="
          router.push({
            name: 'edit-card',
            params: { deckId: currentCard.deck_id, cardId: currentCard._id },
          })
        "
      >
        <IconEdit /> Редактировать
      </button>
      <button class="menu-item menu-item-danger" @click="deleteCurrentCard">
        <IconDelete /> Удалить
      </button>
    </div>
  </header>
</template>

<style scoped>
header {
  height: 3.5rem;
  padding-inline: 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
  border-bottom: 0.05rem solid var(--color-border-secondary);
}

.draw {
  position: absolute;
  left: 1rem;
}

.menu-button {
  position: absolute;
  right: 1rem;
}

h1 {
  font-size: 1.3rem;
}

.menu-button-icon {
  height: 1.3rem;
  width: 1.3rem;
}

.menu {
  position: absolute;
  z-index: 1;
  right: 1rem;
  top: 1rem;
  overflow: hidden;
  padding: 0.3rem;
  display: flex;
  flex-direction: column;
  border-radius: 0.5rem;
  background-color: var(--color-background);
  box-shadow: var(--modals-box-shadow);
  border: var(--modals-border);
}

.menu-item {
  padding: 0.6rem 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 0.5rem;

  &:hover {
    background-color: var(--color-foreground-secondary);
  }
}

.menu-item-danger {
  color: rgb(255, 60, 60);
}
</style>
