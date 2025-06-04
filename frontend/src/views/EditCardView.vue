<script setup lang="ts">
import { ref, onBeforeMount, toRaw } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useDecksStore } from '@/stores/decks'
import { localDb, cloudDb } from '@/db/db'
import type { Card } from '@/../../common/types'
import IconPaperclip from '@/icons/IconPaperclip.vue'

const router = useRouter()
const route = useRoute()

const deckId = route.params.deckId as string
const cardId = route.params.cardId as string

const card = ref<Card | null>(null)
const { decks } = storeToRefs(useDecksStore())
const deckType = decks.value.find((d) => d._id === deckId)!.type

const textareaFront = ref<HTMLTextAreaElement | null>(null)
const textareaBack = ref<HTMLTextAreaElement | null>(null)
const fileInputFront = ref<HTMLInputElement | null>(null)
const fileInputBack = ref<HTMLInputElement | null>(null)

async function handleSubmit(): Promise<void> {
  if (!card.value) return

  const usedImageIds = new Set<string>()

  const frontImageMatches = card.value.front.match(/!\[.*?\]\((.*?)\)/g) || []
  frontImageMatches.forEach((match) => {
    const id = match.match(/!\[.*?\]\((.*?)\)/)![1]
    usedImageIds.add(id)
  })

  const backImageMatches = card.value.back.match(/!\[.*?\]\((.*?)\)/g) || []
  backImageMatches.forEach((match) => {
    const id = match.match(/!\[.*?\]\((.*?)\)/)![1]
    usedImageIds.add(id)
  })

  const updatedImages: Record<string, string> = {}
  for (const [id, dataUrl] of Object.entries(card.value.images)) {
    if (usedImageIds.has(id)) {
      updatedImages[id] = dataUrl
    }
  }

  card.value.images = updatedImages

  if (deckType === 'local') {
    await localDb.updateCard(toRaw(card.value))
  } else if (deckType === 'cloud') {
    await cloudDb.updateCard(toRaw(card.value))
  }

  router.back()
}

function insertImageAtCursor(textarea: HTMLTextAreaElement, id: string) {
  const markup = `![image](${id})`
  const start = textarea.selectionStart
  textarea.setRangeText(markup, start, textarea.selectionEnd, 'end')
  textarea.dispatchEvent(new Event('input'))
}

function handleImagePaste(event: ClipboardEvent): void {
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
      if (!card.value) return
      card.value.images[id] = reader.result as string
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
  if (!file || !card.value) return
  const id = crypto.randomUUID()
  const reader = new FileReader()
  reader.onload = () => {
    card.value!.images[id] = reader.result as string
    const ta = side === 'front' ? textareaFront.value : textareaBack.value
    if (ta) insertImageAtCursor(ta, id)
  }
  reader.readAsDataURL(file)
  input.value = ''
}

onBeforeMount(async () => {
  if (deckType === 'local') {
    card.value = await localDb.getCard(cardId)
  } else if (deckType === 'cloud') {
    card.value = await cloudDb.getCard(cardId)
  }
})
</script>

<template>
  <main>
    <h1>Редактирование</h1>

    <form v-if="card" @submit.prevent="handleSubmit">
      <div class="textarea-container">
        <textarea
          ref="textareaFront"
          placeholder="Передняя сторона"
          v-model="card.front"
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
          v-model="card.back"
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

      <button type="submit">Готово</button>
    </form>
  </main>
</template>

<style scoped>
.main {
  display: flex;
  flex-direction: column;
}
textarea {
  height: 8rem;
  resize: none;
  padding: 0.5rem;
  border-radius: 0.5rem;
  border: 0.05rem solid var(--color-foreground);
  background-color: var(--color-background);
  width: 100%;
}
.button,
.attach-image-button {
  position: absolute;
  background-color: transparent;
  height: 1.2rem;
  width: 1.2rem;
  top: 0.5rem;
  right: 0.4rem;
}
.textarea-container {
  position: relative;
}
.attach-image-button-icon {
  color: var(--color-foreground);
  height: 100%;
  width: 100%;
}
h1 {
  padding-block: 1.2rem 0.3rem;
  font-size: 1.3rem;
  text-align: center;
}
form {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
button[type='submit'] {
  padding-block: 0.7rem;
  border-radius: 0.5rem;
  background-color: var(--color-foreground);
  color: var(--color-background);
}
</style>
