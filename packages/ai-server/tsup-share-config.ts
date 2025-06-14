import esbuildPluginCopy from 'esbuild-plugin-copy'
import type { Options } from 'tsup'
import esbuildPluginPino from './esbuild-plugin/esbuild-plugin-pino.mjs'

export const libDirname = 'lib' // 目标目录
export const outDirname = 'build' // 输出目录
export const sqliteNativeBindingFilename = 'better_sqlite3.node'
export const workspacePath = `process.env.BIZ_WORKSPACE`

export const shareConfig: Options = {
  entry: ['src/server.ts'], // 主入口点
  format: ['cjs'], // 保持 CJS 格式用于生产环境
  outDir: outDirname,
  clean: true,
  splitting: false,
  bundle: true, // 打包所有依赖
  noExternal: [/.*/], // 打包所有外部依赖
  minify: false, // 可选：是否压缩代码
  target: 'node22', // 匹配你的 Node.js 版本要求
  platform: 'node',
  treeshake: true, // 启用树摇优化
  external: [],
  esbuildPlugins: [
    esbuildPluginCopy({
      assets: [
        {
          from: `node_modules/better-sqlite3/build/Release/${sqliteNativeBindingFilename}`,
          to: libDirname,
        },
        {
          from: 'src/database/migrations/**/*',
          to: `migrations`,
        },
      ],
    }),
    esbuildPluginPino({
      transports: ['pino-pretty', 'pino-roll'],
      dynamicPath: true,
      libDirname,
      workspacePath,
    }),
  ],
}
