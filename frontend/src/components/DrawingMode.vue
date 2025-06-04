<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import IconUndo from '@/icons/IconUndo.vue'
import IconRedo from '@/icons/IconRedo.vue'
import { storeToRefs } from 'pinia'
import { useSettingsStore } from '@/stores/settings'

type Point = { x: number; y: number }

type Stroke = {
  width: number
  points: Point[]
}

const { settings } = storeToRefs(useSettingsStore())

const canvasRef = ref<HTMLCanvasElement | null>(null)
const strokes = ref<Stroke[]>([])
const redoStack = ref<Stroke[]>([])
let drawing = false
let currentStroke: Stroke | null = null

const canUndo = computed(() => strokes.value.length > 0)
const canRedo = computed(() => redoStack.value.length > 0)

const foregroundColor = getComputedStyle(document.documentElement).getPropertyValue(
  '--color-foreground',
)

const undo = () => {
  if (!canUndo.value) return
  redoStack.value.push(strokes.value.pop()!)
  redrawAll()
}
const redo = () => {
  if (!canRedo.value) return
  strokes.value.push(redoStack.value.pop()!)
  redrawAll()
}

const getPos = (e: MouseEvent) => {
  const canvas = canvasRef.value!
  const rect = canvas.getBoundingClientRect()
  return { x: e.clientX - rect.left, y: e.clientY - rect.top }
}

const redrawAll = () => {
  const canvas = canvasRef.value!
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  strokes.value.forEach((stroke) => {
    ctx.beginPath()
    ctx.lineWidth = stroke.width
    ctx.strokeStyle = foregroundColor
    stroke.points.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y)
      else ctx.lineTo(p.x, p.y)
    })
    ctx.stroke()
  })
}

onMounted(() => {
  const canvas = canvasRef.value!
  const ctx = canvas.getContext('2d')!

  const setupCanvas = () => {
    const rect = canvas.getBoundingClientRect()
    const ratio = window.devicePixelRatio || 1
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    canvas.width = rect.width * ratio
    canvas.height = rect.height * ratio
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    redrawAll()
  }
  window.addEventListener('resize', setupCanvas)
  setupCanvas()

  const startDrawing = (e: MouseEvent) => {
    e.preventDefault()
    drawing = true
    redoStack.value = []
    const pos = getPos(e)
    currentStroke = { width: settings.value.brushWidth, points: [pos] }
    strokes.value.push(currentStroke)
    ctx.beginPath()
    ctx.arc(pos.x, pos.y, currentStroke.width / 2, 0, Math.PI * 2)
    ctx.fillStyle = foregroundColor
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
  }

  const draw = (e: MouseEvent) => {
    e.preventDefault()
    if (!drawing || !currentStroke) return
    const pos = getPos(e)
    currentStroke.points.push(pos)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = foregroundColor
    ctx.lineWidth = currentStroke.width
    ctx.stroke()
  }

  const stopDrawing = (e: MouseEvent) => {
    e.preventDefault()
    drawing = false
    currentStroke = null
  }

  canvas.addEventListener('pointerdown', startDrawing)
  canvas.addEventListener('pointermove', draw)
  canvas.addEventListener('pointerup', stopDrawing)
  canvas.addEventListener('pointerleave', stopDrawing)

  onBeforeUnmount(() => {
    window.removeEventListener('resize', setupCanvas)
    canvas.removeEventListener('pointerdown', startDrawing)
    canvas.removeEventListener('pointermove', draw)
    canvas.removeEventListener('pointerup', stopDrawing)
    canvas.removeEventListener('pointerleave', stopDrawing)
  })
})
</script>

<template>
  <div class="drawing-wrapper">
    <div class="control-panel">
      <button @click="undo" @dblclick.prevent :disabled="!canUndo" class="control-button">
        <IconUndo class="control-button-icon" />
      </button>
      <button @click="redo" @dblclick.prevent :disabled="!canRedo" class="control-button">
        <IconRedo class="control-button-icon" />
      </button>
      <label class="brush-size">
        Толщина:
        <input type="range" min="1" max="20" v-model="settings.brushWidth" />
        <span>{{ settings.brushWidth }}</span>
      </label>
    </div>
    <canvas ref="canvasRef" class="draw-canvas"></canvas>
  </div>
</template>

<style scoped>
.drawing-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.control-panel {
  position: absolute;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 1rem;
  background-color: var(--color-background);
  color: var(--color-foreground);
  padding: 6px 12px;
  border-radius: 0.5rem;
  box-shadow: var(--modals-box-shadow);
  border: var(--modals-border);
}

.control-button {
  height: 1.5rem;
  width: 1.5rem;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.control-button-icon {
  height: 100%;
  width: 100%;
}

.brush-size {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

input[type='range'] {
  width: 8rem;
}

.draw-canvas {
  width: 100%;
  height: 100%;
  background: var(--color-canvas);
  cursor: crosshair;
  display: block;
  touch-action: none;
}
</style>
