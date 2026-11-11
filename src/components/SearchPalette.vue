<script setup>
// Поиск по учебнику: станции, разделы уроков и текст теории. Открывается по «/» или Ctrl/⌘+K.
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { stations, lineById } from '../data/lines.js'
import { slugify } from '../lib/markdown.js'

const router = useRouter()
const open = ref(false)
const query = ref('')
const active = ref(0)
const input = ref(null)
const index = ref(null)
const sources = import.meta.glob('../content/*.md', { query: '?raw', import: 'default' })

const plain = (s) =>
  s
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/<[^>]+>/g, '')

async function buildIndex() {
  if (index.value) return
  const items = []
  await Promise.all(
    stations.map(async (s) => {
      const loader = sources[`../content/${s.id}.md`]
      const raw = loader ? await loader() : ''
      const text = raw.replace(/```[\s\S]*?```/g, ' ')
      // разделы: заголовок ## и текст до следующего заголовка
      const parts = text.split(/^## /m)
      items.push({ station: s, section: null, title: s.title, body: plain(parts[0]) })
      for (const p of parts.slice(1)) {
        const nl = p.indexOf('\n')
        const heading = p.slice(0, nl).trim()
        if (heading === 'Источники') continue
        items.push({ station: s, section: slugify(heading), title: plain(heading), body: plain(p.slice(nl + 1)) })
      }
    }),
  )
  index.value = items
}

const norm = (s) => s.toLowerCase().replace(/ё/g, 'е')

const results = computed(() => {
  const q = norm(query.value.trim())
  if (!q) return stations.slice(0, 8).map((s) => ({ station: s, section: null, title: s.title, snippet: '' }))
  if (!index.value) return []
  const words = q.split(/\s+/)
  const scored = []
  for (const it of index.value) {
    const title = norm(it.title)
    const stTitle = norm(it.station.title)
    const body = norm(it.body)
    let score = 0
    for (const w of words) {
      if (title.includes(w)) score += it.section ? 6 : 10
      else if (stTitle.includes(w)) score += 3
      else if (body.includes(w)) score += 1
      else {
        score = 0
        break
      }
    }
    if (!score) continue
    let snippet = ''
    const pos = body.indexOf(words[0])
    if (pos >= 0 && !title.includes(words[0])) {
      const from = Math.max(0, pos - 40)
      snippet = (from ? '…' : '') + it.body.slice(from, pos + 80).replace(/\s+/g, ' ').trim() + '…'
    }
    scored.push({ ...it, score, snippet })
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, 12)
})

watch(query, () => (active.value = 0))

async function show() {
  open.value = true
  query.value = ''
  await nextTick()
  input.value?.focus()
  buildIndex()
}
function hide() {
  open.value = false
}
function go(r) {
  if (!r) return
  hide()
  router.push({ name: 'station', params: { id: r.station.id }, query: r.section ? { s: r.section } : {} })
}
function onKey(e) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    active.value = (active.value + 1) % Math.max(results.value.length, 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    active.value = (active.value - 1 + results.value.length) % Math.max(results.value.length, 1)
  } else if (e.key === 'Enter') {
    e.preventDefault()
    go(results.value[active.value])
  } else if (e.key === 'Escape') {
    hide()
  }
}
function onGlobalKey(e) {
  const t = e.target
  const typing = t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.closest?.('.cm-editor'))
  if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
    e.preventDefault()
    open.value ? hide() : show()
  } else if (e.key === '/' && !typing && !open.value) {
    e.preventDefault()
    show()
  }
}
onMounted(() => window.addEventListener('keydown', onGlobalKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onGlobalKey))

defineExpose({ show })
</script>

<template>
  <button type="button" class="search-btn" aria-label="Поиск по учебнику" title="Поиск (/ или Ctrl+K)" @click="show">
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2.2" /><path d="M15.5 15.5 21 21" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" /></svg>
    <span class="search-btn-text">Поиск</span>
    <kbd class="search-btn-kbd">/</kbd>
  </button>

  <Teleport to="body">
    <div v-if="open" class="search-overlay" @mousedown.self="hide">
      <div class="search-box" role="dialog" aria-modal="true" aria-label="Поиск по учебнику">
        <div class="search-field">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2.2" /><path d="M15.5 15.5 21 21" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" /></svg>
          <input
            ref="input"
            v-model="query"
            type="search"
            placeholder="Станция, тема или термин: flex, v-model, git…"
            aria-label="Что ищем"
            aria-controls="search-results"
            :aria-activedescendant="results.length ? 'sr-' + active : undefined"
            autocomplete="off"
            spellcheck="false"
            @keydown="onKey"
          />
          <kbd>Esc</kbd>
        </div>
        <ul id="search-results" class="search-results" role="listbox">
          <li
            v-for="(r, i) in results"
            :id="'sr-' + i"
            :key="r.station.id + (r.section || '')"
            role="option"
            :aria-selected="i === active"
            :class="{ on: i === active }"
            :style="{ '--c': lineById[r.station.line].color, '--ci': lineById[r.station.line].ink }"
            @mousemove="active = i"
            @click="go(r)"
          >
            <span class="badge badge-sm">{{ lineById[r.station.line].num }}</span>
            <span class="sr-text">
              <span class="sr-title">
                {{ r.title }}
                <small v-if="r.section">· {{ r.station.title }}</small>
              </span>
              <span v-if="r.snippet" class="sr-snippet">{{ r.snippet }}</span>
            </span>
          </li>
          <li v-if="query.trim() && index && !results.length" class="sr-empty">Ничего не нашлось. Попробуйте другое слово.</li>
          <li v-if="query.trim() && !index" class="sr-empty">Загружаю уроки…</li>
        </ul>
        <p class="search-help"><kbd>↑</kbd><kbd>↓</kbd> выбор · <kbd>Enter</kbd> перейти · <kbd>Esc</kbd> закрыть</p>
      </div>
    </div>
  </Teleport>
</template>
