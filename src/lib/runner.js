// Запуск пользовательского кода в iframe и проверка задач.
import vueUrl from '../../node_modules/vue/dist/vue.global.prod.js?url'
import routerUrl from '../../node_modules/vue-router/dist/vue-router.global.prod.js?url'
import piniaUrl from '../../node_modules/pinia/dist/pinia.iife.prod.js?url'

const abs = (u) => new URL(u, window.location.href).href

let frameSeq = 0
export const nextFrameId = () => `f${++frameSeq}`

const ext = (name) => name.split('.').pop().toLowerCase()

/** Скрипт-мост: пересылает console.* и ошибки наружу, гасит навигацию. */
function bridge(id) {
  return `<script>(function(){
var ID=${JSON.stringify(id)};window.__logs=[];
function fmt(v){try{if(typeof v==='string')return v;if(v instanceof Error)return v.name+': '+v.message;if(typeof v==='function')return 'ƒ '+(v.name||'anonymous')+'()';if(v instanceof Element)return '<'+v.tagName.toLowerCase()+(v.id?'#'+v.id:'')+(v.className&&typeof v.className==='string'?'.'+v.className.trim().split(/\\s+/).join('.'):'')+'>';if(typeof v==='undefined')return 'undefined';if(typeof v==='symbol'||typeof v==='bigint')return String(v)+(typeof v==='bigint'?'n':'');var seen=new WeakSet();return JSON.stringify(v,function(k,x){if(typeof x==='object'&&x!==null){if(seen.has(x))return '[Circular]';seen.add(x)}if(x instanceof Map)return {'Map':Array.from(x.entries())};if(x instanceof Set)return {'Set':Array.from(x)};if(typeof x==='function')return 'ƒ';if(typeof x==='undefined')return 'undefined';return x})}catch(e){return String(v)}}
function send(t,a){var args=[].map.call(a,fmt);window.__logs.push({type:t,text:args.join(' ')});try{parent.postMessage({__fr:ID,type:t,text:args.join(' ')},'*')}catch(e){}}
['log','info','warn','error','table'].forEach(function(k){var o=console[k];console[k]=function(){send(k==='table'?'log':k,arguments);try{o.apply(console,arguments)}catch(e){}}});
window.addEventListener('error',function(e){send('error',[(e.message||'Ошибка')+(e.lineno?' (строка '+e.lineno+')':'')])});
window.addEventListener('unhandledrejection',function(e){var r=e.reason;send('error',['Uncaught (in promise) '+(r&&r.message?r.name+': '+r.message:String(r))])});
document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[href]');if(!a)return;var h=a.getAttribute('href');if(h&&h.charAt(0)==='#')return;if(e.defaultPrevented)return;e.preventDefault();send('info',['Переход по ссылке «'+h+'» — в песочнице отключён'])});
window.addEventListener('submit',function(e){if(!e.defaultPrevented){e.preventDefault();send('info',['Форма отправлена — в песочнице отправка на сервер отключена'])}});
})();<\/script>`
}

const BASE_STYLE = `<style>html{font-family:system-ui,-apple-system,"Segoe UI",sans-serif;color-scheme:light}body{margin:8px}</style>`

