# Фронтенд-метро

Учебник-схема метро: HTML, CSS, JavaScript, инструменты (npm, DevTools, Git, Vite) и Vue.
Каждая станция — теория с живыми примерами и практика с автопроверкой прямо в браузере.

**Сайт:** https://undemorbe.github.io/frontend-roadmap/

## Разработка

```bash
npm install
npm run dev        # http://localhost:5190
npm run build      # сборка в dist/
npm run selftest   # headless-прогон всех задач (нужен Google Chrome)
```

`npm run selftest -- h1,v12` — проверить только выбранные станции.
То же самое в браузере: `#/selftest` или `#/selftest?only=h1,v12`.

## Как устроено

- `src/data/lines.js` — линии, станции и пересадки.
- `src/content/<id>.md` — уроки. Блоки ```` ```task ```` описывают задания,
  ```` ```html preview ```` (и `css`/`js`, флаг `vue`) — живые примеры,
  `> [!tip]` / `[!note]` / `[!warn]` / `[!info]` — врезки.
- `src/lib/runner.js` — запуск кода в iframe (режимы `web`, `js`, `vue`, `sfc`, `config`) и контекст проверок.

Самопроверка требует, чтобы стартовый код каждой задачи **не** проходил проверки, а эталонное решение — проходило.

## Деплой

`.github/workflows/deploy.yml`: на каждый push и pull request — `npm ci`, сборка и самопроверка всех задач;
при push в `main` сборка публикуется на GitHub Pages (Settings → Pages → Source: GitHub Actions).
