<script setup lang="ts">
import { onBeforeMount } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useDecksStore } from '@/stores/decks'
import { localDb, cloudDb } from '@/db/db'
import IconDecks from '@/icons/IconDecks.vue'
import IconDecksFill from '@/icons/IconDecksFill.vue'
import IconNew from '@/icons/IconNew.vue'
import IconNewFill from '@/icons/IconNewFill.vue'

const route = useRoute()

onBeforeMount(async () => {
  const { decks } = storeToRefs(useDecksStore())

  const localDecks = await localDb.getAllDecks()
  decks.value.push(...localDecks)

  const cloudDecks = await cloudDb.getAllDecks()
  decks.value.push(...cloudDecks)
})
</script>

<template>
  <RouterView class="router-view" />

  <nav>
    <RouterLink :to="{ name: 'decks' }">
      <IconDecksFill class="nav-icon" v-if="route.name === 'decks'" />
      <IconDecks v-else class="nav-icon" />
    </RouterLink>

    <RouterLink :to="{ name: 'new' }">
      <IconNewFill class="nav-icon" v-if="route.name === 'new'" />
      <IconNew v-else class="nav-icon" />
    </RouterLink>
  </nav>
</template>

<style scoped>
.router-view {
  height: calc(100dvh - 3.5rem);
  overflow-y: auto;
}

nav {
  height: 3.5rem;
  display: flex;
  justify-content: space-around;
  align-items: center;
  border-top: 0.05rem solid rgb(242, 242, 242);
}

.nav-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: var(--foreground-color);
}
</style>
