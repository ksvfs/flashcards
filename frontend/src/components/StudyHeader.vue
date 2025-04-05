<script setup lang="ts">
import { ref, watch, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'
import IconThreeDots from '@/icons/IconThreeDots.vue'
import IconEdit from '@/icons/IconEdit.vue'
import IconDelete from '@/icons/IconDelete.vue'
import db from '@/db'
import type { Card } from '@/types'

const props = defineProps<{
  currentCard: Card | undefined
}>()

const emit = defineEmits(['currentCardDeleted'])

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
  if (!props.currentCard) return
  db.deleteCard(props.currentCard.id)
  emit('currentCardDeleted')
}
</script>

<template>
  <header>
    <h1>Повторение</h1>

    <button v-if="currentCard" class="menu-button" @click.stop="showMenu = true">
      <IconThreeDots class="menu-button-icon" />
    </button>

    <div v-if="currentCard && showMenu" class="menu" ref="menu">
      <button
        class="menu-item"
        @click="router.push({ name: 'edit', params: { cardId: currentCard.id } })"
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
  display: flex;
  justify-content: center;
  align-items: center;
  border-bottom: 0.05rem solid rgb(242, 242, 242);
}

h1 {
  font-size: 1.3rem;
}

.menu-button {
  position: absolute;
  right: 1rem;
}

.menu-button-icon {
  height: 1.3rem;
  width: 1.3rem;
}

.menu {
  position: absolute;
  right: 1rem;
  top: 1rem;
  overflow: hidden;
  padding: 0.3rem;
  display: flex;
  flex-direction: column;
  border-radius: 0.5rem;
  background-color: rgb(255, 255, 255);
  box-shadow: rgba(99, 99, 99, 0.2) 0 0.125rem 0.5rem 0;
}

.menu-item {
  padding: 0.6rem 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 0.5rem;

  &:hover {
    background-color: rgb(246, 246, 246);
  }
}

.menu-item-danger {
  color: rgb(255, 60, 60);
}
</style>
