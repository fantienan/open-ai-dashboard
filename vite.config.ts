import fs from 'node:fs'
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'

const genWatchIgnore = ({ includes }: { includes: string[] }) => {
  return fs.readdirSync(path.resolve(__dirname)).reduce((prev, file) => {
    if (!includes.some((v) => v === file)) prev.push(path.resolve(__dirname, file))
    return prev
  }, [] as string[])
}

export default defineConfig({
  envPrefix: ['BIZ_'],
  plugins: [react(), tailwindcss()],

  server: {
    host: '0.0.0.0',
    watch: {
      ignored: genWatchIgnore({ includes: ['src', 'public', 'index.html', '.env', '.env.local'] }),
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@@/ai-server': path.resolve(__dirname, 'packages/ai-server/src'),
    },
  },
})
