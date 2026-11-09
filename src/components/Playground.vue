<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import CodeEditor from './CodeEditor.vue'
import { nextFrameId, prepare, loadInto } from '../lib/runner.js'

const props = defineProps({
  files: { type: Object, required: true }, // v-model:files
  mode: { type: String, default: 'web' }, // web | js | vue | sfc
  height: { type: String, default: '420px' },
  autorun: { type: Boolean, default: true },
  showPreview: { type: Boolean, default: true },
  showConsole: { type: Boolean, default: true },
})
const emit = defineEmits(['update:files', 'ran'])

const frameId = nextFrameId()
const iframe = ref(null)
const names = computed(() => Object.keys(props.files))
const active = ref(names.value[0])
const logs = ref([])
const running = ref(false)
const consoleOpen = ref(props.mode === 'js')
const errorsCount = computed(() => logs.value.filter((l) => l.type === 'error').length)

watch(names, (n) => {
  if (!n.includes(active.value)) active.value = n[0]
})

function update(name, value) {
  emit('update:files', { ...props.files, [name]: value })
}

function onMessage(e) {
  const d = e.data
  if (!d || d.__fr !== frameId) return
  logs.value.push({ type: d.type, text: d.text })
  if (d.type === 'error') consoleOpen.value = true
}

let timer
async function run() {
  if (!iframe.value) return
  running.value = true
  logs.value = []
  const doc = await prepare(props.files, props.mode, frameId)
  await loadInto(iframe.value, doc, props.mode)
  running.value = false
  emit('ran', iframe.value)
}

watch(
  () => props.files,
  () => {
    if (!props.autorun) return
    clearTimeout(timer)
    timer = setTimeout(run, 600)
  },
  { deep: true },
)

onMounted(() => {
  window.addEventListener('message', onMessage)
  run()
})
onBeforeUnmount(() => {
  window.removeEventListener('message', onMessage)
  clearTimeout(timer)
})

defineExpose({ run, iframe, logs })

const fileIcon = (n) => {
  const e = n.split('.').pop()
  return { html: '◧', css: '◩', js: '◆', vue: '▲' }[e] || '·'
}
</script>

