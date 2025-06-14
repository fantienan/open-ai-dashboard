import fs from 'fs'
import path from 'path'
import esbuildPluginCopy from 'esbuild-plugin-copy'
import { defineConfig } from 'tsup'
import esbuildPluginPrepare from './esbuild-plugin/esbuild-plugin-prepare.ts'
import { outDirname, shareConfig, sqliteNativeBindingFilename, workspacePath } from './tsup-share-config.ts'

export default defineConfig([
  {
    ...shareConfig,
    minify: true,
    define: {
      'process.env.NODE_ENV': '"production"',
      'import.meta.dirname': '__dirname', // 将 import.meta.dirname 转换为 __dirname
      'import.meta.filename': '__filename', // 如果需要的话
    },
    esbuildOptions: (options) => {
      options.banner = {
        js: `#!/usr/bin/env node 
require = require('node:module').createRequire(__filename);
`,
      }
      if (options.minify) {
        // 最大程度压缩配置
        options.minifyWhitespace = true // 移除空白字符
        options.minifyIdentifiers = true // 压缩变量名
        options.minifySyntax = true // 压缩语法
        options.treeShaking = true
        options.drop = ['debugger'] // 移除 debugger 语句
        options.legalComments = 'none' // 移除法律注释
        //   options.mangleProps = /^_/ // 压缩以下划线开头的属性名
      }
    },
    esbuildPlugins: [
      ...(shareConfig.esbuildPlugins ?? []),
      esbuildPluginPrepare({ workspacePath, sqliteNativeBindingFilename }),
    ],
    onSuccess: async () => {
      // 替换 node:sea 相关内容
      const buildFiles = fs.readdirSync('build')

      const jsFiles = buildFiles.filter((file) => file.endsWith('.js') || file.endsWith('.cjs'))
      let totalSize = 0

      for (const file of jsFiles) {
        const filePath = path.join(outDirname, file)
        const stats = fs.statSync(filePath)
        totalSize += stats.size
        let content = fs.readFileSync(filePath, 'utf8')
        if (content.includes("require('sea')")) {
          // 替换被转换的 sea 导入
          content = content.replace(/require\('sea'\);/g, "require('node:sea')")

          fs.writeFileSync(filePath, content)
          console.log(`✅ 已替换 ${file} 中的 node sea 导入`)
        }
      }
      console.log(`打包文件大小: ${(totalSize / 1024 / 1024).toFixed(2)} MB`)
      console.log('✅ 打包所有依赖成功！')
    },
  },
])
