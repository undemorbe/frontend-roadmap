// Headless-прогон самопроверки: собранный сайт (dist) + страница #/selftest.
// Для каждой задачи стартовый код должен НЕ проходить проверки, а эталонное решение — проходить.
// Запуск: npm run build && npm run selftest   (нужен установленный Google Chrome)
import { preview } from 'vite'
import { chromium } from 'playwright-core'

const only = process.argv[2] ? `?only=${process.argv[2]}` : ''
const TIMEOUT = 10 * 60 * 1000

const server = await preview({ preview: { port: 4173, strictPort: false }, logLevel: 'warn' })
const base = server.resolvedUrls.local[0]
const browser = await chromium.launch({ channel: process.env.CHROME_CHANNEL || 'chrome' })
let exitCode = 0

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const pageErrors = []
  page.on('pageerror', (e) => pageErrors.push(e.message))

  console.log(`Самопроверка: ${base}#/selftest${only}`)
  await page.goto(`${base}#/selftest${only}`)

  let last = -1
  const started = Date.now()
  while (true) {
    const state = await page.evaluate(() => ({
      done: !!window.__selftest,
      count: document.querySelectorAll('table.selftest tr').length,
    }))
    if (state.done) break
    if (Date.now() - started > TIMEOUT) throw new Error('Превышено время ожидания самопроверки')
    if (state.count !== last && state.count % 20 === 0) console.log(`  …проверено ${state.count}`)
    last = state.count
    await page.waitForTimeout(1000)
  }

  const rows = await page.evaluate(() => window.__selftest)
  const failed = rows.filter((r) => !r.ok)
  console.log(`\nВсего задач: ${rows.length}, провалено: ${failed.length}`)
  for (const f of failed) console.log(`  ✕ ${f.id} ${f.task} — ${f.msg}`)
  if (pageErrors.length) console.log(`\nОшибки страницы (не считаются провалом):\n  ${pageErrors.slice(0, 10).join('\n  ')}`)
  if (!rows.length || failed.length) exitCode = 1
} catch (e) {
  console.error(e)
  exitCode = 1
} finally {
  await browser.close()
  await new Promise((r) => server.httpServer.close(r))
}

process.exit(exitCode)