function wrapDocument(html, headExtra, bodyExtra) {
  const hasDoc = /<html[\s>]/i.test(html) || /<!doctype/i.test(html)
  if (!hasDoc) {
    return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${headExtra}</head><body>${html}${bodyExtra}</body></html>`
  }
  let out = html
  if (/<head[^>]*>/i.test(out)) out = out.replace(/<head[^>]*>/i, (m) => m + headExtra)
  else out = out.replace(/<html[^>]*>/i, (m) => m + '<head>' + headExtra + '</head>')
  if (/<\/body>/i.test(out)) out = out.replace(/<\/body>/i, bodyExtra + '</body>')
  else out += bodyExtra
  return out
}

const safeScript = (code) => String(code).replace(/<\/script/gi, '<\\/script')

/** Собирает srcdoc по набору файлов и режиму. */
export function buildDocument(files, mode, id) {
  const names = Object.keys(files)
  const htmlName = names.find((n) => ext(n) === 'html')
  const html = htmlName ? files[htmlName] : mode === 'vue' || mode === 'sfc' ? '<div id="app"></div>' : ''
  const css = names.filter((n) => ext(n) === 'css').map((n) => files[n]).join('\n')

  if (mode === 'sfc') {
    const head = `${BASE_STYLE}${bridge(id)}<style>${css}</style><script src="${abs(vueUrl)}"><\/script><script src="${abs(routerUrl)}"><\/script><script src="${abs(piniaUrl)}"><\/script>`
    const payload = safeScript(JSON.stringify(files))
    const body = `<script>window.__FILES__=${payload};<\/script><script>(${sfcBoot.toString()})()<\/script>`
    return wrapDocument(html.includes('id="app"') ? html : html + '<div id="app"></div>', head, body)
  }

  if (mode === 'config') {
    // текстовые задачи: ничего не выполняем
    return `<!doctype html><html><head>${bridge(id)}</head><body></body></html>`
  }

  const jsFiles = names.filter((n) => ext(n) === 'js')
  const libs = mode === 'vue' ? `<script src="${abs(vueUrl)}"><\/script>` : ''
  const head = `${BASE_STYLE}${bridge(id)}${css ? `<style>${css}</style>` : ''}${libs}`
  const scripts = jsFiles.map((n) => `<script>${safeScript(files[n])}\n//# sourceURL=${n}<\/script>`).join('')
  return wrapDocument(html, head, scripts)
}

// ---------- SFC: компиляция .vue прямо в iframe (через компилятор, переданный из родителя) ----------

let compilerPromise
export function loadCompiler() {
  if (!compilerPromise) compilerPromise = import('vue/compiler-sfc')
  return compilerPromise
}

function hashId(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  return (h >>> 0).toString(16).slice(0, 8)
}

function resolvePath(from, spec) {
  const base = from.split('/').slice(0, -1)
  for (const part of spec.split('/')) {
    if (part === '.' || part === '') continue
    if (part === '..') base.pop()
    else base.push(part)
  }
  return base.join('/')
}

function rewriteImports(code, filename, cssOut) {
  // import './style.css' → выносим CSS; относительные пути → '@fr/путь'
  return code
    .replace(/import\s+['"](\.{1,2}\/[^'"]+\.css)['"];?/g, (m, p) => {
      cssOut.push(`/* ${p} */`)
      cssOut.push({ ref: resolvePath(filename, p) })
      return ''
    })
    .replace(/(from\s+|import\s*\(\s*|import\s+)(['"])(\.{1,2}\/[^'"]+)\2/g, (m, pre, q, p) => {
      let target = resolvePath(filename, p)
      return `${pre}${q}@fr/${target}${q}`
    })
}

/** Компилирует набор файлов (SFC + JS) в ES-модули. Возвращает { modules, css, errors }. */
export async function compileProject(files) {
  const sfc = await loadCompiler()
  const modules = {}
  const cssParts = []
  const errors = []
  const cssRefs = []

  for (const [name, source] of Object.entries(files)) {
    const e = ext(name)
    try {
      if (e === 'vue') {
        const { descriptor, errors: pe } = sfc.parse(source, { filename: name })
        if (pe.length) throw pe[0]
        const id = hashId(name)
        const scoped = descriptor.styles.some((s) => s.scoped)
        let code = ''
        if (descriptor.script || descriptor.scriptSetup) {
          const script = sfc.compileScript(descriptor, {
            id,
            inlineTemplate: true,
            genDefaultAs: '__sfc__',
            templateOptions: { compilerOptions: { scopeId: scoped ? `data-v-${id}` : undefined } },
          })
          code += script.content
          if (descriptor.template && !descriptor.scriptSetup) {
            const tpl = sfc.compileTemplate({
              source: descriptor.template.content,
              filename: name,
              id,
              scoped,
              compilerOptions: { bindingMetadata: script.bindings, scopeId: scoped ? `data-v-${id}` : undefined },
            })
            if (tpl.errors.length) throw tpl.errors[0]
            code += `\n${tpl.code.replace(/\nexport (function|const) render/, '\n$1 render')}\n__sfc__.render = render`
          }
        } else {
          code += 'const __sfc__ = {}'
          if (descriptor.template) {
            const tpl = sfc.compileTemplate({
              source: descriptor.template.content,
              filename: name,
              id,
              scoped,
              compilerOptions: { scopeId: scoped ? `data-v-${id}` : undefined },
            })
            if (tpl.errors.length) throw tpl.errors[0]
            code += `\n${tpl.code.replace(/\nexport (function|const) render/, '\n$1 render')}\n__sfc__.render = render`
          }
        }
        if (scoped) code += `\n__sfc__.__scopeId = "data-v-${id}"`
        code += `\n__sfc__.__name = ${JSON.stringify(name.split('/').pop().replace('.vue', ''))}\nexport default __sfc__`
        modules[name] = rewriteImports(code, name, cssRefs)
        for (const s of descriptor.styles) {
          const r = sfc.compileStyle({ source: s.content, filename: name, id: `data-v-${id}`, scoped: s.scoped })
          if (r.errors.length) throw r.errors[0]
          cssParts.push(r.code)
        }
      } else if (e === 'js') {
        modules[name] = rewriteImports(source, name, cssRefs)
      }
    } catch (err) {
      const msg = err && (err.message || String(err))
      errors.push(`${name}: ${msg}`)
    }
  }
  for (const r of cssRefs) if (r && r.ref && files[r.ref] != null) cssParts.push(files[r.ref])
  return { modules, css: cssParts.join('\n'), errors }
}

/** Выполняется ВНУТРИ iframe: создаёт import map и запускает main.js. */
function sfcBoot() {
  const P = window.__PROJECT__
  if (!P) return
  const shim = (globalName) => {
    const lib = window[globalName]
    const keys = Object.keys(lib).filter((k) => /^[A-Za-z_$][\w$]*$/.test(k) && k !== 'default')
    const src = `const L = window[${JSON.stringify(globalName)}];\nexport const { ${keys.join(', ')} } = L;\nexport default L;`
    return URL.createObjectURL(new Blob([src], { type: 'text/javascript' }))
  }
  const imports = { vue: shim('Vue'), 'vue-router': shim('VueRouter'), pinia: shim('Pinia') }
  for (const [name, code] of Object.entries(P.modules)) {
    imports['@fr/' + name] = URL.createObjectURL(new Blob([code + '\n//# sourceURL=' + name], { type: 'text/javascript' }))
  }
  const map = document.createElement('script')
  map.type = 'importmap'
  map.textContent = JSON.stringify({ imports })
  document.head.appendChild(map)
  if (P.css) {
    const st = document.createElement('style')
    st.textContent = P.css
    document.head.appendChild(st)
  }
  P.errors.forEach((e) => console.error(e))
  const entry = P.modules['main.js']
    ? "import '@fr/main.js'"
    : "import { createApp } from 'vue'; import App from '@fr/App.vue'; window.__app = createApp(App); window.__app.config.errorHandler = (e) => console.error(e); window.__app.mount('#app')"
  const s = document.createElement('script')
  s.type = 'module'
  s.textContent = entry + "\nwindow.__ready = true"
  document.body.appendChild(s)
}

/** Готовит srcdoc с учётом режима (для SFC — предварительно компилирует). */
export async function prepare(files, mode, id) {
  if (mode !== 'sfc') return buildDocument(files, mode, id)
  const project = await compileProject(files)
  const doc = buildDocument(files, mode, id)
  const inject = `<script>window.__PROJECT__=${safeScript(JSON.stringify(project))};<\/script>`
  return doc.replace('<script>window.__FILES__', inject + '<script>window.__FILES__')
}

/** Загружает документ в iframe и ждёт, пока он будет готов. */
export function loadInto(iframe, srcdoc, mode) {
  return new Promise((resolve) => {
    let done = false
    const finish = () => {
      if (done) return
      done = true
      const win = iframe.contentWindow
      // даём модулям и Vue время смонтироваться
      const start = Date.now()
      const poll = () => {
        if (mode !== 'sfc' || win.__ready || Date.now() - start > 1500) setTimeout(resolve, mode === 'web' || mode === 'js' ? 30 : 60)
        else setTimeout(poll, 25)
      }
      poll()
    }
    iframe.addEventListener('load', finish, { once: true })
    iframe.srcdoc = srcdoc
    setTimeout(finish, 4000)
  })
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** Контекст, который получают проверки задач. */
export function makeContext(iframe, files) {
  const win = iframe.contentWindow
  const doc = iframe.contentDocument
  const $ = (s) => doc.querySelector(s)
  const $$ = (s) => Array.from(doc.querySelectorAll(s))
  const el = (x) => (typeof x === 'string' ? $(x) : x)
  const src = {}
  for (const [k, v] of Object.entries(files)) src[k] = v
  const allSrc = (e) => Object.entries(files).filter(([n]) => !e || ext(n) === e).map(([, v]) => v).join('\n')
  return {
    win,
    doc,
    $,
    $$,
    src,
    html: allSrc('html'),
    css: allSrc('css'),
    js: allSrc('js'),
    vue: allSrc('vue'),
    code: allSrc(),
    /** Комментарии убраны — удобно для проверок по исходнику */
    clean: (s) => String(s).replace(/<!--[\s\S]*?-->/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1'),
    style: (x, prop) => {
      const e = el(x)
      return e ? win.getComputedStyle(e).getPropertyValue(prop).trim() : ''
    },
    pseudo: (x, pseudoEl, prop) => {
      const e = el(x)
      return e ? win.getComputedStyle(e, pseudoEl).getPropertyValue(prop).trim() : ''
    },
    rect: (x) => {
      const e = el(x)
      return e ? e.getBoundingClientRect() : null
    },
    text: (x) => {
      const e = el(x)
      return e ? e.textContent.replace(/\s+/g, ' ').trim() : ''
    },
    logs: () => (win.__logs || []).filter((l) => l.type !== 'info').map((l) => l.text),
    errors: () => (win.__logs || []).filter((l) => l.type === 'error').map((l) => l.text),
    get: (name) => {
      try {
        return win.eval(`typeof ${name} !== 'undefined' ? ${name} : undefined`)
      } catch {
        return undefined
      }
    },
    run: (code) => win.eval(code),
    /** Корневой экземпляр Vue (режим vue): доступ к состоянию из setup() */
    vm: () => {
      const root = doc.querySelector('#app')
      return root && root._vnode && root._vnode.component ? root._vnode.component.proxy : undefined
    },
    /** Дождаться перерисовки Vue */
    async tick(ms = 30) {
      if (win.Vue && win.Vue.nextTick) await win.Vue.nextTick()
      await sleep(ms)
    },
    /** Вычисляет vite.config.js со заглушками плагинов и defineConfig */
    config(name = 'vite.config.js', env = {}) {
      const source = String(files[name] || '')
        .replace(/^\s*import[^\n]*$/gm, '')
        .replace(/export\s+default/, 'return')
      const vue = (opts) => ({ name: 'vite:vue', opts })
      const vueDevTools = () => ({ name: 'vite-plugin-vue-devtools' })
      const defineConfig = (x) => (typeof x === 'function' ? x({ command: env.command || 'serve', mode: env.mode || 'development' }) : x)
      const loadEnv = () => env.vars || {}
      const fileURLToPath = (u) => String(u.pathname || u).replace(/^file:\/\//, '')
      const path = { resolve: (...p) => p.join('/').replace(/\/+/g, '/'), join: (...p) => p.join('/') }
      // eslint-disable-next-line no-new-func
      const fn = new Function('defineConfig', 'vue', 'vueDevTools', 'loadEnv', 'fileURLToPath', 'URL', 'path', 'process', '__dirname', 'import_meta', source.replace(/import\.meta/g, 'import_meta'))
      return fn(defineConfig, vue, vueDevTools, loadEnv, fileURLToPath, URL, path, { env: {}, cwd: () => '/project' }, '/project', { url: 'file:///project/vite.config.js', env: {} })
    },
    /** Разбирает .env-файл в объект */
    env(name = '.env') {
      const out = {}
      for (const line of String(files[name] || '').split('\n')) {
        const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/)
        if (m) out[m[1]] = m[2].replace(/^['"]|['"]$/g, '')
      }
      return out
    },
    /** Строки-команды из файла терминала (без комментариев и пустых) */
    commands(name) {
      return String(files[name] || '').split('\n').map((l) => l.replace(/#.*$/, '').trim()).filter(Boolean)
    },
    wait: sleep,
    async click(x) {
      const e = el(x)
      if (!e) throw new Error('Не нашёл элемент для клика')
      e.dispatchEvent(new win.MouseEvent('click', { bubbles: true, cancelable: true }))
      await sleep(40)
    },
    async type(x, value) {
      const e = el(x)
      if (!e) throw new Error('Не нашёл поле ввода')
      e.focus?.()
      if (e.type === 'checkbox' || e.type === 'radio') e.checked = !!value
      else e.value = value
      e.dispatchEvent(new win.Event('input', { bubbles: true }))
      e.dispatchEvent(new win.Event('change', { bubbles: true }))
      await sleep(40)
    },
    async key(x, k) {
      const e = el(x)
      e.dispatchEvent(new win.KeyboardEvent('keydown', { key: k, bubbles: true }))
      e.dispatchEvent(new win.KeyboardEvent('keyup', { key: k, bubbles: true }))
      await sleep(40)
    },
    async submit(x) {
      const f = el(x)
      if (!f) throw new Error('Не нашёл форму')
      f.dispatchEvent(new win.SubmitEvent('submit', { bubbles: true, cancelable: true }))
      await sleep(40)
    },
    async resize(width) {
      iframe.style.width = width + 'px'
      iframe.getBoundingClientRect() // форсируем раскладку родителя
      await sleep(120)
      void iframe.contentDocument.documentElement.offsetWidth
    },
  }
}

/** Прогоняет проверки. Каждая: { name, test: async (ctx) => boolean | string } */
export async function runChecks(iframe, files, checks) {
  const prevWidth = iframe.style.width
  const ctx = makeContext(iframe, files)
  const results = []
  for (const c of checks) {
    let ok = false
    let msg = ''
    try {
      const r = await c.test(ctx)
      ok = r === true
      if (typeof r === 'string') msg = r
    } catch (e) {
      msg = e && e.message ? e.message : String(e)
    }
    results.push({ name: c.name, ok, msg })
  }
  iframe.style.width = prevWidth
  return results
}

export function modeOf(files) {
  const names = Object.keys(files)
  if (names.some((n) => ext(n) === 'vue')) return 'sfc'
  return 'web'
}
