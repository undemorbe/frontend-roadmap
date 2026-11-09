<script setup>
import { computed, ref } from 'vue'
import Playground from './Playground.vue'
import { runChecks } from '../lib/runner.js'
import { renderInline } from '../lib/markdown.js'
import { progress, setTaskDone, isTaskDone } from '../lib/progress.js'

const props = defineProps({
  task: { type: Object, required: true },
  lessonId: { type: String, required: true },
  index: { type: Number, required: true },
})

const key = `${props.lessonId}:${props.index}`
const initial = () => JSON.parse(JSON.stringify(props.task.files))
const files = ref(progress.code[key] ? { ...initial(), ...progress.code[key] } : initial())
const pg = ref(null)
const results = ref(null)
const checking = ref(false)
const showHint = ref(false)
const showSolution = ref(false)
const done = computed(() => isTaskDone(props.lessonId, props.index))
const mode = props.task.mode || 'web'

function onFiles(v) {
  files.value = v
  progress.code[key] = v
}

async function check() {
  checking.value = true
  results.value = null
  await pg.value.run()
  const res = await runChecks(pg.value.iframe, files.value, props.task.checks || [])
  results.value = res
  const ok = res.every((r) => r.ok)
  if (ok) setTaskDone(props.lessonId, props.index, true)
  checking.value = false
}

function reset() {
  files.value = initial()
  delete progress.code[key]
  results.value = null
}

function applySolution() {
  if (!props.task.solution) return
  onFiles({ ...files.value, ...JSON.parse(JSON.stringify(props.task.solution)) })
}

const passed = computed(() => results.value && results.value.every((r) => r.ok))
const textHtml = computed(() => renderInline(props.task.text))
const hintHtml = computed(() => renderInline(props.task.hint))
</script>

<template>
  <div class="task-code">
    <div class="task-text prose" v-html="textHtml"></div>

    <Playground
      ref="pg"
      :files="files"
      :mode="mode"
      :height="task.height || '440px'"
      :show-preview="mode !== 'js' && mode !== 'config'"
      :show-console="mode !== 'config'"
      @update:files="onFiles"
    />

    <div class="task-actions">
      <button type="button" class="btn btn-primary" :disabled="checking" @click="check">
        {{ checking ? 'Проверяю…' : 'Проверить решение' }}
      </button>
      <button v-if="task.hint" type="button" class="btn" @click="showHint = !showHint">
        {{ showHint ? 'Скрыть подсказку' : 'Подсказка' }}
      </button>
      <button v-if="task.solution" type="button" class="btn" @click="showSolution = !showSolution">Решение</button>
      <button type="button" class="btn btn-ghost" @click="reset">Сбросить код</button>
      <span v-if="done" class="task-done-badge">✓ Засчитано</span>
    </div>

    <div v-if="showHint" class="task-hint prose" v-html="hintHtml"></div>

    <div v-if="showSolution" class="task-solution">
      <p>Подглядывать полезно, если вы уже попробовали сами. Решение заменит ваш код в редакторе.</p>
      <button type="button" class="btn" @click="applySolution">Вставить решение в редактор</button>
    </div>

    <div v-if="results" class="task-results" :class="{ ok: passed }" aria-live="polite">
      <div class="task-results-head">
        {{ passed ? 'Двери открываются — всё верно! Станция пройдена.' : 'Пока не всё. Посмотрите, что не прошло:' }}
      </div>
      <ul>
        <li v-for="(r, i) in results" :key="i" :class="r.ok ? 'r-ok' : 'r-fail'">
          <span class="mark" aria-hidden="true">{{ r.ok ? '✓' : '✕' }}</span>
          <span>
            {{ r.name }}
            <small v-if="!r.ok && r.msg">— {{ r.msg }}</small>
          </span>
        </li>
      </ul>
    </div>
  </div>
</template>
