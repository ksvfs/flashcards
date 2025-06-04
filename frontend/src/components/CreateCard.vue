<script setup lang="ts">
import { ref, useTemplateRef, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { createEmptyCard } from 'ts-fsrs'
import { useDecksStore } from '@/stores/decks'
import { localDb, cloudDb } from '@/db/db'
import IconArrow from '@/icons/IconArrow.vue'
import IconPaperclip from '@/icons/IconPaperclip.vue'

const { decks } = storeToRefs(useDecksStore())

const currentDeck = ref(decks.value[0])
const newCardFront = ref('')
const newCardBack = ref('')

const deckSelectOpen = ref(false)
const deckSelectElement = useTemplateRef('select')

watch(deckSelectOpen, (newShow) => {
  if (newShow) {
    document.addEventListener('click', closeMenuOnClickOutside, true)
  } else {
    document.removeEventListener('click', closeMenuOnClickOutside, true)
  }
})

function closeMenuOnClickOutside(e: Event) {
  if (!deckSelectElement.value) return
  if (!deckSelectElement.value.contains(e.target as Node)) {
    deckSelectOpen.value = false
  }
}

function selectDeck(id: string) {
  currentDeck.value = decks.value.find((d) => d._id === id)!
  deckSelectOpen.value = false
}

const attachedImages: Record<string, string> = {}

const textareaFront = useTemplateRef('textareaFront')
const textareaBack = useTemplateRef('textareaBack')
const fileInputFront = useTemplateRef('fileInputFront')
const fileInputBack = useTemplateRef('fileInputBack')

function handleSubmit() {
  const usedImageIds = new Set<string>()

  const frontImageMatches = newCardFront.value.match(/!\[.*?\]\((.*?)\)/g) || []
  frontImageMatches.forEach((match) => {
    const id = match.match(/!\[.*?\]\((.*?)\)/)![1]
    usedImageIds.add(id)
  })

  const backImageMatches = newCardBack.value.match(/!\[.*?\]\((.*?)\)/g) || []
  backImageMatches.forEach((match) => {
    const id = match.match(/!\[.*?\]\((.*?)\)/)![1]
    usedImageIds.add(id)
  })

  const cleanedImages: Record<string, string> = {}
  for (const [id, dataUrl] of Object.entries(attachedImages)) {
    if (usedImageIds.has(id)) {
      cleanedImages[id] = dataUrl
    }
  }

  const newCard = {
    ...createEmptyCard(new Date()),
    _id: crypto.randomUUID(),
    deck_id: currentDeck.value._id,
    created: new Date(),
    updated: new Date(),
    front: newCardFront.value,
    back: newCardBack.value,
    images: cleanedImages,
  }
  if (currentDeck.value.type === 'local') {
    localDb.createCard(newCard)
  } else {
    cloudDb.createCard(newCard)
  }
  newCardFront.value = ''
  newCardBack.value = ''
}

function insertImageAtCursor(textarea: HTMLTextAreaElement, id: string) {
  const markup = `![image](${id})`
  const start = textarea.selectionStart
  textarea.setRangeText(markup, start, textarea.selectionEnd, 'end')
  textarea.dispatchEvent(new Event('input'))
}

function handleImagePaste(event: ClipboardEvent) {
  if (!event.clipboardData) return
  const textarea = event.target as HTMLTextAreaElement
  for (const item of Array.from(event.clipboardData.items)) {
    if (!item.type.startsWith('image/')) continue
    event.preventDefault()
    const file = item.getAsFile()
    if (!file) continue
    const id = crypto.randomUUID()
    const reader = new FileReader()
    reader.onload = () => {
      attachedImages[id] = reader.result as string
      insertImageAtCursor(textarea, id)
    }
    reader.readAsDataURL(file)
  }
}

function handleFileClick(side: 'front' | 'back') {
  const input = side === 'front' ? fileInputFront.value : fileInputBack.value
  input?.click()
}

function handleFileSelect(side: 'front' | 'back', e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const id = crypto.randomUUID()
  const reader = new FileReader()
  reader.onload = () => {
    attachedImages[id] = reader.result as string
    const ta = side === 'front' ? textareaFront.value : textareaBack.value
    if (ta) insertImageAtCursor(ta, id)
  }
  reader.readAsDataURL(file)
  input.value = ''
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <div class="deck-select-container" ref="select">
      <div
        class="deck-select"
        :class="{ 'deck-select-open': deckSelectOpen }"
        @click="deckSelectOpen = !deckSelectOpen"
      >
        {{ currentDeck.name }}
        <IconArrow class="arrow-icon" :class="{ 'arrow-icon-rotated': deckSelectOpen }" />
      </div>
      <div v-if="deckSelectOpen" class="deck-select-options">
        <div
          v-for="deck in decks"
          :key="deck._id"
          @click="selectDeck(deck._id)"
          class="deck-select-option"
        >
          {{ deck.name }}
        </div>
      </div>
    </div>

    <div class="textarea-container">
      <textarea
        ref="textareaFront"
        placeholder="Передняя сторона"
        v-model.trim="newCardFront"
        @paste="handleImagePaste"
      ></textarea>
      <button type="button" class="attach-image-button" @click="handleFileClick('front')">
        <IconPaperclip class="attach-image-button-icon" />
      </button>
      <input
        ref="fileInputFront"
        type="file"
        accept="image/*"
        style="display: none"
        @change="(e) => handleFileSelect('front', e)"
      />
    </div>

    <div class="textarea-container">
      <textarea
        ref="textareaBack"
        placeholder="Задняя сторона"
        v-model.trim="newCardBack"
        @paste="handleImagePaste"
      ></textarea>
      <button type="button" class="attach-image-button" @click="handleFileClick('back')">
        <IconPaperclip class="attach-image-button-icon" />
      </button>
      <input
        ref="fileInputBack"
        type="file"
        accept="image/*"
        style="display: none"
        @change="(e) => handleFileSelect('back', e)"
      />
    </div>

    <button type="submit" :disabled="!newCardFront">Создать</button>
  </form>
</template>

<style scoped>
form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.arrow-icon {
  transition: transform 0.2s ease-in-out;
}

.arrow-icon-rotated {
  transform: rotate(180deg);
}

.deck-select-container {
  position: relative;
}

.deck-select {
  padding: 0.5rem;
  border: 0.01rem solid var(--color-foreground);
  border-radius: 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}

.deck-select-options {
  position: absolute;
  padding: 0.3rem;
  top: 2.5rem;
  width: 100%;
  left: 0;
  z-index: 10;
  background-color: var(--color-background);
  box-shadow: var(--modals-box-shadow);
  border: var(--modals-border);
  border-radius: 0.5rem;
  display: flex;
  flex-direction: column;
}

.deck-select-option {
  padding: 0.5rem;
  border-radius: 0.3rem;
}

.deck-select-option:hover {
  background-color: var(--color-foreground-secondary);
  cursor: pointer;
}

textarea,
button[type='submit'] {
  border-radius: 0.5rem;
}

textarea {
  height: 8rem;
  resize: none;
  width: 100%;
  padding: 0.5rem;
  border: 0.05rem solid var(--color-foreground);
  background-color: var(--color-background);
}

button[type='submit'] {
  padding-block: 0.7rem;
  background-color: var(--color-foreground);
  color: var(--color-background);
}

.textarea-container {
  position: relative;
}

.attach-image-button {
  position: absolute;
  background-color: transparent;
  height: 1.2rem;
  width: 1.2rem;
  top: 0.5rem;
  right: 0.4rem;
}

.attach-image-button-icon {
  color: var(--color-foreground);
  height: 100%;
  width: 100%;
}
</style>
