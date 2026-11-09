<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import MetroMap from '../components/MetroMap.vue'
import { lines, stations, transfers, byId } from '../data/lines.js'
import { stationState, stationDone, resetProgress } from '../lib/progress.js'

const next = computed(() => stations.find((s) => stationState(s.id) !== 'done') || stations[0])
const started = computed(() => stations.some((s) => stationState(s.id) !== 'new'))

function lineProgress(line) {
  const done = line.stations.filter((s) => stationState(s.id) === 'done').length
  return { done, total: line.stations.length, pct: Math.round((done / line.stations.length) * 100) }
}

const resetArmed = ref(false)
function onReset() {
  if (!resetArmed.value) {
    resetArmed.value = true
    setTimeout(() => (resetArmed.value = false), 4000)
    return
  }
  resetProgress()
  resetArmed.value = false
}

const sources = [
  { name: 'learn.javascript.ru', url: 'https://learn.javascript.ru', what: 'Современный учебник JavaScript — основа линии 3 (типы, функции, объекты, промисы, DOM, события).' },
  { name: 'HTML Academy', url: 'https://htmlacademy.ru/courses/297', what: 'Подача «короткая теория → сразу задание», формат тренажёра и порядок тем HTML/CSS.' },
  { name: 'CSS Academy', url: 'https://www.cssacademy.com', what: 'Практические темы CSS: формы, псевдоклассы :is/:where, БЭМ, проекты-упражнения.' },
  { name: 'MDN Web Docs', url: 'https://developer.mozilla.org/ru/', what: 'Справочник по всем тегам, свойствам и API — ссылки в каждом уроке.' },
  { name: 'Дока', url: 'https://doka.guide', what: 'Понятные русскоязычные статьи по HTML, CSS, JS и инструментам.' },
  { name: 'web.dev / Learn CSS', url: 'https://web.dev/learn/css', what: 'Курсы Google по CSS, адаптивности, доступности и производительности.' },
  { name: 'vuejs.org', url: 'https://vuejs.org/guide/introduction.html', what: 'Официальное руководство Vue 3 — основа линии 5.' },
  { name: 'vite.dev', url: 'https://vite.dev/guide/', what: 'Официальная документация Vite — основа линии 4.' },
  { name: 'Pro Git', url: 'https://git-scm.com/book/ru/v2', what: 'Бесплатная книга про Git на русском.' },
]
</script>