<template>
  <div class="pg" :class="['pg-' + mode, { 'pg-no-preview': !showPreview, 'pg-text': !showPreview && !showConsole }]" :style="{ '--pg-h': height }">
    <div class="pg-editor">
      <div class="pg-tabs" role="tablist">
        <button
          v-for="n in names"
          :key="n"
          type="button"
          role="tab"
          class="pg-tab"
          :class="{ on: n === active }"
          :aria-selected="n === active"
          @click="active = n"
        >
          <span class="pg-ico" aria-hidden="true">{{ fileIcon(n) }}</span>{{ n }}
        </button>
        <span class="pg-spacer"></span>
        <button v-if="showConsole || showPreview" type="button" class="pg-run" :disabled="running" title="Ctrl/⌘ + Enter" @click="run">
          {{ running ? 'Запуск…' : '▶ Запустить' }}
        </button>
      </div>
      <div class="pg-code">
        <CodeEditor
          v-for="n in names"
          v-show="n === active"
          :key="n"
          :filename="n"
          :model-value="files[n]"
          @update:model-value="(v) => update(n, v)"
          @run="run"
        />
      </div>
    </div>
    <div class="pg-out">
      <div v-show="showPreview" class="pg-preview">
        <div class="pg-bar">
          <span class="pg-dots" aria-hidden="true"><i></i><i></i><i></i></span>
          <span>Результат</span>
        </div>
        <div class="pg-frame-wrap">
          <iframe
            ref="iframe"
            title="Результат выполнения кода"
            sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
          ></iframe>
        </div>
      </div>
      <div v-if="showConsole" class="pg-console" :class="{ open: consoleOpen || !showPreview }">
        <button type="button" class="pg-console-head" @click="consoleOpen = !consoleOpen">
          <span>Консоль</span>
          <span v-if="logs.length" class="pg-count" :class="{ err: errorsCount }">{{ logs.length }}</span>
          <span class="pg-spacer"></span>
          <span v-if="showPreview" aria-hidden="true">{{ consoleOpen ? '▾' : '▸' }}</span>
        </button>
        <div v-show="consoleOpen || !showPreview" class="pg-logs">
          <div v-if="!logs.length" class="pg-empty">Здесь появится вывод <code>console.log()</code></div>
          <div v-for="(l, i) in logs" :key="i" class="pg-log" :class="'t-' + l.type">
            <span class="pg-log-mark">{{ l.type === 'error' ? '✕' : l.type === 'warn' ? '!' : l.type === 'info' ? 'i' : '›' }}</span>
            <pre>{{ l.text }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pg {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
  height: var(--pg-h);
  border: 2px solid var(--ink);
  border-radius: 14px;
  overflow: hidden;
  background: var(--paper);
}
.pg-editor {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  border-right: 2px solid var(--ink);
}
.pg-tabs {
  display: flex;
  align-items: stretch;
  gap: 2px;
  background: var(--editor-gutter);
  border-bottom: 1px solid var(--line);
  overflow-x: auto;
  scrollbar-width: none;
}
.pg-tab {
  font: 500 13px/1 var(--font-mono);
  padding: 11px 14px;
  border: 0;
  background: transparent;
  color: var(--ink-soft);
  cursor: pointer;
  white-space: nowrap;
  border-bottom: 3px solid transparent;
}
.pg-tab.on {
  color: var(--ink);
  background: var(--editor-bg);
  border-bottom-color: var(--accent);
}
.pg-ico {
  margin-right: 6px;
  opacity: 0.6;
}
.pg-spacer {
  flex: 1;
}
.pg-run {
  margin: 5px;
  padding: 0 14px;
  border: 0;
  border-radius: 8px;
  background: var(--ink);
  color: var(--paper);
  font: 600 13px/1 var(--font-body);
  cursor: pointer;
  white-space: nowrap;
}
.pg-run:hover {
  background: var(--accent);
  color: var(--accent-ink);
}
.pg-code {
  flex: 1;
  min-height: 0;
  background: var(--editor-bg);
}
.pg-out {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}
.pg-preview {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.pg-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 12px;
  height: 38px;
  font: 600 12px/1 var(--font-body);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink-soft);
  border-bottom: 1px solid var(--line);
  background: var(--paper-2);
}
.pg-dots {
  display: inline-flex;
  gap: 4px;
}
.pg-dots i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--line);
}
.pg-frame-wrap {
  flex: 1;
  min-height: 0;
  background: #fff;
  overflow: auto;
}
iframe {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
  background: #fff;
}
.pg-console {
  border-top: 2px solid var(--ink);
  background: var(--console-bg);
  color: var(--console-ink);
  display: flex;
  flex-direction: column;
  max-height: 45%;
}
.pg-no-preview .pg-console {
  max-height: none;
  flex: 1;
  border-top: 0;
}
.pg-console-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  border: 0;
  background: transparent;
  color: inherit;
  font: 600 12px/1 var(--font-body);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  text-align: left;
}
.pg-count {
  min-width: 20px;
  padding: 3px 6px;
  border-radius: 10px;
  background: #ffffff22;
  font-size: 11px;
  text-align: center;
}
.pg-count.err {
  background: var(--danger);
  color: #fff;
}
.pg-logs {
  overflow: auto;
  padding: 0 0 8px;
  min-height: 60px;
}
.pg-empty {
  padding: 4px 12px 8px;
  opacity: 0.55;
  font-size: 13px;
}
.pg-empty code {
  font-family: var(--font-mono);
}
.pg-log {
  display: flex;
  gap: 8px;
  padding: 4px 12px;
  border-top: 1px solid #ffffff12;
}
.pg-log pre {
  margin: 0;
  font: 13px/1.5 var(--font-mono);
  white-space: pre-wrap;
  word-break: break-word;
}
.pg-log-mark {
  font: 600 12px/1.6 var(--font-mono);
  opacity: 0.6;
  width: 10px;
  flex: none;
}
.pg-text {
  grid-template-columns: 1fr;
}
.pg-text .pg-editor {
  border-right: 0;
}
.pg-text .pg-out {
  display: none;
}
.t-error {
  color: #ff8b80;
  background: #ff4b3a1a;
}
.t-warn {
  color: #ffd36b;
}
.t-info {
  color: #9fc4ff;
}
@media (max-width: 860px) {
  .pg {
    grid-template-columns: 1fr;
    grid-template-rows: minmax(260px, 1fr) minmax(240px, 1fr);
    height: auto;
    min-height: calc(var(--pg-h) * 1.5);
  }
  .pg-editor {
    border-right: 0;
    border-bottom: 2px solid var(--ink);
    min-height: 260px;
  }
}
</style>
