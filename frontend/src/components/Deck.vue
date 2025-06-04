<script setup lang="ts">
import { ref, computed, watch, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'
import { localDb, cloudDb } from '@/db/db'
import { useDecksStore } from '@/stores/decks'
import { useSettingsStore } from '@/stores/settings'
import { storeToRefs } from 'pinia'
import IconLocal from '@/icons/IconLocal.vue'
import IconCloud from '@/icons/IconCloud.vue'
import IconThreeDots from '@/icons/IconThreeDots.vue'
import IconEdit from '@/icons/IconEdit.vue'
import IconDelete from '@/icons/IconDelete.vue'
import IconConvertToCloud from '@/icons/IconConvertToCloud.vue'
import IconConvertToLocal from '@/icons/IconConvertToLocal.vue'
import IconJson from '@/icons/IconJson.vue'
import IconMarkdown from '@/icons/IconMarkdown.vue'
import { useLoginStore } from '@/stores/login'
import type { CardCounts, Deck, Card } from '../../../common/types'

const router = useRouter()

const props = defineProps<{
  deck: Deck
  cardCounts: CardCounts | null
}>()

const { decks } = storeToRefs(useDecksStore())
const { settings } = storeToRefs(useSettingsStore())
const { isLoggedIn } = storeToRefs(useLoginStore())

const isConverting = ref(false)
const isExporting = ref(false)
const isExportingMarkdown = ref(false)

const currentDeckCardCounts = computed(() => {
  if (!props.cardCounts) return null

  if (!props.cardCounts[props.deck._id]) return { new: 0, old: 0 }

  return props.cardCounts[props.deck._id]
})

const showMenu = ref()

const menuElement = useTemplateRef('menu')

watch(showMenu, (newShowMenu) => {
  if (newShowMenu) {
    document.addEventListener('click', closeMenuOnClickOutside, true)
  } else {
    document.removeEventListener('click', closeMenuOnClickOutside, true)
  }
})

function closeMenuOnClickOutside(e: Event): void {
  if (!menuElement.value) return

  if (!menuElement.value.contains(e.target as Node)) {
    showMenu.value = false
  }
}

function deleteDeck() {
  if (props.deck.type === 'local') {
    localDb.deleteDeck(props.deck._id)
  } else if (props.deck.type === 'cloud') {
    cloudDb.deleteDeck(props.deck._id)
  }

  decks.value = decks.value.filter((deck) => deck._id !== props.deck._id)
}

function editDeck() {
  router.push({ name: 'edit-deck', params: { deckId: props.deck._id } })
}

function replaceImagesWithBase64(content: string, images: Record<string, string>): string {
  return content.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, imageId) => {
    const imageData = images[imageId]
    return imageData ? `![${alt}](${imageData})` : match
  })
}

