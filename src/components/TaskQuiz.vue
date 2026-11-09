<script setup>
import { computed, ref } from 'vue'
import { renderInline } from '../lib/markdown.js'
import { setTaskDone, isTaskDone } from '../lib/progress.js'

const props = defineProps({
  task: { type: Object, required: true },
  lessonId: { type: String, required: true },
  index: { type: Number, required: true },
})

const multi = Array.isArray(props.task.answer)
const picked = ref(multi ? [] : null)
const submitted = ref(false)
const done = computed(() => isTaskDone(props.lessonId, props.index))
const name = `q-${props.lessonId}-${props.index}`

const correct = computed(() => {
  if (multi) {
    const a = [...props.task.answer].sort().join(',')
    return [...picked.value].sort().join(',') === a
  }
  return picked.value === props.task.answer
})

function submit() {
  submitted.value = true
  if (correct.value) setTaskDone(props.lessonId, props.index, true)
}

function isRight(i) {
  return multi ? props.task.answer.includes(i) : props.task.answer === i
}

const q = computed(() => renderInline(props.task.question))
const explain = computed(() => renderInline(props.task.explain))
const opt = (s) => renderInline(s).replace(/^<p>|<\/p>\s*$/g, '')
</script>

<template>
  <form class="quiz" @submit.prevent="submit">
    <div class="prose" v-html="q"></div>
    <p class="quiz-kind">{{ multi ? 'Выберите все верные варианты' : 'Выберите один вариант' }}</p>
    <div class="quiz-options">
      <label
        v-for="(o, i) in task.options"
        :key="i"
        class="quiz-opt"
        :class="{
          sel: multi ? picked.includes(i) : picked === i,
          right: submitted && isRight(i),
          wrong: submitted && !isRight(i) && (multi ? picked.includes(i) : picked === i),
        }"
      >
        <input
          v-if="multi"
          v-model="picked"
          type="checkbox"
          :value="i"
          @change="submitted = false"
        />
        <input v-else v-model="picked" type="radio" :name="name" :value="i" @change="submitted = false" />
        <span class="quiz-letter">{{ 'АБВГДЕЖ'[i] }}</span>
        <span v-html="opt(o)"></span>
      </label>
    </div>
    <div class="task-actions">
      <button type="submit" class="btn btn-primary" :disabled="multi ? !picked.length : picked === null">Ответить</button>
      <span v-if="done" class="task-done-badge">✓ Засчитано</span>
    </div>
    <div v-if="submitted" class="task-results" :class="{ ok: correct }" aria-live="polite">
      <div class="task-results-head">{{ correct ? 'Верно!' : 'Не совсем. Попробуйте ещё раз.' }}</div>
      <div v-if="correct && task.explain" class="prose" v-html="explain"></div>
    </div>
  </form>
</template>
