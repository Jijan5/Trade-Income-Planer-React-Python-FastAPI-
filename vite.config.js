import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  server: {
    host: true,
    watch: {
      ignored: ['**/venv/**'],
    },
    allowedHosts: [
      "tradeplanner.my.id",
      ".tradeplanner.my.id"
    ]
  },
  build: {
    sourcemap: false, // Security: Disable source maps in production to hide source code
  },
})