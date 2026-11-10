import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  // Server-only modules (src/lib/orders.ts) are tested directly; the guard is for client bundles.
  resolve: { alias: { 'server-only': new URL('./node_modules/server-only/empty.js', import.meta.url).pathname } },
  test: {
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    include: ['tests/int/**/*.int.spec.ts'],
    // Test files share one local D1 (SQLite) database, so run them one at a time.
    fileParallelism: false,
  },
})
