// Схема линий. Порядок линий = рекомендуемый маршрут.
// Каждая станция — урок: теория (src/content/<id>.md) + практика (блоки ```task внутри файла).

export const lines = [
  {
    id: 'html',
    num: 1,
    name: 'HTML',
    title: 'Разметка',
    color: '#E4402F',
    ink: '#ffffff',
    about: 'Каркас любой страницы: теги, текст, ссылки, картинки, формы и смысловая (семантическая) разметка.',
    stations: [
      { id: 'h1', title: 'Как устроен веб' },
      { id: 'h2', title: 'Первый HTML-документ' },
      { id: 'h3', title: 'Текст и его смысл' },
      { id: 'h4', title: 'Ссылки и изображения' },
      { id: 'h5', title: 'Списки и таблицы' },
      { id: 'h6', title: 'Семантика и доступность' },
      { id: 'h7', title: 'Формы' },
      { id: 'h8', title: 'Проект: резюме', project: true },
    ],
  },
  {
    id: 'css',
    num: 2,
    name: 'CSS',
    title: 'Оформление',
    color: '#2167C9',
    ink: '#ffffff',
    about: 'Внешний вид и раскладка: селекторы, каскад, блочная модель, Flexbox, Grid, адаптивность и анимации.',
    stations: [
      { id: 'c1', title: 'Синтаксис и подключение' },
      { id: 'c2', title: 'Селекторы' },
      { id: 'c3', title: 'Каскад и наследование' },
      { id: 'c4', title: 'Блочная модель' },
      { id: 'c5', title: 'Шрифты, единицы, цвет' },
      { id: 'c6', title: 'Позиционирование' },
      { id: 'c7', title: 'Flexbox' },
      { id: 'c8', title: 'Grid' },
      { id: 'c9', title: 'Адаптивная вёрстка' },
      { id: 'c10', title: 'Переходы и анимации' },
      { id: 'c11', title: 'Переменные и архитектура' },
      { id: 'c12', title: 'Проект: лендинг', project: true },
    ],
  },
  {
    id: 'js',
    num: 3,
    name: 'JavaScript',
    title: 'Поведение',
    color: '#F2B300',
    ink: '#1b1a17',
    about: 'Язык программирования браузера: данные, функции, объекты, массивы, DOM, события, асинхронность и модули.',
    stations: [
      { id: 'j1', title: 'Знакомство и переменные' },
      { id: 'j2', title: 'Типы и операторы' },
      { id: 'j3', title: 'Условия и циклы' },
      { id: 'j4', title: 'Функции и замыкания' },
      { id: 'j5', title: 'Объекты' },
      { id: 'j6', title: 'Массивы' },
      { id: 'j7', title: 'Классы' },
      { id: 'j8', title: 'DOM' },
      { id: 'j9', title: 'События' },
      { id: 'j10', title: 'Асинхронность' },
      { id: 'j11', title: 'fetch, JSON, хранилище' },
      { id: 'j12', title: 'Модули' },
      { id: 'j13', title: 'Проект: список задач', project: true },
    ],
  },
  {
    id: 'tools',
    num: 4,
    name: 'Инструменты',
    title: 'Node · npm · Git · Vite',
    color: '#8B5A2B',
    ink: '#ffffff',
    about: 'Рабочее окружение: терминал, npm, DevTools, Git и сборщик Vite — от первого проекта до деплоя.',
    stations: [
      { id: 't1', title: 'Терминал, Node и npm' },
      { id: 't6', title: 'DevTools и отладка' },
      { id: 't2', title: 'Git' },
      { id: 't3', title: 'Старт на Vite' },
      { id: 't4', title: 'Конфиг Vite и env' },
      { id: 't5', title: 'Сборка и деплой' },
    ],
  },
  {
    id: 'vue',
    num: 5,
    name: 'Vue',
    title: 'Фреймворк',
    color: '#2E9E6A',
    ink: '#ffffff',
    about: 'Реактивные интерфейсы на Vue 3: шаблоны, директивы, компоненты, SFC, Composition API, Router и Pinia.',
    stations: [
      { id: 'v1', title: 'Знакомство с Vue' },
      { id: 'v2', title: 'Директивы' },
      { id: 'v3', title: 'Реактивность' },
      { id: 'v4', title: 'computed и watch' },
      { id: 'v5', title: 'Формы и v-model' },
      { id: 'v6', title: 'Компоненты и props' },
      { id: 'v7', title: 'События и слоты' },
      { id: 'v8', title: 'SFC и script setup' },
      { id: 'v9', title: 'Жизненный цикл, composables' },
      { id: 'v10', title: 'Vue Router' },
      { id: 'v11', title: 'Pinia' },
      { id: 'v12', title: 'Проект: трекер привычек', project: true },
    ],
  },
]

// Пересадки между темами разных линий (кроме конечных).
export const transfers = [
  ['h2', 'j8', 'Дерево тегов — это и есть DOM'],
  ['h7', 'j9', 'Формы оживают через события'],
  ['c10', 'j9', 'Анимации по событиям'],
  ['j12', 't3', 'ES-модули — основа Vite'],
  ['j4', 't6', 'Точки останова в функциях'],
  ['t3', 'v8', 'SFC собирает Vite'],
  ['j8', 'v1', 'Vue управляет DOM за вас'],
]

export const stations = lines.flatMap((line) =>
  line.stations.map((s, i) => ({ ...s, line: line.id, index: i })),
)

export const byId = Object.fromEntries(stations.map((s) => [s.id, s]))
export const lineById = Object.fromEntries(lines.map((l) => [l.id, l]))

export function neighbors(id) {
  const i = stations.findIndex((s) => s.id === id)
  return { prev: stations[i - 1] || null, next: stations[i + 1] || null }
}

export function transfersFor(id) {
  return transfers
    .filter(([a, b]) => a === id || b === id)
    .map(([a, b, note]) => ({ to: byId[a === id ? b : a], note }))
}
