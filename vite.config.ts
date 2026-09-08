/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// Extension-ful specifier because the config is typechecked under moduleResolution node16.
import { MAX_GUESSES } from './src/lib/gameConstants.js'

// The homepage meta description quotes the guess limit, and as a hand-written string in a static file
// it drifted from the game twice — it still read "Seven guesses" long after the limit became 15, which
// is the copy Google shows in search results. Substituting it at build time leaves one source of
// truth. Runs before Vite's own %VAR% env handling so the token can never be mistaken for an env var.
function guessLimit() {
  return {
    name: 'cosmodle-guess-limit',
    transformIndexHtml: {
      order: 'pre' as const,
      handler: (html: string) => html.replaceAll('%MAX_GUESSES%', String(MAX_GUESSES)),
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), guessLimit()],
  test: {
    environment: 'node',
  },
})
