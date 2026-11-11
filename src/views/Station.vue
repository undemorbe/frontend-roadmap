<script setup>
import { computed, nextTick, onMounted, ref, shallowRef, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { byId, lineById, neighbors, transfersFor } from '../data/lines.js'
import { parseLesson } from '../lib/markdown.js'
import { buildDocument, nextFrameId } from '../lib/runner.js'
import { markVisited, stationState, stationDone } from '../lib/progress.js'
import TaskCode from '../components/TaskCode.vue'
import TaskQuiz from '../components/TaskQuiz.vue'

const route = useRoute()
const router = useRouter()
const id = route.params.id
const station = byId[id]
if (!station) router.replace('/')
const line = station ? lineById[station.line] : null
const nb = neighbors(id)
const xfers = transfersFor(id)

const sources = import.meta.glob('../content/*.md', { query: '?raw', import: 'default' })
const lesson = shallowRef(null)
const loading = ref(true)
const article = ref(null)
const activeToc = ref('')

const nextIsTransfer = computed(() => nb.next && nb.next.line !== station.line)
const progressInfo = computed(() => stationDone(id))

async function load() {
  const loader = sources[`../content/${id}.md`]
  if (!loader) {
    lesson.value = { html: '<p>Урок ещё в пути.</p>', tasks: [], demos: [], toc: [] }
  } else {
    lesson.value = parseLesson(await loader())
  }
  markVisited(id, lesson.value.tasks.length)
  loading.value = false
  document.title = `${station.title} — ${line.name} · Фронтенд-метро`
  await nextTick()
  mountDemos()
  observeToc()
  if (route.query.s) setTimeout(() => scrollToId(String(route.query.s)), 60)
}

// переход из поиска на раздел этой же станции
watch(
  () => route.query.s,
  (s) => s && !loading.value && scrollToId(String(s)),
)

function mountDemos() {
  if (!article.value) return
  article.value.querySelectorAll('[data-demo-frame]').forEach((holder) => {
    const demo = lesson.value.demos[+holder.dataset.demoFrame]
    const iframe = document.createElement('iframe')
    iframe.title = 'Результат примера'
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-modals')
    iframe.loading = 'lazy'
    const files = demoFiles(demo)
    iframe.srcdoc = buildDocument(files, demo.flags.includes('vue') ? 'vue' : 'web', nextFrameId())
    holder.appendChild(iframe)
    iframe.addEventListener('load', () => {
      try {
        const h = iframe.contentDocument.documentElement.scrollHeight
        iframe.style.height = Math.min(Math.max(h + 4, 60), 420) + 'px'
      } catch {}
    })
  })
}

const CONSOLE_HTML = `<style>body{margin:0;padding:6px 10px}#__con{font:13px/1.55 ui-monospace,Menlo,monospace;white-space:pre-wrap}#__con div{border-bottom:1px solid #eee;padding:3px 0}#__con .e{color:#c62828}#__con:empty::before{content:'(нет вывода)';color:#999}</style><div id="__con"></div><script>(function(){var c=document.getElementById('__con');function f(v){if(typeof v==='string')return v;if(v===undefined)return 'undefined';if(typeof v==='function')return 'ƒ '+(v.name||'')+'()';try{return JSON.stringify(v)}catch(e){return String(v)}}['log','info','warn','error'].forEach(function(k){var o=console[k];console[k]=function(){o.apply(console,arguments);var d=document.createElement('div');if(k==='error')d.className='e';d.textContent='› '+[].map.call(arguments,f).join(' ');c.appendChild(d)}});window.addEventListener('error',function(e){console.error(e.message)})})()<\/script>`

function demoFiles(demo) {
  if (demo.lang === 'css') {
    // в CSS-примерах HTML берётся из комментария /* html: ... */ в начале
    const m = demo.code.match(/^\/\*\s*html:\s*([\s\S]*?)\*\/\s*/)
    return { 'index.html': m ? m[1].trim() : '', 'style.css': m ? demo.code.slice(m[0].length) : demo.code }
  }
  if (demo.lang === 'js') return { 'index.html': CONSOLE_HTML, 'script.js': demo.code }
  // html-пример может содержать <style> и <script> внутри
  return { 'index.html': demo.code }
}

function onArticleClick(e) {
  const open = e.target.closest('[data-demo-open]')
  if (open) {
    const demo = lesson.value.demos[+open.dataset.demoOpen]
    try {
      sessionStorage.setItem('frontend-metro:depot', JSON.stringify({ files: demoFiles(demo), mode: demo.flags.includes('vue') ? 'vue' : 'web' }))
    } catch {}
    router.push({ name: 'depot' })
    return
  }
  const a = e.target.closest('a[href^="#"]')
  if (a && !a.getAttribute('href').startsWith('#/')) {
    e.preventDefault()
    scrollToId(a.getAttribute('href').slice(1))
  }
}

function scrollToId(target) {
  const el = document.getElementById(target)
  if (el) {
    const top = el.getBoundingClientRect().top + window.scrollY - 84
    window.scrollTo({ top, behavior: 'smooth' })
  }
}

let observer
function observeToc() {
  if (!article.value || !('IntersectionObserver' in window)) return
  observer = new IntersectionObserver(
    (entries) => {
      for (const en of entries) if (en.isIntersecting) activeToc.value = en.target.id
    },
    { rootMargin: '-80px 0px -70% 0px' },
  )
  article.value.querySelectorAll('h2[id]').forEach((h) => observer.observe(h))
  const pr = document.getElementById('praktika')
  if (pr) observer.observe(pr)
}

onMounted(() => station && load())

const stationNo = station ? station.index + 1 : 0
const announce = computed(() => {
  if (!nb.next) return 'Конечная. Поезд дальше не идёт — поздравляем, маршрут пройден!'
  if (nextIsTransfer.value) return `Конечная линии. Переход на линию ${lineById[nb.next.line].num} · ${lineById[nb.next.line].name}`
  return `Следующая станция — «${nb.next.title}»`
})

const taskKinds = { code: 'Код', quiz: 'Вопрос' }
</script>

<template>
  <div v-if="station" class="station-page" :style="{ '--c': line.color, '--ci': line.ink }">
    <!-- Схема линии, как в вагоне -->
    <nav class="car-strip" aria-label="Станции линии">
      <div class="wrap">
        <div class="car-line">
          <RouterLink
            v-for="s in line.stations"
            :key="s.id"
            :to="{ name: 'station', params: { id: s.id } }"
            class="car-stop"
            :class="['cs-' + stationState(s.id), { current: s.id === id, project: s.project }]"
            :aria-current="s.id === id ? 'page' : undefined"
          >
            <span class="car-dot"></span>
            <span class="car-name">{{ s.title }}</span>
          </RouterLink>
        </div>
      </div>
    </nav>

    <header class="st-head wrap">
      <div class="st-sign">
        <span class="badge badge-xl">{{ line.num }}</span>
        <div>
          <p class="st-kicker">
            Линия {{ line.num }} · {{ line.name }} · станция {{ stationNo }} из {{ line.stations.length }}
          </p>
          <h1 class="st-title">{{ station.title }}</h1>
        </div>
      </div>
      <div class="st-meta">
        <span v-if="lesson">{{ lesson.tasks.length }} {{ lesson.tasks.length === 1 ? 'задание' : lesson.tasks.length < 5 ? 'задания' : 'заданий' }}</span>
        <span v-if="progressInfo.total">решено {{ progressInfo.done }}/{{ progressInfo.total }}</span>
        <RouterLink v-for="x in xfers" :key="x.to.id" :to="{ name: 'station', params: { id: x.to.id } }" class="xfer-chip" :style="{ '--xc': lineById[x.to.line].color, '--xi': lineById[x.to.line].ink }" :title="x.note">
          <span class="badge badge-sm">{{ lineById[x.to.line].num }}</span>
          пересадка: {{ x.to.title }}
        </RouterLink>
      </div>
    </header>

    <div v-if="loading" class="wrap st-loading">Поезд прибывает…</div>

    <div v-else class="st-body wrap">
      <aside class="st-toc" aria-label="Содержание урока">
        <div class="toc-inner">
          <p class="toc-title">На этой станции</p>
          <ol>
            <li v-for="t in lesson.toc" :key="t.id" :class="{ on: activeToc === t.id }">
              <a :href="'#' + t.id" @click.prevent="scrollToId(t.id)">{{ t.text }}</a>
            </li>
            <li v-if="lesson.tasks.length" class="toc-practice" :class="{ on: activeToc === 'praktika' }">
              <a href="#praktika" @click.prevent="scrollToId('praktika')">Практика · {{ lesson.tasks.length }}</a>
            </li>
          </ol>
        </div>
      </aside>

      <div class="st-main">
        <article ref="article" class="prose theory" @click="onArticleClick" v-html="lesson.html"></article>

        <section v-if="lesson.tasks.length" id="praktika" class="practice" aria-labelledby="praktika-title">
          <div class="practice-head">
            <h2 id="praktika-title">Практика</h2>
            <p>
              Задания проверяются автоматически. Код сохраняется в браузере — можно уйти и вернуться.
              <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>Enter</kbd> — перезапустить.
            </p>
          </div>
          <div v-for="(t, i) in lesson.tasks" :key="i" class="task" :class="'task-' + (t.type || 'code')">
            <div class="task-head">
              <span class="task-num">{{ i + 1 }}</span>
              <h3>{{ t.title }}</h3>
              <span class="task-kind">{{ taskKinds[t.type || 'code'] }}</span>
            </div>
            <TaskQuiz v-if="t.type === 'quiz'" :task="t" :lesson-id="id" :index="i" />
            <TaskCode v-else :task="t" :lesson-id="id" :index="i" />
          </div>
        </section>

        <footer class="st-foot">
          <p class="announce" role="status">
            <span class="announce-ico" aria-hidden="true">◉</span>
            {{ announce }}
          </p>
          <div class="st-nav">
            <RouterLink v-if="nb.prev" class="st-nav-btn prev" :to="{ name: 'station', params: { id: nb.prev.id } }">
              <small>← Предыдущая</small>
              <span>{{ nb.prev.title }}</span>
            </RouterLink>
            <span v-else></span>
            <RouterLink
              v-if="nb.next"
              class="st-nav-btn next"
              :to="{ name: 'station', params: { id: nb.next.id } }"
              :style="{ '--nc': lineById[nb.next.line].color, '--ni': lineById[nb.next.line].ink }"
            >
              <small>{{ nextIsTransfer ? 'Переход на линию ' + lineById[nb.next.line].num : 'Следующая' }} →</small>
              <span>{{ nb.next.title }}</span>
            </RouterLink>
            <RouterLink v-else class="st-nav-btn next" to="/">
              <small>Маршрут завершён →</small>
              <span>На схему</span>
            </RouterLink>
          </div>
        </footer>
      </div>
    </div>
  </div>
</template>
