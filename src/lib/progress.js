import { reactive, watch } from 'vue'

const KEY = 'frontend-metro:v1'

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return {}
}

const saved = load()

export const progress = reactive({
  visited: saved.visited || {}, // { h1: true }
  tasks: saved.tasks || {}, // { 'h1:0': true }
  totals: saved.totals || {}, // { h1: 3 } — сколько задач в уроке (узнаём при открытии)
  code: saved.code || {}, // { 'h1:0': { 'index.html': '...' } }
})

let timer
watch(
  progress,
  () => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      try {
        localStorage.setItem(KEY, JSON.stringify(progress))
      } catch {}
    }, 250)
  },
  { deep: true },
)

export function markVisited(id, total) {
  progress.visited[id] = true
  progress.totals[id] = total
}

export function setTaskDone(id, index, done = true) {
  progress.tasks[`${id}:${index}`] = done
}

export function isTaskDone(id, index) {
  return !!progress.tasks[`${id}:${index}`]
}

export function stationState(id) {
  const total = progress.totals[id]
  if (total === undefined) return progress.visited[id] ? 'visited' : 'new'
  let done = 0
  for (let i = 0; i < total; i++) if (progress.tasks[`${id}:${i}`]) done++
  if (total > 0 && done === total) return 'done'
  if (done > 0 || progress.visited[id]) return 'visited'
  return 'new'
}

export function stationDone(id) {
  const total = progress.totals[id] || 0
  let done = 0
  for (let i = 0; i < total; i++) if (progress.tasks[`${id}:${i}`]) done++
  return { done, total }
}

export function resetProgress() {
  progress.visited = {}
  progress.tasks = {}
  progress.code = {}
}
