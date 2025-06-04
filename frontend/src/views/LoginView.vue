<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useLoginStore } from '@/stores/login'
import { cloudDb } from '@/db/db'
import { useDecksStore } from '@/stores/decks'

const router = useRouter()

const mode = ref<'login' | 'signup'>('login')

const { isLoggedIn } = storeToRefs(useLoginStore())

const { decks } = storeToRefs(useDecksStore())

if (isLoggedIn.value) {
  router.push({ name: 'decks' })
}

const login = ref({
  username: '',
  password: '',
})

const loginError = ref(false)

const canLogin = computed(() => {
  return login.value.username.length >= 1 && login.value.password.length >= 8
})

const signup = ref({
  username: '',
  password: '',
  passwordAgain: '',
})

const signupError = ref(false)

const canSignup = computed(() => {
  return (
    signup.value.username.length >= 1 &&
    signup.value.password.length >= 8 &&
    signup.value.password === signup.value.passwordAgain
  )
})

watch([signup.value, login.value], () => {
  if (loginError.value) {
    loginError.value = false
  }

  if (signupError.value) {
    signupError.value = false
  }
})

async function handleLogin() {
  const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(login.value),
  })

  if (response.ok) {
    isLoggedIn.value = true
    const userCloudDecks = await cloudDb.getAllDecks()
    decks.value.push(...userCloudDecks)
    router.push({ name: 'decks' })
  } else {
    loginError.value = true
  }
}

async function handleSignup() {
  const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(signup.value),
  })

  if (response.ok) {
    isLoggedIn.value = true
    const userCloudDecks = await cloudDb.getAllDecks()
    decks.value.push(...userCloudDecks)
    router.push({ name: 'decks' })
  } else {
    signupError.value = true
  }
}
</script>

<template>
  <main>
    <div class="mode-switch">
      <button
        class="mode-switch-option"
        :class="{ 'mode-switch-option--active': mode === 'login' }"
        @click="mode = 'login'"
      >
        Вход
      </button>

      <button
        class="mode-switch-option"
        :class="{ 'mode-switch-option--active': mode === 'signup' }"
        @click="mode = 'signup'"
      >
        Регистрация
      </button>

      <div
        class="mode-switch-active-indicator"
        :class="{ 'mode-switch-active-indicator--right': mode === 'signup' }"
      ></div>
    </div>

    <form v-if="mode === 'login'" @submit.prevent="handleLogin">
      <input type="text" placeholder="Логин" v-model.trim="login.username" />
      <input type="password" placeholder="Пароль" v-model.trim="login.password" />
      <button :disabled="!canLogin">Войти</button>
      <div v-if="loginError" class="error">Неверный логин или пароль</div>
    </form>

    <form v-else-if="mode === 'signup'" @submit.prevent="handleSignup">
      <input type="text" placeholder="Логин" v-model.trim="signup.username" />
      <input type="password" placeholder="Пароль (8+ символов)" v-model.trim="signup.password" />
      <input type="password" placeholder="Пароль ещё раз" v-model.trim="signup.passwordAgain" />
      <button :disabled="!canSignup">Создать аккаунт</button>
      <div v-if="signupError" class="error">Логин занят</div>
    </form>
  </main>
</template>

<style scoped>
main {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.mode-switch {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  border: 0.05rem solid rgb(221, 221, 221);
  border-radius: 1rem;
}

.mode-switch-option {
  padding-block: 0.5rem;
  border-radius: 1rem;
  background-color: transparent;
  color: var(--color-foreground);
}
.mode-switch-option--active {
  color: var(--color-background);
  transition: color 0.1s ease-out;
}

.mode-switch-active-indicator {
  position: absolute;
  right: 50%;
  z-index: -1;
  width: 50%;
  height: 100%;
  border-radius: 1rem;
  background-color: var(--color-foreground);
  transition: right 0.1s ease-out;
}
.mode-switch-active-indicator--right {
  right: 0;
}

form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

input {
  width: 100%;
  padding: 0.5rem;
  border: 0.05rem solid var(--color-foreground);
  border-radius: 0.5rem;
  background-color: var(--color-background);
}

button {
  padding: 0.5rem;
  border-radius: 0.5rem;
  background-color: var(--color-foreground);
  color: var(--color-background);

  &:disabled {
    opacity: 70%;
    cursor: not-allowed;
  }
}

.error {
  color: rgb(255, 0, 0);
  text-align: center;
}
</style>
