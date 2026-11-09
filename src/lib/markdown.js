import { Marked } from 'marked'
import hljs from 'highlight.js/lib/core'
import xml from 'highlight.js/lib/languages/xml'
import css from 'highlight.js/lib/languages/css'
import javascript from 'highlight.js/lib/languages/javascript'
import bash from 'highlight.js/lib/languages/bash'
import json from 'highlight.js/lib/languages/json'

hljs.registerLanguage('html', xml)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('vue', xml)
hljs.registerLanguage('css', css)
hljs.registerLanguage('js', javascript)
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('sh', bash)
hljs.registerLanguage('json', json)

export function highlight(code, lang) {
  const l = (lang || '').split(/\s+/)[0]
  if (l && hljs.getLanguage(l)) return hljs.highlight(code, { language: l }).value
  return escapeHtml(code)
}

export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-z]+;/g, '')
    .replace(/[^a-zа-яё0-9\s-]/gi, '')
    .trim()
    .replace(/\s+/g, '-')
}

const CALLOUTS = {
  note: 'Заметка',
  tip: 'Совет',
  warn: 'Осторожно',
  info: 'Как это связано',
  task: 'Мини-задача',
}

/**
 * Разбирает урок: теория (HTML), оглавление, демо-блоки и задачи практики.
 * ```task — JS-литерал задачи; ```html preview — код с живым результатом.
 */
export function parseLesson(source) {
  const tasks = []
  const demos = []
  const toc = []

  const md = new Marked({ gfm: true })
  md.use({
    renderer: {
      heading({ tokens, depth, text }) {
        const inner = this.parser.parseInline(tokens)
        const id = slugify(text)
        if (depth === 2) toc.push({ id, text: inner.replace(/<[^>]+>/g, '') })
        return `<h${depth} id="${id}"><a class="anchor" href="#${id}" aria-hidden="true">#</a>${inner}</h${depth}>\n`
      },
      code({ text, lang }) {
        const info = (lang || '').trim()
        if (info === 'task') {
          try {
            // eslint-disable-next-line no-new-func
            tasks.push(new Function(`return (${text})`)())
          } catch (e) {
            console.error('Ошибка в описании задачи', e, text)
          }
          return ''
        }
        const [l, ...flags] = info.split(/\s+/)
        const body = `<pre class="code"><span class="code-lang">${escapeHtml(l || 'text')}</span><code class="hljs">${highlight(text, l)}</code></pre>`
        if (flags.includes('preview')) {
          const i = demos.length
          demos.push({ lang: l, code: text, flags })
          return `<figure class="demo" data-demo="${i}">${body}<div class="demo-out"><div class="demo-bar"><span>Результат</span><button type="button" class="demo-open" data-demo-open="${i}">Открыть в песочнице ↗</button></div><div class="demo-frame" data-demo-frame="${i}"></div></div></figure>`
        }
        return body
      },
      blockquote({ tokens }) {
        let html = this.parser.parse(tokens)
        const m = html.match(/^<p>\[!(\w+)\]\s*/)
        if (m && CALLOUTS[m[1]]) {
          html = html.replace(m[0], '<p>')
          return `<aside class="callout callout-${m[1]}"><div class="callout-title">${CALLOUTS[m[1]]}</div>${html}</aside>`
        }
        return `<blockquote>${html}</blockquote>`
      },
      link({ href, title, tokens }) {
        const text = this.parser.parseInline(tokens)
        const ext = /^https?:/.test(href)
        return `<a href="${href}"${title ? ` title="${title}"` : ''}${ext ? ' target="_blank" rel="noopener"' : ''}>${text}</a>`
      },
      table(token) {
        // оборачиваем таблицы для горизонтальной прокрутки
        const head = token.header.map((c) => `<th>${this.parser.parseInline(c.tokens)}</th>`).join('')
        const rows = token.rows
          .map((r) => `<tr>${r.map((c) => `<td>${this.parser.parseInline(c.tokens)}</td>`).join('')}</tr>`)
          .join('')
        return `<div class="table-wrap"><table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>`
      },
    },
  })

  const html = md.parse(source)
  return { html, tasks, demos, toc }
}

export function renderInline(text) {
  const md = new Marked({ gfm: true })
  return md.parse(text || '')
}
