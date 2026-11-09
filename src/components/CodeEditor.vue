<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { EditorView, keymap } from '@codemirror/view'
import { EditorState, Compartment } from '@codemirror/state'
import { basicSetup } from 'codemirror'
import { indentWithTab } from '@codemirror/commands'
import { html } from '@codemirror/lang-html'
import { css } from '@codemirror/lang-css'
import { javascript } from '@codemirror/lang-javascript'
import { vue } from '@codemirror/lang-vue'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags as t } from '@lezer/highlight'

const props = defineProps({
  modelValue: { type: String, default: '' },
  filename: { type: String, default: 'index.html' },
})
const emit = defineEmits(['update:modelValue', 'run'])

const host = ref(null)
let view
const lang = new Compartment()

function langFor(name) {
  const e = name.split('.').pop()
  if (e === 'css') return css()
  if (e === 'js') return javascript()
  if (e === 'vue') return vue()
  if (e === 'json') return javascript()
  if (e === 'html' || e === 'htm') return html()
  return []
}

const metroHighlight = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.moduleKeyword], color: 'var(--syn-keyword)', fontWeight: '600' },
  { tag: [t.tagName], color: 'var(--syn-tag)' },
  { tag: [t.attributeName, t.propertyName], color: 'var(--syn-attr)' },
  { tag: [t.string, t.attributeValue, t.special(t.string)], color: 'var(--syn-string)' },
  { tag: [t.number, t.bool, t.null, t.atom, t.unit], color: 'var(--syn-number)' },
  { tag: [t.comment, t.lineComment, t.blockComment], color: 'var(--syn-comment)', fontStyle: 'italic' },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], color: 'var(--syn-fn)' },
  { tag: [t.className, t.typeName], color: 'var(--syn-fn)' },
  { tag: [t.operator, t.punctuation, t.bracket, t.angleBracket], color: 'var(--syn-punct)' },
  { tag: [t.variableName, t.definition(t.variableName)], color: 'var(--syn-var)' },
])

const theme = EditorView.theme({
  '&': { height: '100%', fontSize: '14px', backgroundColor: 'var(--editor-bg)', color: 'var(--editor-ink)' },
  '.cm-scroller': { fontFamily: 'var(--font-mono)', lineHeight: '1.6' },
  '.cm-gutters': { backgroundColor: 'var(--editor-gutter)', color: 'var(--ink-faint)', border: 'none' },
  '.cm-activeLine': { backgroundColor: 'var(--editor-active)' },
  '.cm-activeLineGutter': { backgroundColor: 'var(--editor-active)' },
  '&.cm-focused': { outline: 'none' },
  '.cm-cursor': { borderLeftColor: 'var(--accent)', borderLeftWidth: '2px' },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection': { backgroundColor: 'var(--editor-sel) !important' },
  '.cm-matchingBracket': { backgroundColor: 'var(--editor-sel)', outline: 'none' },
  '.cm-tooltip': { border: '1px solid var(--line)', backgroundColor: 'var(--paper)' },
  '.cm-tooltip-autocomplete > ul > li[aria-selected]': { backgroundColor: 'var(--accent)', color: 'var(--accent-ink)' },
})

onMounted(() => {
  view = new EditorView({
    parent: host.value,
    state: EditorState.create({
      doc: props.modelValue,
      extensions: [
        basicSetup,
        keymap.of([
          indentWithTab,
          { key: 'Mod-Enter', run: () => (emit('run'), true) },
          { key: 'Mod-s', run: () => (emit('run'), true) },
        ]),
        lang.of(langFor(props.filename)),
        syntaxHighlighting(metroHighlight),
        theme,
        EditorState.tabSize.of(2),
        EditorView.lineWrapping,
        EditorView.updateListener.of((u) => {
          if (u.docChanged) emit('update:modelValue', u.state.doc.toString())
        }),
      ],
    }),
  })
})

watch(
  () => props.modelValue,
  (v) => {
    if (view && v !== view.state.doc.toString()) {
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: v } })
    }
  },
)
watch(
  () => props.filename,
  (f) => view && view.dispatch({ effects: lang.reconfigure(langFor(f)) }),
)

onBeforeUnmount(() => view && view.destroy())
</script>

<template>
  <div ref="host" class="code-editor"></div>
</template>

<style scoped>
.code-editor {
  height: 100%;
  min-height: 0;
  overflow: hidden;
}
.code-editor :deep(.cm-editor) {
  height: 100%;
}
</style>
