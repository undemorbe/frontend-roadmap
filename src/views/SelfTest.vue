<script setup>
// Служебная страница: прогоняет эталонные решения всех задач через их проверки.
// Открыть: #/selftest  (или #/selftest?only=h1,h2)
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { stations } from '../data/lines.js'
import { parseLesson } from '../lib/markdown.js'
import { nextFrameId, prepare, loadInto, runChecks } from '../lib/runner.js'

const route = useRoute()
const rows = ref([])
const running = ref(true)
const frame = ref(null)
const sources = import.meta.glob('../content/*.md', { query: '?raw', import: 'default' })

onMounted(async () => {
  const only = route.query.only ? String(route.query.only).split(',') : null
  for (const s of stations) {
    if (only && !only.includes(s.id)) continue
    const loader = sources[`../content/${s.id}.md`]
    if (!loader) {
      rows.value.push({ id: s.id, task: '—', ok: false, msg: 'нет файла урока' })
      continue
    }
    const lesson = parseLesson(await loader())
    if (!lesson.tasks.length) rows.value.push({ id: s.id, task: '—', ok: false, msg: 'нет задач' })
    for (const [i, t] of lesson.tasks.entries()) {
      if (t.type === 'quiz') {
        const okAns = Array.isArray(t.answer) ? t.answer.every((a) => a < t.options.length) : t.answer < t.options.length
        rows.value.push({ id: s.id, task: `${i + 1}. ${t.title}`, ok: okAns, msg: okAns ? 'quiz' : 'ответ вне вариантов' })
        continue
      }
      if (!t.solution) {
        rows.value.push({ id: s.id, task: `${i + 1}. ${t.title}`, ok: false, msg: 'нет решения' })
        continue
      }
      const files = { ...t.files, ...t.solution }
      const mode = t.mode || 'web'
      // стартовый код НЕ должен проходить проверки
      const doc0 = await prepare(t.files, mode, nextFrameId())
      await loadInto(frame.value, doc0, mode)
      const r0 = await runChecks(frame.value, t.files, t.checks)
      const starterPasses = r0.every((r) => r.ok)
      const doc = await prepare(files, mode, nextFrameId())
      await loadInto(frame.value, doc, mode)
      const res = await runChecks(frame.value, files, t.checks)
      const failed = res.filter((r) => !r.ok)
      rows.value.push({
        id: s.id,
        task: `${i + 1}. ${t.title}`,
        ok: !failed.length && !starterPasses,
        msg: starterPasses ? 'стартовый код уже проходит!' : failed.map((f) => f.name + (f.msg ? ` (${f.msg})` : '')).join('; '),
      })
    }
  }
  running.value = false
  window.__selftest = rows.value
})
</script>

<template>
  <div class="wrap" style="padding-block: 32px">
    <h1 class="st-title" style="font-size: 32px">Самопроверка задач</h1>
    <p>{{ running ? 'Идёт прогон…' : 'Готово' }} · всего {{ rows.length }} · провалено {{ rows.filter((r) => !r.ok).length }}</p>
    <table class="selftest">
      <tr v-for="(r, i) in rows" :key="i" :style="{ color: r.ok ? 'var(--ok)' : 'var(--danger)' }">
        <td>{{ r.ok ? '✓' : '✕' }}</td>
        <td>{{ r.id }}</td>
        <td>{{ r.task }}</td>
        <td style="color: var(--ink-soft)">{{ r.msg }}</td>
      </tr>
    </table>
    <iframe ref="frame" sandbox="allow-scripts allow-same-origin allow-forms allow-modals" style="width: 900px; height: 500px; border: 1px solid var(--line); margin-top: 20px; background: #fff"></iframe>
  </div>
</template>
