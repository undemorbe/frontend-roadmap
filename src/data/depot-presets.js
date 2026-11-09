export const presets = {
  web: {
    label: 'HTML + CSS + JS',
    mode: 'web',
    files: {
      'index.html': '<h1>Привет, депо!</h1>\n<p>Здесь можно экспериментировать с любым кодом.</p>\n<button class="btn">Нажми меня</button>\n',
      'style.css': 'body {\n  font-family: system-ui, sans-serif;\n  padding: 24px;\n}\n\n.btn {\n  padding: 10px 18px;\n  border: 0;\n  border-radius: 8px;\n  background: #2167c9;\n  color: white;\n  cursor: pointer;\n}\n',
      'script.js': "const btn = document.querySelector('.btn')\nlet clicks = 0\n\nbtn.addEventListener('click', () => {\n  clicks++\n  btn.textContent = `Нажато: ${clicks}`\n  console.log('клик', clicks)\n})\n",
    },
  },
  js: {
    label: 'Только JavaScript',
    mode: 'js',
    files: {
      'script.js': "// Результат смотрите в консоли справа\nconst numbers = [3, 1, 4, 1, 5, 9, 2, 6]\n\nconst even = numbers.filter((n) => n % 2 === 0)\nconst sum = numbers.reduce((acc, n) => acc + n, 0)\n\nconsole.log('чётные:', even)\nconsole.log('сумма:', sum)\n",
    },
  },
  vue: {
    label: 'Vue (без сборки)',
    mode: 'vue',
    files: {
      'index.html': '<div id="app">\n  <h1>{{ title }}</h1>\n  <button @click="count++">Счётчик: {{ count }}</button>\n</div>\n',
      'app.js': "const { createApp, ref } = Vue\n\ncreateApp({\n  setup() {\n    const title = ref('Vue в депо')\n    const count = ref(0)\n    return { title, count }\n  },\n}).mount('#app')\n",
    },
  },
  sfc: {
    label: 'Vue SFC (.vue)',
    mode: 'sfc',
    files: {
      'App.vue': '<script setup>\nimport { ref } from \'vue\'\nimport Counter from \'./Counter.vue\'\n\nconst title = ref(\'Однофайловые компоненты\')\n</script>\n\n<template>\n  <h1>{{ title }}</h1>\n  <Counter :start="5" />\n</template>\n\n<style>\nbody { font-family: system-ui, sans-serif; padding: 16px; }\n</style>\n',
      'Counter.vue': '<script setup>\nimport { ref } from \'vue\'\n\nconst props = defineProps({ start: { type: Number, default: 0 } })\nconst count = ref(props.start)\n</script>\n\n<template>\n  <button class="counter" @click="count++">Нажато: {{ count }}</button>\n</template>\n\n<style scoped>\n.counter {\n  padding: 10px 16px;\n  border: 0;\n  border-radius: 8px;\n  background: #2e9e6a;\n  color: white;\n  font-size: 16px;\n}\n</style>\n',
    },
  },
}

