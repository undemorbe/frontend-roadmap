<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { lines, transfers, byId } from '../data/lines.js'
import { stationState } from '../lib/progress.js'

const router = useRouter()

const W = 1440
const X0 = 120
const X1 = 1270
const Y0 = 210
const STEP_Y = 236

const transferIds = new Set(transfers.flat().filter((x) => byId[x]))

const rows = computed(() =>
  lines.map((line, r) => {
    const y = Y0 + r * STEP_Y
    const n = line.stations.length
    const ltr = r % 2 === 0
    const step = (X1 - X0) / (n - 1)
    const stations = line.stations.map((s, i) => {
      const x = ltr ? X0 + i * step : X1 - i * step
      return { ...s, x, y, state: stationState(s.id), transfer: transferIds.has(s.id) }
    })
    return { line, y, ltr, stations, startX: ltr ? X0 : X1, endX: ltr ? X1 : X0 }
  }),
)

const H = computed(() => Y0 + (lines.length - 1) * STEP_Y + 110)

// следующая непройденная станция — «Вы здесь»
const here = computed(() => {
  for (const row of rows.value) for (const s of row.stations) if (s.state !== 'done') return s
  return null
})

const corridors = computed(() =>
  rows.value.slice(0, -1).map((row, i) => {
    const next = rows.value[i + 1]
    return { x: row.endX, y1: row.y, y2: next.y, from: row.line, to: next.line }
  }),
)

function go(id) {
  router.push({ name: 'station', params: { id } })
}

function transferNote(id) {
  const t = transfers.filter(([a, b]) => a === id || b === id).map(([a, b]) => byId[a === id ? b : a].title)
  return t.length ? ` · пересадка: ${t.join(', ')}` : ''
}

let order = 0
const delay = () => `${(order++ % 80) * 18}ms`
</script>