async function exportToMarkdown() {
  if (isExportingMarkdown.value) return
  isExportingMarkdown.value = true

  try {
    let cards: Card[] = []
    if (props.deck.type === 'local') {
      cards = await localDb.getAllCardsFromDeck(props.deck._id)
    } else if (props.deck.type === 'cloud') {
      cards = await cloudDb.getAllCardsFromDeck(props.deck._id)
    }

    let markdownContent = `# ${props.deck.name}\n\n`

    cards.forEach((card, index) => {
      const frontContent = replaceImagesWithBase64(card.front, card.images || {})
      const backContent = replaceImagesWithBase64(card.back, card.images || {})

      markdownContent += `**Передняя сторона:**\n${frontContent}\n\n`
      markdownContent += `**Задняя сторона:**\n${backContent}\n\n`

      if (index < cards.length - 1) {
        markdownContent += `---\n\n`
      }
    })

    const blob = new Blob([markdownContent], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    const filename = `${props.deck.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.md`
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    showMenu.value = false
  } catch (error) {
    console.error('Ошибка экспорта в Markdown:', error)
  } finally {
    isExportingMarkdown.value = false
  }
}

async function exportToJson() {
  if (isExporting.value) return
  isExporting.value = true

  try {
    const exportData: { decks: Deck[]; cards: Record<string, Card[]> } = {
      decks: [{ ...props.deck }],
      cards: {},
    }

    let cards: Card[] = []
    if (props.deck.type === 'local') {
      cards = await localDb.getAllCardsFromDeck(props.deck._id)
    } else if (props.deck.type === 'cloud') {
      cards = await cloudDb.getAllCardsFromDeck(props.deck._id)
    }

    exportData.cards[props.deck._id] = cards.map((card) => ({ ...card }))

    const jsonData = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    const filename = `${props.deck.name.replace(/\s+/g, '_')}_export_${new Date().toISOString().split('T')[0]}.json`
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    showMenu.value = false
  } catch (error) {
    console.error('Ошибка экспорта:', error)
  } finally {
    isExporting.value = false
  }
}

async function convertToCloud() {
  if (isConverting.value) return
  isConverting.value = true
  try {
    const currentDeck = props.deck
    const cards = await localDb.getAllCardsFromDeck(currentDeck._id)

    try {
      await cloudDb.deleteDeck(currentDeck._id)
    } catch (error) {
      console.log('Нет колоды с таким id')
    }

    const payload = {
      deck: { ...currentDeck, type: 'cloud' as const },
      cards,
    }

    await cloudDb.convertToCloud(payload)

    const deckInStore = decks.value.find((d) => d._id === currentDeck._id)!
    deckInStore.type = 'cloud'

    await localDb.deleteDeck(currentDeck._id)

    showMenu.value = false
  } catch (error) {
    console.error('Ошибка конвертации в облачную колоду:', error)
  } finally {
    isConverting.value = false
  }
}

async function convertToLocal() {
  if (isConverting.value) return

  isConverting.value = true

  try {
    const cloudCards = await cloudDb.getAllCardsFromDeck(props.deck._id)

    const localDeckCopy = { ...props.deck, type: 'local' as const }

    try {
      await localDb.deleteDeck(localDeckCopy._id)
    } catch (error) {
      console.log('Нет колоды с таким id')
    }

    await localDb.createDeck(localDeckCopy)

    await Promise.all(cloudCards.map((card) => localDb.createCard(card)))

    const deckInStore = decks.value.find((d) => d._id === props.deck._id)!
    deckInStore.type = 'local'

    await cloudDb.deleteDeck(props.deck._id)

    showMenu.value = false
  } catch (error) {
    console.error('Ошибка конвертации в локальную колоду:', error)
  } finally {
    isConverting.value = false
  }
}
</script>

<template>
  <li @click="router.push({ name: 'study-deck', params: { deckId: deck._id } })">
    <div>{{ deck.name }}</div>

    <IconLocal v-if="deck.type === 'local'" class="deck-type-icon" />
    <IconCloud v-else-if="deck.type === 'cloud'" class="deck-type-icon icon-cloud" />

    <div class="card-counts" v-if="currentDeckCardCounts">
      <div class="card-counts-old" :class="{ 'no-cards': currentDeckCardCounts.old === 0 }">
        {{ currentDeckCardCounts.old }}
      </div>
      <div class="card-counts-new" :class="{ 'no-cards': currentDeckCardCounts.new === 0 }">
        {{
          currentDeckCardCounts.new <= settings.cardLimit
            ? currentDeckCardCounts.new
            : settings.cardLimit
        }}
      </div>
    </div>

    <button class="deck-menu-button" @click.stop="showMenu = true" aria-label="Меню">
      <IconThreeDots />
    </button>

    <div v-if="showMenu" class="menu" ref="menu">
      <button
        v-if="deck.type === 'local' && isLoggedIn"
        class="menu-item"
        @click.stop="convertToCloud"
        :disabled="isConverting"
      >
        <IconConvertToCloud />
        {{ isConverting ? 'Конвертация...' : 'Конвертировать в облачную колоду' }}
      </button>
      <button
        v-else-if="deck.type === 'cloud'"
        class="menu-item"
        @click.stop="convertToLocal"
        :disabled="isConverting"
      >
        <IconConvertToLocal />
        {{ isConverting ? 'Конвертация...' : 'Конвертировать в локальную колоду' }}
      </button>

      <button class="menu-item" @click.stop="exportToJson" :disabled="isExporting">
        <IconJson /> {{ isExporting ? 'Экспорт...' : 'Экспорт в JSON' }}
      </button>
      <button class="menu-item" @click.stop="exportToMarkdown" :disabled="isExportingMarkdown">
        <IconMarkdown /> {{ isExportingMarkdown ? 'Экспорт...' : 'Экспорт в Markdown' }}
      </button>

      <button class="menu-item" @click.stop="editDeck"><IconEdit /> Редактировать</button>
      <button class="menu-item menu-item-danger" @click.stop="deleteDeck">
        <IconDelete /> Удалить
      </button>
    </div>
  </li>
</template>

<style scoped>
li {
  position: relative;
  margin: 0.5rem;
  padding: 1rem;
  display: flex;
  align-items: center;
  border-radius: 0.5rem;
  background-color: var(--color-foreground-secondary);

  &:hover {
    cursor: pointer;
  }
}

.deck-type-icon {
  height: 0.7rem;
  width: 0.7rem;
  margin-left: 0.4rem;
}

.icon-cloud {
  margin-top: 0.15rem;
}

.card-counts {
  position: absolute;
  right: 2.5rem;
  font-size: 0.7rem;
}

.card-counts-old {
  color: rgb(0, 192, 0);
}

.card-counts-new {
  color: rgb(0, 195, 255);
}

.card-counts .no-cards {
  color: rgb(205, 205, 205);
}

.deck-menu-button {
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
  background-color: var(--color-background);
  box-shadow: rgba(99, 99, 99, 0.2) 0 0.125rem 0.5rem 0;
  z-index: 1;
  max-width: 14.5rem;
}

.menu-item {
  padding: 0.6rem 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 0.5rem;
  text-align: left;

  &:hover {
    background-color: var(--color-foreground-secondary);
  }

  & > * {
    flex-shrink: 0;
  }
}

.menu-item-danger {
  color: rgb(255, 60, 60);
}

.menu-item:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