<template>
  <div class="home">
    <section class="hero wrap">
      <div class="hero-text">
        <p class="kicker">
          <span class="kicker-dots" aria-hidden="true">
            <i v-for="l in lines" :key="l.id" :style="{ background: l.color }"></i>
          </span>
          {{ lines.length }} линий · {{ stations.length }} станций · практика в браузере
        </p>
        <h1 class="hero-title">Фронтенд<br /><span>метро</span></h1>
        <p class="hero-lead">
          Учебник по <b>HTML, CSS, JavaScript, Vite и Vue</b>, нарисованный как схема метро. Каждая станция — урок:
          короткая теория с живыми примерами, а сразу за ней — практика с автопроверкой прямо на странице.
          Ничего не нужно устанавливать, чтобы начать.
        </p>
        <div class="hero-cta">
          <RouterLink class="btn btn-primary btn-lg" :to="{ name: 'station', params: { id: next.id } }">
            {{ started ? 'Продолжить поездку' : 'Отправиться с первой станции' }} →
          </RouterLink>
          <span class="hero-next">
            {{ started ? 'Следующая станция' : 'Первая станция' }}:
            <b>«{{ next.title }}»</b>
          </span>
        </div>
      </div>
      <aside class="hero-board" aria-label="Табло маршрута">
        <div class="board-head">Маршрут</div>
        <ol class="board-list">
          <li v-for="l in lines" :key="l.id">
            <span class="badge" :style="{ background: l.color, color: l.ink }">{{ l.num }}</span>
            <span class="board-name">{{ l.name }}</span>
            <span class="board-meta">{{ lineProgress(l).done }}/{{ l.stations.length }}</span>
          </li>
        </ol>
        <div class="board-foot">Оборот ≈ 120–160 часов с практикой</div>
      </aside>
    </section>

    <section class="wrap howto" aria-labelledby="howto-title">
      <h2 id="howto-title" class="section-title">Как пользоваться схемой</h2>
      <div class="howto-grid">
        <article class="howto-card">
          <svg viewBox="0 0 80 24" aria-hidden="true"><line x1="4" y1="12" x2="76" y2="12" stroke="#E4402F" stroke-width="7" stroke-linecap="round" /></svg>
          <h3>Линия — это направление</h3>
          <p>
            Пять линий: <b>HTML</b> (разметка), <b>CSS</b> (оформление), <b>JavaScript</b> (поведение),
            <b>Инструменты</b> (npm, Git, Vite) и <b>Vue</b> (фреймворк). Едем по порядку — каждая следующая опирается на
            предыдущую.
          </p>
        </article>
        <article class="howto-card">
          <svg viewBox="0 0 80 24" aria-hidden="true"><line x1="4" y1="12" x2="76" y2="12" stroke="#2167C9" stroke-width="7" /><circle cx="40" cy="12" r="8" fill="var(--paper)" stroke="#2167C9" stroke-width="4" /></svg>
          <h3>Станция — это урок</h3>
          <p>
            Сначала теория с примерами (их можно открыть в песочнице), затем <b>практика</b>: задания с редактором кода,
            живым результатом и кнопкой «Проверить». Все задания решены — станция закрашивается.
          </p>
        </article>
        <article class="howto-card">
          <svg viewBox="0 0 80 24" aria-hidden="true"><circle cx="40" cy="12" r="10" fill="var(--paper)" stroke="var(--ink)" stroke-width="3" /><circle cx="40" cy="12" r="6" fill="var(--paper)" stroke="#F2B300" stroke-width="3.5" /></svg>
          <h3>Пересадки связывают темы</h3>
          <p>
            Станции в чёрном кольце — пересадочные. Например, «Первый HTML-документ» ↔ «DOM»: дерево тегов и есть то, с
            чем работает JavaScript. В уроке такие связи показаны отдельно.
          </p>
        </article>
        <article class="howto-card">
          <svg viewBox="0 0 80 24" aria-hidden="true"><line x1="4" y1="12" x2="60" y2="12" stroke="#2E9E6A" stroke-width="7" /><circle cx="62" cy="12" r="10" fill="var(--paper)" stroke="var(--ink)" stroke-width="3" /><circle cx="62" cy="12" r="5" fill="#2E9E6A" /></svg>
          <h3>Конечная — это проект</h3>
          <p>
            Каждая линия заканчивается проектом, где все темы линии собираются вместе: резюме, адаптивный лендинг,
            список задач, трекер привычек на Vue.
          </p>
        </article>
      </div>
    </section>

    <section class="wrap map-section" aria-labelledby="map-title">
      <div class="map-head">
        <h2 id="map-title" class="section-title">Схема линий</h2>
        <ul class="legend">
          <li><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="12" cy="12" r="7" fill="var(--paper)" stroke="var(--ink-soft)" stroke-width="3.5" /></svg>не начата</li>
          <li><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="12" cy="12" r="7" fill="var(--paper)" stroke="var(--ink-soft)" stroke-width="3.5" /><circle cx="12" cy="12" r="2.6" fill="var(--ink-soft)" /></svg>в процессе</li>
          <li><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="12" cy="12" r="7" fill="var(--ink-soft)" stroke="var(--ink-soft)" stroke-width="3.5" /><path d="M8.5 12 L11 14.8 L15.8 9.4" fill="none" stroke="var(--paper)" stroke-width="2" stroke-linecap="round" /></svg>пройдена</li>
          <li><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="var(--paper)" stroke="var(--ink)" stroke-width="2.4" /><circle cx="12" cy="12" r="6" fill="var(--paper)" stroke="var(--ink-soft)" stroke-width="3" /></svg>пересадка</li>
          <li><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="var(--paper)" stroke="var(--ink)" stroke-width="3" /><circle cx="12" cy="12" r="4.5" fill="var(--ink-soft)" /></svg>проект</li>
        </ul>
      </div>
      <MetroMap />
      <p class="map-hint">Нажмите на станцию, чтобы открыть урок. На телефоне схему можно прокручивать вбок.</p>
    </section>

    <section class="wrap lines-section" aria-labelledby="lines-title">
      <h2 id="lines-title" class="section-title">Все станции по линиям</h2>
      <div class="lines-grid">
        <article v-for="l in lines" :key="l.id" class="line-card" :style="{ '--c': l.color, '--ci': l.ink }">
          <header class="line-card-head">
            <span class="badge badge-lg">{{ l.num }}</span>
            <div>
              <h3>{{ l.name }} <span>· {{ l.title }}</span></h3>
              <p>{{ l.about }}</p>
            </div>
          </header>
          <div class="line-card-progress" :aria-label="`Пройдено ${lineProgress(l).done} из ${lineProgress(l).total}`">
            <i :style="{ width: lineProgress(l).pct + '%' }"></i>
          </div>
          <ol class="line-stops">
            <li v-for="(s, i) in l.stations" :key="s.id" :class="['stop-' + stationState(s.id), { 'stop-project': s.project }]">
              <RouterLink :to="{ name: 'station', params: { id: s.id } }">
                <span class="stop-dot" aria-hidden="true"></span>
                <span class="stop-n">{{ String(i + 1).padStart(2, '0') }}</span>
                <span class="stop-title">{{ s.title }}</span>
                <span v-if="stationDone(s.id).total" class="stop-meta">{{ stationDone(s.id).done }}/{{ stationDone(s.id).total }}</span>
              </RouterLink>
            </li>
          </ol>
        </article>
      </div>
    </section>

    <section class="wrap why" aria-labelledby="why-title">
      <h2 id="why-title" class="section-title">Почему маршрут именно такой</h2>
      <div class="why-cols prose">
        <p>
          <b>HTML → CSS → JS</b> — классический порядок, которого придерживаются и HTML Academy, и учебник learn.javascript.ru:
          сначала структура и смысл, потом внешний вид, потом поведение. Так каждое новое знание ложится на понятную
          основу: JavaScript работает с DOM, а DOM — это ваш HTML.
        </p>
        <p>
          <b>Инструменты до Vue.</b> Современный Vue пишут в однофайловых компонентах (<code>.vue</code>), которые
          собирает Vite. Поэтому перед фреймворком мы разбираемся с терминалом, npm, Git и сборкой — иначе первый же
          <code>npm create vue</code> кажется магией.
        </p>
        <p>
          <b>Пересадки</b> подсказывают, когда полезно вернуться к прошлой теме: изучая события, загляните в формы; изучая
          SFC, — в модули. Повторение по связям запоминается лучше, чем повторение по порядку.
        </p>
        <p>
          <b>Темп.</b> Одна станция — 30–90 минут вместе с практикой. Удобный ритм — 1–2 станции в день. Не пропускайте
          практику: именно она превращает «понял» в «умею».
        </p>
      </div>
      <h3 class="sub-title">Пересадки на схеме</h3>
      <ul class="transfer-list">
        <li v-for="([a, b, note], i) in transfers" :key="i">
          <RouterLink :to="{ name: 'station', params: { id: a } }">{{ byId[a].title }}</RouterLink>
          <span aria-hidden="true">⇄</span>
          <RouterLink :to="{ name: 'station', params: { id: b } }">{{ byId[b].title }}</RouterLink>
          <small>{{ note }}</small>
        </li>
      </ul>
    </section>

    <section class="wrap sources" aria-labelledby="src-title">
      <h2 id="src-title" class="section-title">Источники и что почитать дальше</h2>
      <ul class="src-grid">
        <li v-for="s in sources" :key="s.url">
          <a :href="s.url" target="_blank" rel="noopener">{{ s.name }} ↗</a>
          <p>{{ s.what }}</p>
        </li>
      </ul>
      <div class="reset">
        <button type="button" class="btn btn-ghost" @click="onReset">
          {{ resetArmed ? 'Нажмите ещё раз, чтобы стереть весь прогресс и код' : 'Сбросить прогресс' }}
        </button>
      </div>
    </section>
  </div>
</template>