<template>
  <div class="map-scroll">
    <svg
      class="metro-map"
      :viewBox="`0 0 ${W} ${H}`"
      role="img"
      aria-label="Схема линий: HTML, CSS, JavaScript, Инструменты и Vue"
    >
      <defs>
        <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" class="grid-dot" />
        </pattern>
      </defs>
      <rect :width="W" :height="H" fill="url(#grid)" />

      <!-- переходы между линиями -->
      <g v-for="(c, i) in corridors" :key="'c' + i" class="corridor">
        <line :x1="c.x" :y1="c.y1 + 18" :x2="c.x" :y2="c.y2 - 18" class="corridor-line" />
        <g :transform="`translate(${c.x + (c.x > W / 2 ? 18 : -18)} ${(c.y1 + c.y2) / 2})`">
          <text :text-anchor="c.x > W / 2 ? 'start' : 'end'" class="corridor-label" dy="-4">переход</text>
          <text :text-anchor="c.x > W / 2 ? 'start' : 'end'" class="corridor-sub" dy="14">
            {{ c.from.name }} → {{ c.to.name }}
          </text>
        </g>
      </g>

      <g v-for="(row, r) in rows" :key="row.line.id" class="row" :style="{ '--c': row.line.color, '--ci': row.line.ink }">
        <!-- линия -->
        <line
          class="track"
          :x1="row.startX"
          :y1="row.y"
          :x2="row.endX"
          :y2="row.y"
          :style="{ animationDelay: r * 160 + 'ms' }"
        />
        <!-- подпись линии у её начала -->
        <g :transform="`translate(${row.startX} ${row.y + 46})`" class="line-sign">
          <circle r="17" :cx="row.ltr ? 0 : 0" class="line-badge" />
          <text class="line-num" text-anchor="middle" dy="6">{{ row.line.num }}</text>
          <text class="line-name" :x="row.ltr ? 28 : -28" dy="1" :text-anchor="row.ltr ? 'start' : 'end'">{{ row.line.name }}</text>
          <text class="line-title" :x="row.ltr ? 28 : -28" dy="19" :text-anchor="row.ltr ? 'start' : 'end'">{{ row.line.title }}</text>
        </g>

        <!-- станции -->
        <a
          v-for="s in row.stations"
          :key="s.id"
          class="station"
          :class="['st-' + s.state, { project: s.project, transfer: s.transfer, here: here && here.id === s.id }]"
          :href="`#/s/${s.id}`"
          :style="{ animationDelay: delay() }"
          @click.prevent="go(s.id)"
        >
          <title>{{ row.line.name }}: {{ s.title }}{{ transferNote(s.id) }}</title>
          <g :transform="`translate(${s.x} ${s.y})`">
            <circle v-if="s.transfer" r="17" class="transfer-ring" />
            <circle :r="s.project ? 14 : 10" class="dot" />
            <circle v-if="s.project" r="7" class="dot-inner" />
            <path v-if="s.state === 'done'" d="M-5 0 L-1.5 4 L5.5 -4" class="check" />
            <circle v-else-if="s.state === 'visited' && !s.project" r="3.6" class="visited-dot" />
            <g v-if="here && here.id === s.id" class="pin">
              <circle r="24" class="pulse" />
            </g>
            <text class="st-label" transform="translate(10 -20) rotate(-36)">{{ s.title }}</text>
          </g>
        </a>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.map-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  margin: 0 calc(var(--gutter) * -1);
  padding: 0 var(--gutter);
}
.metro-map {
  display: block;
  width: 100%;
  min-width: 980px;
  height: auto;
}
.grid-dot {
  fill: var(--line);
}
.track {
  stroke: var(--c);
  stroke-width: 11;
  stroke-linecap: round;
  stroke-dasharray: 1400;
  stroke-dashoffset: 1400;
  animation: draw 1.1s cubic-bezier(0.6, 0, 0.2, 1) forwards;
}
@keyframes draw {
  to {
    stroke-dashoffset: 0;
  }
}
.corridor-line {
  stroke: var(--ink);
  stroke-width: 3;
  stroke-dasharray: 2 7;
  stroke-linecap: round;
}
.corridor-label {
  font: 700 13px var(--font-display);
  fill: var(--ink);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.corridor-sub {
  font: 500 12px var(--font-body);
  fill: var(--ink-soft);
}
.line-badge {
  fill: var(--c);
}
.line-num {
  font: 700 17px var(--font-display);
  fill: var(--ci);
}
.line-name {
  font: 700 17px var(--font-display);
  fill: var(--ink);
}
.line-title {
  font: 500 13px var(--font-body);
  fill: var(--ink-soft);
}
.station {
  cursor: pointer;
  opacity: 0;
  animation: pop 0.45s ease-out forwards;
  outline: none;
}
@keyframes pop {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
.dot {
  fill: var(--paper);
  stroke: var(--c);
  stroke-width: 5;
  transition: r 0.15s;
}
.project .dot {
  stroke: var(--ink);
  stroke-width: 4;
}
.dot-inner {
  fill: var(--c);
}
.transfer-ring {
  fill: var(--paper);
  stroke: var(--ink);
  stroke-width: 3;
}
.st-done .dot {
  fill: var(--c);
}
.st-done.project .dot-inner {
  fill: var(--paper);
  opacity: 0.4;
}
.check {
  fill: none;
  stroke: var(--ci);
  stroke-width: 2.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.st-done.project .check {
  stroke: var(--ink);
}
.visited-dot {
  fill: var(--c);
}
.st-label {
  font: 600 15px var(--font-body);
  fill: var(--ink);
  paint-order: stroke;
  stroke: var(--paper);
  stroke-width: 5px;
  stroke-linejoin: round;
  transition: fill 0.15s;
}
.project .st-label {
  font-weight: 800;
}
.st-new .st-label {
  fill: var(--ink-soft);
}
.station:hover .st-label,
.station:focus-visible .st-label {
  fill: var(--c);
  filter: brightness(0.85);
}
.station:hover .dot,
.station:focus-visible .dot {
  stroke-width: 7;
}
.station:focus-visible .dot {
  stroke: var(--ink);
}
.pulse {
  fill: none;
  stroke: var(--ink);
  stroke-width: 2;
  animation: pulse 1.8s ease-out infinite;
  transform-origin: center;
  transform-box: fill-box;
}
@keyframes pulse {
  from {
    opacity: 0.9;
    transform: scale(0.6);
  }
  to {
    opacity: 0;
    transform: scale(1.5);
  }
}
@media (prefers-reduced-motion: reduce) {
  .track,
  .station {
    animation: none;
    opacity: 1;
    stroke-dashoffset: 0;
  }
  .pulse {
    animation: none;
    opacity: 0.6;
  }
}
</style>
