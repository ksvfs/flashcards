<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useDecksStore } from '@/stores/decks'
import CreateCard from '@/components/CreateCard.vue'
import CreateDeck from '@/components/CreateDeck.vue'

const { decks } = storeToRefs(useDecksStore())

const type = ref<'card' | 'deck'>(decks.value.length ? 'card' : 'deck')
</script>

<template>
  <main>
    <h1>Создать</h1>

    <div class="type-switch">
      <button
        class="type-switch-option"
        :class="{ 'type-switch-option--active': type === 'card' }"
        @click="type = 'card'"
      >
        Карточку
      </button>

      <button
        class="type-switch-option"
        :class="{ 'type-switch-option--active': type === 'deck' }"
        @click="type = 'deck'"
      >
        Колоду
      </button>

      <div
        class="type-switch-active-indicator"
        :class="{ 'type-switch-active-indicator--right': type === 'deck' }"
      ></div>
    </div>

    <template v-if="type === 'card'">
      <CreateCard v-if="decks.length" />
      <div v-else>Создайте колоду перед тем, как создавать карточки</div>
    </template>

    <CreateDeck v-else-if="type === 'deck'" />
  </main>
</template>

<style scoped>
main {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

h1 {
  font-size: 1.3rem;
  text-align: center;
}

.type-switch {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  border: 0.05rem solid rgb(221, 221, 221);
  border-radius: 1rem;
}

.type-switch-option {
  padding-block: 0.5rem;
  border-radius: 1rem;
}
.type-switch-option--active {
  color: rgb(255, 255, 255);
  transition: color 0.1s ease-out;
}

.type-switch-active-indicator {
  position: absolute;
  right: 50%;
  z-index: -1;
  width: 50%;
  height: 100%;
  border-radius: 1rem;
  background-color: var(--foreground-color);
  transition: right 0.1s ease-out;
}
.type-switch-active-indicator--right {
  right: 0;
}
</style>
