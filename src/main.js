import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import '@fontsource-variable/onest'
import '@fontsource-variable/unbounded'
import '@fontsource-variable/jetbrains-mono'
import './styles/main.css'
import App from './App.vue'
import Home from './views/Home.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: Home },
    { path: '/s/:id', name: 'station', component: () => import('./views/Station.vue') },
    { path: '/depot', name: 'depot', component: () => import('./views/Depot.vue') },
    { path: '/selftest', name: 'selftest', component: () => import('./views/SelfTest.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior(to, from, saved) {
    if (saved) return saved
    if (to.hash && to.hash.length > 1) return { el: decodeURIComponent(to.hash), top: 90, behavior: 'smooth' }
    return { top: 0 }
  },
})

const TITLES = {
  home: 'Фронтенд-метро — схема изучения HTML, CSS, JS, Vite и Vue',
  depot: 'Депо — песочница · Фронтенд-метро',
  selftest: 'Самопроверка задач · Фронтенд-метро',
}
// заголовок станции ставит сама Station.vue после загрузки урока
router.afterEach((to) => {
  if (TITLES[to.name]) document.title = TITLES[to.name]
})

createApp(App).use(router).mount('#app')
