<script setup lang="ts">
import { ref, computed, onBeforeMount, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useDecksStore } from '@/stores/decks'
import { useSettingsStore } from '@/stores/settings'
import { localDb, cloudDb } from '@/db/db'
import IconDecks from '@/icons/IconDecks.vue'
import IconDecksFill from '@/icons/IconDecksFill.vue'
import IconNew from '@/icons/IconNew.vue'
import IconNewFill from '@/icons/IconNewFill.vue'
import IconSettings from '@/icons/IconSettings.vue'
import IconSettingsFill from '@/icons/IconSettingsFill.vue'
import IconStore from '@/icons/IconStore.vue'
import IconStoreFill from '@/icons/IconStoreFill.vue'

const route = useRoute()

const { decks, decksFetched } = storeToRefs(useDecksStore())
const { settings } = storeToRefs(useSettingsStore())

onBeforeMount(async () => {
  const [localDecks, cloudDecks] = await Promise.all([
    localDb.getAllDecks().catch(() => []),
    cloudDb.getAllDecks().catch(() => []),
  ])

  decks.value.push(...localDecks, ...cloudDecks)

  decksFetched.value = true
})

const width = ref(window.innerWidth)

const layout = computed(() => {
  return !width.value || width.value < 1020 ? 'mobile' : 'desktop'
})

function handleResize() {
  width.value = window.innerWidth
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <template v-if="decksFetched">
    <div class="container" :class="{ 'container-desktop': layout === 'desktop' }">
      <RouterView class="router-view" :class="{ 'router-view-desktop': layout === 'desktop' }" />

      <nav :class="{ 'nav-desktop': layout === 'desktop' }">
        <RouterLink :to="{ name: 'decks' }" class="nav-item" aria-label="Колоды">
          <IconDecksFill class="nav-icon" v-if="route.name === 'decks'" />
          <IconDecks v-else class="nav-icon" />
          <div v-if="layout === 'desktop'" class="nav-label">Колоды</div>
        </RouterLink>

        <RouterLink :to="{ name: 'new' }" class="nav-item" aria-label="Новая карточка/колода">
          <IconNewFill class="nav-icon" v-if="route.name === 'new'" />
          <IconNew v-else class="nav-icon" />
          <div v-if="layout === 'desktop'" class="nav-label">Создать</div>
        </RouterLink>

        <RouterLink
          v-if="settings.showStore"
          :to="{ name: 'store' }"
          class="nav-item"
          aria-label="Магазин"
        >
          <IconStoreFill class="nav-icon" v-if="route.name === 'store'" />
          <IconStore v-else class="nav-icon" />
          <div v-if="layout === 'desktop'" class="nav-label">Магазин</div>
        </RouterLink>

        <RouterLink :to="{ name: 'settings' }" class="nav-item" aria-label="Настройки">
          <IconSettingsFill class="nav-icon" v-if="route.name === 'settings'" />
          <IconSettings v-else class="nav-icon" />
          <div v-if="layout === 'desktop'" class="nav-label">Настройки</div>
        </RouterLink>
      </nav>
    </div>
  </template>
</template>

<style scoped>
.container {
  position: relative;
}

.container-desktop {
  max-width: 40rem;
  margin-inline: auto;
}

.router-view {
  height: calc(100dvh - 3.5rem - env(safe-area-inset-bottom));
  overflow-y: auto;
}

.router-view-desktop {
  height: 100dvh;
  overflow-y: visible;
}

nav {
  height: 3.5rem;
  display: flex;
  justify-content: space-around;
  align-items: flex-start;
  padding-top: 1rem;
  padding-bottom: env(safe-area-inset-bottom);
  border-top: 0.05rem solid var(--color-border-secondary);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.7rem;
}

a {
  text-decoration: none;
  color: var(--color-foreground);
}

.nav-desktop {
  position: absolute;
  flex-direction: column;
  gap: 1rem;
  top: 2rem;
  left: -10rem;
  border: none;
}

.nav-icon {
  width: 1.5rem;
  height: 1.5rem;
}
</style>
