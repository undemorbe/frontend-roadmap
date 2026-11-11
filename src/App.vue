<script setup>
import { computed, ref, watchEffect } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { stations } from './data/lines.js'
import { stationState } from './lib/progress.js'
import SearchPalette from './components/SearchPalette.vue'

const doneCount = computed(() => stations.filter((s) => stationState(s.id) === 'done').length)
const pct = computed(() => Math.round((doneCount.value / stations.length) * 100))

const THEME_KEY = 'frontend-metro:theme'
let initial = 'auto'
try {
  initial = localStorage.getItem(THEME_KEY) || 'auto'
} catch {}
const theme = ref(initial)
watchEffect(() => {
  const root = document.documentElement
  if (theme.value === 'auto') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', theme.value)
  try {
    localStorage.setItem(THEME_KEY, theme.value)
  } catch {}
})
const themeLabel = computed(() => ({ auto: 'Тема: как в системе', light: 'Тема: светлая', dark: 'Тема: тёмная' })[theme.value])
function cycleTheme() {
  theme.value = { auto: 'light', light: 'dark', dark: 'auto' }[theme.value]
}
</script>

<template>
  <a class="skip" href="#main" @click.prevent="$refs.main?.focus()">К содержимому</a>
  <header class="site-head">
    <div class="wrap head-inner">
      <RouterLink to="/" class="logo" aria-label="Фронтенд-метро — на главную">
        <svg viewBox="0 0 40 40" width="34" height="34" aria-hidden="true">
          <circle cx="20" cy="20" r="18" fill="var(--ink)" />
          <path d="M9 28 L14 12 L20 22 L26 12 L31 28" fill="none" stroke="var(--paper)" stroke-width="3.6" stroke-linejoin="round" stroke-linecap="round" />
        </svg>
        <span class="logo-text">Фронтенд<span class="logo-dot">·</span>метро</span>
      </RouterLink>
      <nav class="head-nav" aria-label="Основная навигация">
        <RouterLink to="/" class="nav-link">Схема</RouterLink>
        <RouterLink to="/depot" class="nav-link">Депо <span class="nav-sub">песочница</span></RouterLink>
      </nav>
      <SearchPalette />
      <div class="head-progress" :title="`Пройдено станций: ${doneCount} из ${stations.length}`">
        <span class="hp-num">{{ doneCount }}<small>/{{ stations.length }}</small></span>
        <span class="hp-bar"><i :style="{ width: pct + '%' }"></i></span>
      </div>
      <button type="button" class="theme-btn" :title="themeLabel" :aria-label="themeLabel" @click="cycleTheme">
        <svg v-if="theme === 'auto'" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/></svg>
        <svg v-else-if="theme === 'light'" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="12" cy="12" r="4.5" fill="currentColor"/><g stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></g></svg>
        <svg v-else viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" fill="currentColor"/></svg>
      </button>
    </div>
  </header>
  <main id="main" ref="main" tabindex="-1">
    <RouterView v-slot="{ Component, route }">
      <component :is="Component" :key="route.params.id || route.name" />
    </RouterView>
  </main>
  <footer class="site-foot">
    <div class="wrap foot-inner">
      <p>
        Фронтенд-метро — открытый учебник-схема. Материал собран по мотивам
        <a href="https://learn.javascript.ru" target="_blank" rel="noopener">learn.javascript.ru</a>,
        <a href="https://htmlacademy.ru" target="_blank" rel="noopener">HTML Academy</a>,
        <a href="https://www.cssacademy.com" target="_blank" rel="noopener">CSS Academy</a>,
        <a href="https://developer.mozilla.org/ru/" target="_blank" rel="noopener">MDN</a>,
        <a href="https://doka.guide" target="_blank" rel="noopener">Доки</a>,
        <a href="https://vuejs.org" target="_blank" rel="noopener">vuejs.org</a> и
        <a href="https://vite.dev" target="_blank" rel="noopener">vite.dev</a>.
      </p>
      <p class="foot-note">Прогресс и ваш код хранятся только в этом браузере.</p>
    </div>
  </footer>
</template>
