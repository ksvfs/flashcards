<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useDecksStore } from '@/stores/decks'
import { useLoginStore } from '@/stores/login'
import { localDb, cloudDb } from '@/db/db'

const { decks } = storeToRefs(useDecksStore())
const { isLoggedIn } = storeToRefs(useLoginStore())

const newDeckName = ref('')
const newDeckType = ref<'local' | 'cloud'>('local')

async function handleSubmit() {
  const newDeck = {
    _id: crypto.randomUUID(),
    created: new Date(),
    updated: new Date(),
    name: newDeckName.value,
    type: newDeckType.value,
  }

  if (newDeckType.value === 'local') {
    localDb.createDeck(newDeck)
  } else if (newDeckType.value === 'cloud') {
    cloudDb.createDeck(newDeck)
  }

  decks.value.push(newDeck)

  newDeckName.value = ''
}
</script>

<template>
  <div class="type-switch">
    <button
      class="type-switch-option"
      :class="{ 'type-switch-option--active': newDeckType === 'local' }"
      @click="newDeckType = 'local'"
    >
      Локально
    </button>

    <button
      class="type-switch-option"
      :class="{ 'type-switch-option--active': newDeckType === 'cloud' }"
      @click="newDeckType = 'cloud'"
    >
      В облаке
    </button>

    <div
      class="type-switch-active-indicator"
      :class="{ 'type-switch-active-indicator--right': newDeckType === 'cloud' }"
    ></div>
  </div>

  <form @submit.prevent="handleSubmit" v-if="newDeckType === 'local' || isLoggedIn">
    <input type="text" placeholder="Название колоды" v-model.trim="newDeckName" />
    <button type="submit" :disabled="!newDeckName">Создать</button>
  </form>
  <div v-else class="not-logged-in">
    <RouterLink :to="{ name: 'login' }">Войдите в аккаунт</RouterLink>, чтобы создавать облачные
    колоды
  </div>
</template>

<style scoped>
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
  background-color: transparent;
  color: var(--color-foreground);
}
.type-switch-option--active {
  color: var(--color-background);
  transition: color 0.1s ease-out;
}

.type-switch-active-indicator {
  position: absolute;
  right: 50%;
  z-index: -1;
  width: 50%;
  height: 100%;
  border-radius: 1rem;
  background-color: var(--color-foreground);
  transition: right 0.1s ease-out;
}
.type-switch-active-indicator--right {
  right: 0;
}

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
  padding: 0.65rem;
  border: 0.05rem solid var(--color-foreground);
  background-color: var(--color-background);
}

button {
  padding-block: 0.7rem;
  background-color: var(--color-foreground);
  color: var(--color-background);
}

.not-logged-in {
  margin-top: 1rem;
  text-align: center;
}
</style>
