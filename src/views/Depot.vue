<script setup>
import { ref, watch } from 'vue'
import Playground from '../components/Playground.vue'
import { presets } from '../data/depot-presets.js'

const KEY = 'frontend-metro:depot'
let start = { files: presets.web.files, mode: 'web' }
try {
  const s = sessionStorage.getItem(KEY) || localStorage.getItem(KEY)
  if (s) start = JSON.parse(s)
} catch {}

const mode = ref(start.mode)
const files = ref(start.files)
const pgKey = ref(0)

watch([files, mode], () => {
  try {
    const v = JSON.stringify({ files: files.value, mode: mode.value })
    localStorage.setItem(KEY, v)
    sessionStorage.removeItem(KEY)
  } catch {}
}, { deep: true })

function choose(k) {
  mode.value = presets[k].mode
  files.value = JSON.parse(JSON.stringify(presets[k].files))
  pgKey.value++
}

const newName = ref('')
function addFile() {
  let n = newName.value.trim()
  if (!n) return
  if (!/\.(html|css|js|vue)$/.test(n)) n += mode.value === 'sfc' ? '.vue' : '.js'
  if (files.value[n] !== undefined) return
  files.value = { ...files.value, [n]: '' }
  newName.value = ''
}
</script>

<template>
  <div class="depot wrap">
    <header class="depot-head">
      <div>
        <p class="st-kicker">Депо · песочница</p>
        <h1 class="st-title">Здесь поезда отдыхают, а вы — экспериментируете</h1>
        <p class="depot-lead">
          Свободный редактор без проверок. Сюда же открываются примеры из уроков по кнопке «Открыть в песочнице».
          Код сохраняется в этом браузере.
        </p>
      </div>
    </header>
    <div class="depot-tools">
      <div class="seg" role="group" aria-label="Шаблон">
        <button v-for="(p, k) in presets" :key="k" type="button" class="seg-btn" :class="{ on: mode === p.mode }" @click="choose(k)">
          {{ p.label }}
        </button>
      </div>
      <form class="add-file" @submit.prevent="addFile">
        <label class="sr-only" for="newfile">Имя нового файла</label>
        <input id="newfile" v-model="newName" placeholder="новый файл, напр. utils.js" />
        <button type="submit" class="btn">+ файл</button>
      </form>
    </div>
    <Playground :key="pgKey + mode" v-model:files="files" :mode="mode" height="min(72vh, 680px)" :show-preview="mode !== 'js'" />
  </div>
</template>
